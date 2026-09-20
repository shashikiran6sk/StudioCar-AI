import { parseSessionEnvironment } from "@studiocar/config";
import {
  createDatabaseClient,
  PrismaUsageBillingRepository,
} from "@studiocar/database";

import { UsageBillingService } from "./usage-billing-service";

let usageBillingService: UsageBillingService | undefined;

export function getUsageBillingService(): UsageBillingService {
  if (usageBillingService) return usageBillingService;

  const environment = parseSessionEnvironment(process.env);
  const database = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
  });
  usageBillingService = new UsageBillingService(
    new PrismaUsageBillingRepository(database),
  );
  return usageBillingService;
}
