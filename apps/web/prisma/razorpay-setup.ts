import { parseRazorpayEnvironment, parseSessionEnvironment } from "@studiocar/config";
import { createDatabaseClient } from "@studiocar/database-runtime";

import { RazorpayClient } from "../src/server/billing/providers/razorpay/razorpay-client";

async function main(): Promise<void> {
  const environment = parseRazorpayEnvironment(process.env);
  const session = parseSessionEnvironment(process.env);
  const database = createDatabaseClient({ connectionString: session.DATABASE_URL });
  try {
    const plan = await database.planConfig.findUniqueOrThrow({ where: { planKey: "STUDIO_PRO" } });
    if (!plan.active || plan.billingInterval !== "MONTHLY" || plan.currency !== "INR") {
      throw new Error("Studio Pro configuration is not ready for Razorpay provisioning.");
    }
    const provider = new RazorpayClient(environment);
    const mapping = await database.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`razorpay-plan:${environment.APP_ENV}:${plan.id}`}, 0))`;
      const existing = await transaction.planPrice.findUnique({
        where: { planConfigId_environment_priceMinorUnits_includedImages: {
          planConfigId: plan.id,
          environment: environment.APP_ENV,
          priceMinorUnits: plan.priceMinorUnits,
          includedImages: plan.includedImages,
        } },
      });
      if (existing) return existing;
      if (!process.argv.includes("--create")) throw new Error("Plan mapping is absent. Re-run with --create to provision it intentionally.");
      const remote = await provider.createPlan({ amount: plan.priceMinorUnits, currency: plan.currency });
      return transaction.planPrice.create({
        data: {
          planConfigId: plan.id,
          environment: environment.APP_ENV,
          priceMinorUnits: plan.priceMinorUnits,
          currency: plan.currency,
          includedImages: plan.includedImages,
          razorpayPlanId: remote.id,
        },
      });
    });
    process.stdout.write(`${environment.APP_ENV} Studio Pro plan: ${mapping.razorpayPlanId}\n`);
  } finally {
    await database.$disconnect();
  }
}

await main();
