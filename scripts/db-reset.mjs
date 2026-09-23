#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const webDirectory = path.join(repositoryRoot, "apps", "web");

/**
 * Hosts that can only be a developer's own machine or a compose network. Any
 * other host is treated as somebody's real database.
 */
const LOCAL_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "postgres",
  "db",
  "host.docker.internal",
]);

const FORCE_FLAG = "--i-understand-this-destroys-data";

function fail(message) {
  process.stderr.write(`db:reset refused: ${message}\n`);
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) fail("DATABASE_URL is not set.");

let url;
try {
  url = new URL(databaseUrl);
} catch {
  fail("DATABASE_URL is not a valid URL.");
}

if (process.env.NODE_ENV === "production") {
  fail("NODE_ENV is production. This command is local development only.");
}

const forced = process.argv.includes(FORCE_FLAG);
if (!LOCAL_HOSTNAMES.has(url.hostname) && !forced) {
  fail(
    `the database host "${url.hostname}" is not a known local host. ` +
      `This command drops every table. Re-run with ${FORCE_FLAG} only if you are certain.`,
  );
}

// A redacted description, so the log never carries the password.
process.stdout.write(
  `Resetting local database ${url.pathname.replace(/^\//, "")} at ${url.hostname}:${
    url.port || "5432"
  }\n`,
);

// The Prisma CLI is a workspace binary, so it is invoked through pnpm rather
// than assumed to be on PATH.
const steps = [
  ["migrate", "reset", "--force"],
  ["generate"],
];

for (const args of steps) {
  const result = spawnSync("pnpm", ["exec", "prisma", ...args], {
    cwd: webDirectory,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

process.stdout.write(
  "Local database reset: every migration applied, no sample data created.\n",
);
