import { parseRazorpayEnvironment } from "@studiocar/config";
import { getWebDatabase } from "../db/web-database";

import type { CommandRateLimiterPort } from "../security/command-rate-limiter.types";
import { CommandRateLimiter } from "../security/command-rate-limiter";
import { PrismaCommandRateLimitRepository } from "../db/repositories/command-rate-limit-repository";
import { BILLING_RATE_LIMIT_WINDOW_MS, BILLING_ORDER_MAX_PER_WINDOW, BILLING_VERIFICATION_MAX_PER_WINDOW } from "./billing.constants";
import { BillingService } from "./billing-service";

let service: BillingService | undefined;

export function getBillingRuntime(): { database: ReturnType<typeof getWebDatabase>; service: BillingService; orderRateLimiter: CommandRateLimiterPort; verificationRateLimiter: CommandRateLimiterPort } {
  const activeDatabase = getWebDatabase();
  return {
    database: activeDatabase,
    orderRateLimiter: new CommandRateLimiter(new PrismaCommandRateLimitRepository(activeDatabase), { scope: "BILLING_ORDER", maximumRequests: BILLING_ORDER_MAX_PER_WINDOW, windowMilliseconds: BILLING_RATE_LIMIT_WINDOW_MS }),
    verificationRateLimiter: new CommandRateLimiter(new PrismaCommandRateLimitRepository(activeDatabase), { scope: "BILLING_VERIFICATION", maximumRequests: BILLING_VERIFICATION_MAX_PER_WINDOW, windowMilliseconds: BILLING_RATE_LIMIT_WINDOW_MS }),
    get service() {
      service ??= new BillingService(activeDatabase, parseRazorpayEnvironment(process.env));
      return service;
    },
  };
}
