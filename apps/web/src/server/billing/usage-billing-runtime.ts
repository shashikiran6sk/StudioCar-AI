import { parseSessionEnvironment } from "@studiocar/config";
import { createDatabaseClient } from "@studiocar/database-runtime";
import { PrismaUsageBillingRepository } from "../db/repositories/usage-billing-repository";

import { UsageBillingService } from "./usage-billing-service";
import { getPlanCatalog } from "../plans/get-plan-catalog";

let usageBillingService: UsageBillingService | undefined;

export function getUsageBillingService(): UsageBillingService {
  if (usageBillingService) return usageBillingService;

  const environment = parseSessionEnvironment(process.env);
  const database = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
  });
  usageBillingService = new UsageBillingService(
    new PrismaUsageBillingRepository(database),
    { list: getPlanCatalog },
  );
  return usageBillingService;
}
