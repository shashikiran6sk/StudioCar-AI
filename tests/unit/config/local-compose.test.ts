import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(import.meta.dirname, "../../..");
const APPLICATION_DATABASE_URL =
  "postgresql://postgres:secret@db.project.supabase.co:5432/postgres";
const POOLER_DATABASE_URL =
  "postgresql://postgres.project:secret@aws-0-ap-south-1.pooler.supabase.com:5432/postgres";

const DEVELOPMENT_QUEUE_URL =
  "https://sqs.ap-south-1.amazonaws.com/123456789012/studiocar-dev-image-processing";

const DOCKER_INVOKED_MARKER = "docker-invoked";
const DOCKER_ARGUMENTS_PREFIX = "docker-arguments=";
const WORKER_SETTING_PREFIX = "LOCAL_WORKER_";

interface ComposeRun {
  dockerInvoked: boolean;
  dockerArguments: string | undefined;
  status: number | null;
  stderr: string;
  workerSettings: Readonly<Record<string, string>>;
  workerDatabaseUrl: string | undefined;
}

const roots: string[] = [];

function writeExecutable(file: string, contents: string): void {
  writeFileSync(file, contents);
  chmodSync(file, 0o755);
}

/**
 * The worker settings the stand-in `docker` saw, without their prefix. An
 * exported empty value is kept, because it means something different from an
 * unset one: compose substitutes its Local default only for the latter.
 */
function parseWorkerSettings(lines: readonly string[]): Record<string, string> {
  return Object.fromEntries(
    lines
      .filter((line) => line.startsWith(WORKER_SETTING_PREFIX))
      .map((line) => {
        const separator = line.indexOf("=");
        return [
          line.slice(WORKER_SETTING_PREFIX.length, separator),
          line.slice(separator + 1),
        ];
      }),
  );
}

/**
 * Runs a real local-stack script from a scratch copy of the repository
 * layout, so it reads a settings file written here instead of the developer's
 * own. A stand-in `docker` records its arguments and the worker settings
 * rather than starting anything, and a stand-in `pnpm` does nothing.
 */
function runScript(
  script: string,
  settings: string,
  scriptArguments: readonly string[],
): ComposeRun {
  const root = mkdtempSync(path.join(tmpdir(), "studiocar-compose-"));
  roots.push(root);
  mkdirSync(path.join(root, "scripts"));
  mkdirSync(path.join(root, "bin"));
  for (const file of ["infra-up.sh", "local-compose.sh", "local-environment.sh"]) {
    copyFileSync(
      path.join(repositoryRoot, "scripts", file),
      path.join(root, "scripts", file),
    );
  }
  writeFileSync(path.join(root, ".env.local"), settings);
  writeExecutable(
    path.join(root, "bin", "docker"),
    [
      "#!/bin/sh",
      `echo ${DOCKER_INVOKED_MARKER}`,
      `echo "${DOCKER_ARGUMENTS_PREFIX}$*"`,
      `env | grep '^${WORKER_SETTING_PREFIX}' || true`,
      "",
    ].join("\n"),
  );
  writeExecutable(path.join(root, "bin", "pnpm"), "#!/bin/sh\nexit 0\n");

  const environment: NodeJS.ProcessEnv = {
    HOME: root,
    PATH: `${path.join(root, "bin")}${path.delimiter}${process.env["PATH"] ?? ""}`,
  };
  const result = spawnSync(
    "sh",
    [path.join(root, "scripts", script), ...scriptArguments],
    { encoding: "utf8", env: environment },
  );
  const lines = result.stdout.split("\n");
  const dockerInvoked = lines.includes(DOCKER_INVOKED_MARKER);
  const workerSettings = parseWorkerSettings(lines);
  return {
    dockerInvoked,
    dockerArguments: lines
      .find((line) => line.startsWith(DOCKER_ARGUMENTS_PREFIX))
      ?.slice(DOCKER_ARGUMENTS_PREFIX.length),
    status: result.status,
    stderr: result.stderr,
    workerSettings,
    workerDatabaseUrl: dockerInvoked ? workerSettings["DATABASE_URL"] ?? "" : undefined,
  };
}

function runLocalCompose(settings: string): ComposeRun {
  return runScript("local-compose.sh", settings, ["config"]);
}

