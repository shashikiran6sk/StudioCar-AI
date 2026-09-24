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

const DOCKER_OUTPUT_PREFIX = "worker-database-url=";

interface ComposeRun {
  dockerInvoked: boolean;
  status: number | null;
  stderr: string;
  workerDatabaseUrl: string | undefined;
}

const roots: string[] = [];

/**
 * Runs the real compose wrapper from a scratch copy of the repository layout,
 * so it reads a settings file written here instead of the developer's own. A
 * stand-in `docker` records the worker's database address rather than
 * starting anything.
 */
function runLocalCompose(settings: string): ComposeRun {
  const root = mkdtempSync(path.join(tmpdir(), "studiocar-compose-"));
  roots.push(root);
  mkdirSync(path.join(root, "scripts"));
  mkdirSync(path.join(root, "bin"));
  for (const script of ["local-compose.sh", "local-environment.sh"]) {
    copyFileSync(
      path.join(repositoryRoot, "scripts", script),
      path.join(root, "scripts", script),
    );
  }
  writeFileSync(path.join(root, ".env.local"), settings);
  const docker = path.join(root, "bin", "docker");
  writeFileSync(
    docker,
    `#!/bin/sh\nprintf '${DOCKER_OUTPUT_PREFIX}%s' "\${LOCAL_WORKER_DATABASE_URL-}"\n`,
  );
  chmodSync(docker, 0o755);

  const environment: NodeJS.ProcessEnv = {
    HOME: root,
    PATH: `${path.join(root, "bin")}${path.delimiter}${process.env["PATH"] ?? ""}`,
  };
  const result = spawnSync(
    "sh",
    [path.join(root, "scripts", "local-compose.sh"), "config"],
    { encoding: "utf8", env: environment },
  );
  const dockerInvoked = result.stdout.startsWith(DOCKER_OUTPUT_PREFIX);
  return {
    dockerInvoked,
    status: result.status,
    stderr: result.stderr,
    workerDatabaseUrl: dockerInvoked
      ? result.stdout.slice(DOCKER_OUTPUT_PREFIX.length)
      : undefined,
  };
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
});
