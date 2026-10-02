import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "../..");
const template = readFileSync(
  join(root, "infrastructure/aws/worker-artifact-publisher.yml"),
  "utf8",
);
const workflow = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const script = join(root, "scripts/publish-worker-artifact.sh");
const COMMIT = "a46352a7c1b365f5d20a1a6f69c2c3a37572a9c0";

/**
 * A stand-in `aws` CLI backed by a directory: put-object honours
 * If-None-Match like S3 does, and head-object returns the stored SHA-256.
 */
const FAKE_AWS = `#!/usr/bin/env bash
set -euo pipefail
echo "$*" >> "$FAKE_S3/calls.log"
command="$2"; shift 2
key=""; body=""; checksum=""; if_none_match=""
while [ $# -gt 0 ]; do
  case "$1" in
    --key) key="$2"; shift 2 ;;
    --body) body="$2"; shift 2 ;;
    --checksum-sha256) checksum="$2"; shift 2 ;;
    --if-none-match) if_none_match="$2"; shift 2 ;;
    *) shift ;;
  esac
done
object="$FAKE_S3/objects/$(printf '%s' "$key" | tr '/' '_')"
mkdir -p "$FAKE_S3/objects"
case "$command" in
  put-object)
    if [ "$if_none_match" = "*" ] && [ -f "$object" ]; then
      echo "An error occurred (PreconditionFailed) when calling the PutObject operation" >&2
      exit 254
    fi
    cp "$body" "$object"; printf '%s' "$checksum" > "$object.sha256" ;;
  head-object) cat "$object.sha256" ;;
esac
`;

interface Workspace {
  archiveDirectory: string;
  fakeS3: string;
  path: string;
}

const workspaces: string[] = [];

function createWorkspace(manifestSha256?: string): Workspace {
  const directory = mkdtempSync(join(tmpdir(), "worker-artifact-"));
  workspaces.push(directory);
  const bin = join(directory, "bin");
  const archiveDirectory = join(directory, "archive");
  const fakeS3 = join(directory, "s3");
  for (const path of [bin, archiveDirectory, fakeS3]) {
    spawnSync("mkdir", ["-p", path]);
  }
  writeFileSync(join(bin, "aws"), FAKE_AWS);
  chmodSync(join(bin, "aws"), 0o755);
  const archive = Buffer.from("PK\u0003\u0004 worker archive");
  writeFileSync(join(archiveDirectory, "image-processing-worker.zip"), archive);
  const sha256 = createHash("sha256").update(archive).digest("hex");
  writeFileSync(
    join(archiveDirectory, "image-processing-worker.manifest.json"),
    `${JSON.stringify({ sha256: manifestSha256 ?? sha256 }, null, 2)}\n`,
  );
  return { archiveDirectory, fakeS3, path: `${bin}:${process.env["PATH"] ?? ""}` };
}

function publish(workspace: Workspace, overrides: Record<string, string> = {}) {
  const output = join(workspace.fakeS3, "github-output");
  const result = spawnSync("bash", [script], {
    encoding: "utf8",
    env: {
      ARCHIVE_DIRECTORY: workspace.archiveDirectory,
      ARTIFACT_BUCKET: "studiocar-artifacts-prod",
      ARTIFACT_PREFIX: "image-processing-worker",
      COMMIT_SHA: COMMIT,
      FAKE_S3: workspace.fakeS3,
      GITHUB_OUTPUT: output,
      NODE_ENV: "test",
      PATH: workspace.path,
      ...overrides,
    },
  });
  const calls = existsSync(join(workspace.fakeS3, "calls.log"))
    ? readFileSync(join(workspace.fakeS3, "calls.log"), "utf8").trim().split("\n")
    : [];
  const outputs = existsSync(output) ? readFileSync(output, "utf8") : "";
  return { calls, outputs, result };
}

