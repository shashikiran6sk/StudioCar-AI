#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// Loaded directly through Node's type stripping: both modules are import-free,
// so the reset guard reads the same canonical values as the application.
import {
  APP_ENVIRONMENT_VARIABLE,
  AppEnvironment,
} from "../packages/config/src/app-environment.ts";
import {
  LOCAL_INFRASTRUCTURE,
  LOCAL_SERVICE_HOSTNAMES,
} from "../packages/config/src/local-infrastructure.ts";

const repositoryRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const webDirectory = path.join(repositoryRoot, "apps", "web");

const FORCE_FLAG = "--i-understand-this-destroys-data";

function fail(message) {
  process.stderr.write(`db:reset refused: ${message}\n`);
  process.exit(1);
}

const appEnvironment = process.env[APP_ENVIRONMENT_VARIABLE];
if (appEnvironment !== AppEnvironment.Local) {
  fail(
    `${APP_ENVIRONMENT_VARIABLE} is "${appEnvironment ?? ""}". This command runs only when ` +
      `${APP_ENVIRONMENT_VARIABLE}=${AppEnvironment.Local}; Development and production databases are never reset.`,
  );
}

// The Local profile's database, unless the settings file names another.
const databaseUrl = process.env.DATABASE_URL || LOCAL_INFRASTRUCTURE.databaseUrl;

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
if (!LOCAL_SERVICE_HOSTNAMES.has(url.hostname) && !forced) {
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
// Prisma resolves the same address through the Local profile, but passing it
// explicitly keeps the database that was checked the database that is reset.
const steps = [
  ["migrate", "reset", "--force"],
  ["generate"],
];

for (const args of steps) {
  const result = spawnSync("pnpm", ["exec", "prisma", ...args], {
    cwd: webDirectory,
    env: { ...process.env, DATABASE_URL: databaseUrl },
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
