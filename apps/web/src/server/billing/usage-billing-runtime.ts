import { getWebDatabase } from "../db/web-database";
import { PrismaUsageBillingRepository } from "../db/repositories/usage-billing-repository";

import { UsageBillingService } from "./usage-billing-service";
import { getPlanCatalog } from "../plans/get-plan-catalog";

let usageBillingService: UsageBillingService | undefined;

export function getUsageBillingService(): UsageBillingService {
  if (usageBillingService) return usageBillingService;

  const database = getWebDatabase();
  usageBillingService = new UsageBillingService(
    new PrismaUsageBillingRepository(database),
    { list: getPlanCatalog },
  );
  return usageBillingService;
}