function runInfraUp(settings: string): ComposeRun {
  return runScript("infra-up.sh", settings, []);
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe("scripts/local-compose.sh", () => {
  it("gives the worker the application's database by default", () => {
    const run = runLocalCompose(
      `APP_ENV=development\nDATABASE_URL=${APPLICATION_DATABASE_URL}\n`,
    );

    expect(run.status).toBe(0);
    expect(run.workerDatabaseUrl).toBe(APPLICATION_DATABASE_URL);
  });

  it("gives the worker WORKER_DATABASE_URL when Development sets one", () => {
    const run = runLocalCompose(
      [
        "APP_ENV=development",
        `DATABASE_URL=${APPLICATION_DATABASE_URL}`,
        `WORKER_DATABASE_URL=${POOLER_DATABASE_URL}`,
        "",
      ].join("\n"),
    );

    expect(run.status).toBe(0);
    expect(run.workerDatabaseUrl).toBe(POOLER_DATABASE_URL);
  });

  it("treats an empty WORKER_DATABASE_URL as unset", () => {
    const run = runLocalCompose(
      `APP_ENV=development\nDATABASE_URL=${APPLICATION_DATABASE_URL}\nWORKER_DATABASE_URL=\n`,
    );

    expect(run.status).toBe(0);
    expect(run.workerDatabaseUrl).toBe(APPLICATION_DATABASE_URL);
  });

  it("rewrites a localhost worker address to the Docker host", () => {
    const run = runLocalCompose(
      [
        "APP_ENV=development",
        `DATABASE_URL=${APPLICATION_DATABASE_URL}`,
        "WORKER_DATABASE_URL=postgresql://dev:secret@localhost:6432/studiocar",
        "",
      ].join("\n"),
    );

    expect(run.workerDatabaseUrl).toBe(
      "postgresql://dev:secret@host.docker.internal:6432/studiocar",
    );
  });

  it("refuses WORKER_DATABASE_URL outside Development", () => {
    const run = runLocalCompose(
      `APP_ENV=local\nWORKER_DATABASE_URL=${POOLER_DATABASE_URL}\n`,
    );

    expect(run.status).not.toBe(0);
    expect(run.stderr).toContain("WORKER_DATABASE_URL is a Development setting");
    expect(run.dockerInvoked).toBe(false);
  });

  it("gives the worker the Development AWS SQS queue, and never ElasticMQ", () => {
    const run = runLocalCompose(
      [
        "APP_ENV=development",
        `DATABASE_URL=${APPLICATION_DATABASE_URL}`,
        `SQS_IMAGE_QUEUE_URL=${DEVELOPMENT_QUEUE_URL}`,
        "SQS_ACCESS_KEY_ID=",
        "",
      ].join("\n"),
    );

    expect(run.status).toBe(0);
    expect(run.workerSettings).toMatchObject({
      SQS_IMAGE_QUEUE_URL: DEVELOPMENT_QUEUE_URL,
      // Exported empty, so compose cannot substitute its ElasticMQ defaults.
      SQS_ENDPOINT: "",
      SQS_ACCESS_KEY_ID: "",
      SQS_SECRET_ACCESS_KEY: "",
    });
  });

  it("leaves the Local worker on the compose ElasticMQ defaults", () => {
    const run = runLocalCompose("APP_ENV=local\nREMOVEBG_API_KEY=key\n");

    expect(run.status).toBe(0);
    expect(
      Object.keys(run.workerSettings).filter((key) => key.startsWith("SQS_")),
    ).toEqual([]);
  });
});

describe("scripts/infra-up.sh", () => {
  it("starts only the Development profile once the queue is configured", () => {
    const run = runInfraUp(
      `APP_ENV=development\nDATABASE_URL=${APPLICATION_DATABASE_URL}\nSQS_IMAGE_QUEUE_URL=${DEVELOPMENT_QUEUE_URL}\n`,
    );

    expect(run.status).toBe(0);
    expect(run.dockerArguments).toContain("--profile development up -d");
  });

  it("refuses Development without its AWS SQS queue before starting anything", () => {
    const run = runInfraUp(
      `APP_ENV=development\nDATABASE_URL=${APPLICATION_DATABASE_URL}\nSQS_IMAGE_QUEUE_URL=\n`,
    );

    expect(run.status).not.toBe(0);
    expect(run.stderr).toContain("SQS_IMAGE_QUEUE_URL is required in Development");
    expect(run.dockerInvoked).toBe(false);
  });

  it("starts the Local profile without any queue setting", () => {
    const run = runInfraUp("APP_ENV=local\nREMOVEBG_API_KEY=key\n");

    expect(run.status).toBe(0);
    expect(run.dockerArguments).toContain("--profile infra up -d");
  });
});
