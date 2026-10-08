import { readFile } from "node:fs/promises";

import { parseSessionEnvironment } from "@studiocar/config";
import { createDatabaseClient } from "@studiocar/database-runtime";

import { BillingBusinessSchema, BILLING_BUSINESS_CONFIG_KEY } from "../src/server/billing/billing-business";

async function main(): Promise<void> {
  const path = process.argv[2];
  if (!path) throw new Error("Pass the path to a private billing-business JSON file.");
  const value: unknown = JSON.parse(await readFile(path, "utf8"));
  const business = BillingBusinessSchema.parse(value);
  const environment = parseSessionEnvironment(process.env);
  const database = createDatabaseClient({ connectionString: environment.DATABASE_URL });
  try {
    await database.appConfig.upsert({
      where: { key: BILLING_BUSINESS_CONFIG_KEY },
      create: { key: BILLING_BUSINESS_CONFIG_KEY, value: business },
      update: { value: business },
    });
    process.stdout.write("Billing business configuration saved.\n");
  } finally {
    await database.$disconnect();
  }
}

await main();
