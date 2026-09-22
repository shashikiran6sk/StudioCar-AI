import { createDatabaseClient } from "@studiocar/database-runtime";

import { PrismaPlanConfigRepository } from "../src/server/db/repositories/plan-config-repository";
import { DEFAULT_PLAN_CONFIGURATIONS } from "../src/server/plans/default-plan-configurations";

/**
 * Installs the canonical plan catalog.
 *
 * This is configuration, not sample data: it creates no users, vehicles or
 * images. Plans that already exist are left untouched, because a plan an
 * administrator has edited belongs to them and not to the deployment, so the
 * command is safe to re-run.
 *
 * Social links are deliberately not seeded. A link row exists only once a real
 * address is supplied; until then the footer renders nothing.
 */
async function seed(): Promise<void> {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to seed configuration.");
  }

  const database = createDatabaseClient({ connectionString: databaseUrl });
  try {
    const created = await new PrismaPlanConfigRepository(database).seedMissing(
      DEFAULT_PLAN_CONFIGURATIONS,
    );
    process.stdout.write(
      `Seeded ${String(created)} plan configurations; existing rows were left unchanged.\n`,
    );
  } finally {
    await database.$disconnect();
  }
}

await seed();
