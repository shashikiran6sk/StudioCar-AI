import { parseRazorpayEnvironment, parseSessionEnvironment } from "@studiocar/config";
import { createDatabaseClient } from "@studiocar/database-runtime";

import { BillingService } from "./billing-service";

let database: ReturnType<typeof createDatabaseClient> | undefined;
let service: BillingService | undefined;

export function getBillingRuntime() {
  const activeDatabase = database ??= createDatabaseClient({ connectionString: parseSessionEnvironment(process.env).DATABASE_URL });
  return {
    database: activeDatabase,
    get service() {
      service ??= new BillingService(activeDatabase, parseRazorpayEnvironment(process.env));
      return service;
    },
  };
}
