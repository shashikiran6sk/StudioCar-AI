import { describe, expect, it } from "vitest";

import {
  createDatabaseClient,
  createDatabasePoolOptions,
} from "../../../packages/database-runtime/src/client";

const connectionString =
  "postgresql://studiocar:secret@localhost:5432/studiocar_test";

describe("database client", () => {
  it("uses conservative pool defaults suitable for serverless instances", () => {
    expect(createDatabasePoolOptions({ connectionString })).toEqual({
      connectionString,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
      max: 10,
    });
  });

  it("rejects non-PostgreSQL connections and unbounded pools", () => {
    expect(() =>
      createDatabasePoolOptions({ connectionString: "mysql://localhost/app" }),
    ).toThrow("must use PostgreSQL");
    expect(() =>
      createDatabasePoolOptions({ connectionString, poolSize: 51 }),
    ).toThrow("poolSize");
  });

  it("constructs a client without eagerly opening a database connection", async () => {
    const client = createDatabaseClient({ connectionString, poolSize: 1 });

    expect(client).toBeDefined();
    await expect(client.$disconnect()).resolves.toBeUndefined();
  });
});
