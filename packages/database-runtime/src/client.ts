import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

const DEFAULT_POOL_SIZE = 10;
const DEFAULT_CONNECTION_TIMEOUT_MS = 5_000;
const DEFAULT_IDLE_TIMEOUT_MS = 30_000;

export interface DatabaseClientOptions {
  connectionString: string;
  poolSize?: number;
  connectionTimeoutMs?: number;
  idleTimeoutMs?: number;
  log?: readonly ("warn" | "error")[];
}

export interface DatabasePoolOptions {
  connectionString: string;
  max: number;
  connectionTimeoutMillis: number;
  idleTimeoutMillis: number;
}

function boundedInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
  label: string,
): number {
  const resolved = value ?? fallback;

  if (!Number.isInteger(resolved) || resolved < minimum || resolved > maximum) {
    throw new RangeError(
      `${label} must be an integer between ${String(minimum)} and ${String(maximum)}.`,
    );
  }

  return resolved;
}

export function createDatabasePoolOptions(
  options: DatabaseClientOptions,
): DatabasePoolOptions {
  if (!/^postgres(?:ql)?:\/\//.test(options.connectionString)) {
    throw new TypeError("Database connection string must use PostgreSQL.");
  }

  return {
    connectionString: options.connectionString,
    max: boundedInteger(options.poolSize, DEFAULT_POOL_SIZE, 1, 50, "poolSize"),
    connectionTimeoutMillis: boundedInteger(
      options.connectionTimeoutMs,
      DEFAULT_CONNECTION_TIMEOUT_MS,
      100,
      30_000,
      "connectionTimeoutMs",
    ),
    idleTimeoutMillis: boundedInteger(
      options.idleTimeoutMs,
      DEFAULT_IDLE_TIMEOUT_MS,
      1_000,
      300_000,
      "idleTimeoutMs",
    ),
  };
}

export function createDatabaseClient(options: DatabaseClientOptions): PrismaClient {
  const adapter = new PrismaPg(createDatabasePoolOptions(options));

  return new PrismaClient({
    adapter,
    log: [...(options.log ?? ["warn", "error"])],
  });
}