afterEach(() => {
  for (const directory of workspaces.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("worker artifact publisher role", () => {
  it("trusts only GitHub Actions runs of this repository's main branch", () => {
    expect(template).toContain("Url: https://token.actions.githubusercontent.com");
    expect(template).toContain('"token.actions.githubusercontent.com:aud": sts.amazonaws.com');
    expect(template).toContain(
      '"token.actions.githubusercontent.com:sub": !Sub repo:${GitHubRepository}:ref:refs/heads/${PublishBranch}',
    );
    expect(template).toContain("Default: shashikiran6sk/StudioCar-AI");
    expect(template).toContain("Default: main");
    expect(template).not.toMatch(/sub":\s*.*\*/);
  });

  it("may only write and verify archives under its prefix, never replace or delete them", () => {
    expect(template).toContain(
      "Resource: !Sub arn:${AWS::Partition}:s3:::${ArtifactBucket}/${ArtifactPrefix}/*",
    );
    expect(template).toContain("- s3:PutObject");
    expect(template).toContain("- s3:GetObject");
    expect(template).not.toMatch(/s3:\*|s3:DeleteObject|s3:PutBucket|Resource: "\*"/);
    const deny = template.split("- Sid: NeverReplaceAnArchive")[1]?.split("- !If")[0];
    expect(deny).toContain("Effect: Deny");
    expect(deny).toContain('"s3:if-none-match": "true"');
  });
});

describe("worker artifact publish job", () => {
  const job = workflow.split("  publish-worker-artifact:")[1]?.split("\n  build-and-e2e:")[0] ?? "";

  it("runs only for merged commits on main, after every check, once configured", () => {
    expect(job).toContain("github.event_name == 'push'");
    expect(job).toContain("github.ref == 'refs/heads/main'");
    expect(job).toContain("vars.WORKER_ARTIFACT_BUCKET != ''");
    expect(job).toContain("vars.WORKER_ARTIFACT_ROLE_ARN != ''");
    for (const need of ["- quality", "- worker-package", "- build-and-e2e"]) {
      expect(job).toContain(need);
    }
  });

  it("publishes the exact tested archive with short-lived OIDC credentials", () => {
    expect(job).toContain("id-token: write");
    expect(job).toContain("name: image-processing-worker-lambda");
    expect(job).toContain("role-to-assume: ${{ vars.WORKER_ARTIFACT_ROLE_ARN }}");
    expect(job).toContain("COMMIT_SHA: ${{ github.sha }}");
    expect(job).not.toMatch(/aws-access-key-id|aws-secret-access-key|secrets\./);
  });

  it("names archives after the first five characters of the commit by default", () => {
    expect(job).toContain("ARTIFACT_SHA_LENGTH: ${{ vars.WORKER_ARTIFACT_SHA_LENGTH || '5' }}");
  });

  it("never cancels a run on main, so every merged commit publishes", () => {
    expect(workflow).toContain(
      "cancel-in-progress: ${{ github.event_name == 'pull_request' }}",
    );
  });
});

describe("publish-worker-artifact.sh", () => {
  it("publishes the archive and its manifest under the commit with conditional, checksummed writes", () => {
    const workspace = createWorkspace();
    const { calls, outputs, result } = publish(workspace);
    expect(result.status).toBe(0);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain(`--key image-processing-worker/${COMMIT}.zip`);
    expect(calls[1]).toContain(`--key image-processing-worker/${COMMIT}.manifest.json`);
    for (const call of calls) {
      expect(call).toContain("--if-none-match *");
      expect(call).toContain("--checksum-sha256");
      expect(call).toContain("--bucket studiocar-artifacts-prod");
    }
    expect(outputs).toContain(`artifact-key=image-processing-worker/${COMMIT}.zip`);
    expect(outputs).toMatch(/sha256=[0-9a-f]{64}/);
  });

  it("treats a re-run for the same commit and bytes as already published", () => {
    const workspace = createWorkspace();
    expect(publish(workspace).result.status).toBe(0);
    const rerun = publish(workspace);
    expect(rerun.result.status).toBe(0);
    expect(rerun.result.stdout).toContain("Already published");
    expect(rerun.calls.filter((call) => call.startsWith("s3api head-object"))).toHaveLength(2);
  });

  it("refuses to replace an archive already published with different bytes", () => {
    const workspace = createWorkspace();
    expect(publish(workspace).result.status).toBe(0);
    writeFileSync(
      join(workspace.fakeS3, "objects", `image-processing-worker_${COMMIT}.zip.sha256`),
      "different-checksum",
    );
    const rerun = publish(workspace);
    expect(rerun.result.status).not.toBe(0);
    expect(rerun.result.stderr).toContain("already exists with different contents");
  });

  it("refuses an archive that does not match its manifest, before calling AWS", () => {
    const workspace = createWorkspace("0".repeat(64));
    const { calls, result } = publish(workspace);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("does not match its manifest");
    expect(calls).toHaveLength(0);
  });

  it("keys the archive by the shortened commit SHA and records the full one", () => {
    const workspace = createWorkspace();
    const { calls, outputs, result } = publish(workspace, { ARTIFACT_SHA_LENGTH: "5" });
    expect(result.status).toBe(0);
    expect(calls[0]).toContain("--key image-processing-worker/a4635.zip");
    expect(calls[1]).toContain("--key image-processing-worker/a4635.manifest.json");
    expect(calls[0]).toContain(`--metadata commit-sha=${COMMIT}`);
    expect(outputs).toContain("artifact-key=image-processing-worker/a4635.zip");
  });

  it("refuses, rather than overwrites, a later commit sharing the short SHA", () => {
    const workspace = createWorkspace();
    expect(publish(workspace, { ARTIFACT_SHA_LENGTH: "5" }).result.status).toBe(0);
    writeFileSync(
      join(workspace.archiveDirectory, "image-processing-worker.zip"),
      "a different archive",
    );
    const differentSha256 = createHash("sha256").update("a different archive").digest("hex");
    writeFileSync(
      join(workspace.archiveDirectory, "image-processing-worker.manifest.json"),
      JSON.stringify({ sha256: differentSha256 }),
    );
    const clash = publish(workspace, {
      ARTIFACT_SHA_LENGTH: "5",
      COMMIT_SHA: `a4635${"f".repeat(35)}`,
    });
    expect(clash.result.status).not.toBe(0);
    expect(clash.result.stderr).toContain("already exists with different contents");
  });

  it.each(["4", "41", "five", ""])("rejects %j as a SHA length", (length) => {
    const workspace = createWorkspace();
    const { calls, result } = publish(workspace, { ARTIFACT_SHA_LENGTH: length });
    if (length === "") {
      // Unset means the full SHA.
      expect(result.status).toBe(0);
      expect(calls[0]).toContain(`--key image-processing-worker/${COMMIT}.zip`);
      return;
    }
    expect(result.status).not.toBe(0);
    expect(calls).toHaveLength(0);
  });

  it("requires a full commit SHA", () => {
    const workspace = createWorkspace();
    const { calls, result } = publish(workspace, { COMMIT_SHA: "main" });
    expect(result.status).not.toBe(0);
    expect(calls).toHaveLength(0);
  });
});
