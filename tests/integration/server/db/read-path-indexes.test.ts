import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Prisma } from "../../../../packages/database-runtime/generated/prisma/client";
import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const REQUIRED_INDEX_NAMES = [
  "Vehicle_userId_createdAt_id_idx",
  "Vehicle_userId_name_id_idx",
  "Vehicle_userId_status_createdAt_id_idx",
  "Vehicle_userId_status_name_id_idx",
  "ProcessingJob_userId_status_completedAt_vehicleId_idx",
  "ProcessingJob_userId_vehicleId_createdAt_id_idx",
  "ProcessingJob_userId_vehicleId_status_completedAt_id_idx",
  "ProcessingJob_vehicleId_batchRequestHash_displayOrder_id_idx",
];

interface IndexNameRow {
  indexname: string;
}

databaseDescribe("read-path indexes", () => {
  let database: ReturnType<typeof createDatabaseClient>;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("installs every reviewed cursor, dashboard, portfolio, and batch index", async () => {
    const rows = await database.$queryRaw<IndexNameRow[]>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN (${Prisma.join(REQUIRED_INDEX_NAMES)})
      ORDER BY indexname
    `;

    expect(rows.map((row) => row.indexname).sort()).toEqual(
      [...REQUIRED_INDEX_NAMES].sort(),
    );
  });
});
