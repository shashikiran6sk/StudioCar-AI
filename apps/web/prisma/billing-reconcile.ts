import { createDatabaseClient } from "@studiocar/database-runtime";
import { applyEnvironmentProfile, parseRazorpayEnvironment } from "@studiocar/config";
import { BillingStatusQuerySchema } from "@studiocar/contracts";
import { reconcilePlusOrder } from "../src/server/billing/reconcile-plus-order";

const input = BillingStatusQuerySchema.parse({ orderId: process.argv[2] });
if (!input.orderId) throw new Error("Supply the Razorpay order ID to reconcile.");
const settings = applyEnvironmentProfile(process.env);
const databaseUrl = settings["DATABASE_URL"];
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
const database = createDatabaseClient({ connectionString: databaseUrl });
try {
  const count = await reconcilePlusOrder(database, parseRazorpayEnvironment(settings), input.orderId);
  process.stdout.write(count > 0 ? "Captured order reconciled. Check payment, credits and receipt in billing.\n" : "No captured payment found. No credits were added.\n");
} finally { await database.$disconnect(); }
