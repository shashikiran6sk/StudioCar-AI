import { redirect } from "next/navigation";

import { LOGIN_PATH } from "../../../app-routes";
import { BillingPlanGrid } from "../../../../features/billing/billing-plan-grid";
import { UsageOverview } from "../../../../features/billing/usage-overview";
import { BillingAccountDetails } from "../../../../features/billing/billing-account-details";
import {
  USAGE_BILLING_DESCRIPTION,
  USAGE_BILLING_EYEBROW,
  USAGE_BILLING_TITLE,
  USAGE_BILLING_UPGRADE_LABEL,
} from "../../../../features/billing/usage-billing.constants";
import { getCurrentSession } from "../../../../server/auth/get-current-session";
import { getUsageBillingSummary } from "../../../../server/billing/get-usage-billing-summary";
import { getPlanCatalog } from "../../../../server/plans/get-plan-catalog";
import { getBillingRuntime } from "../../../../server/billing/billing-runtime";
import { getBillingStatus } from "../../../../server/billing/get-billing-status";

export const dynamic = "force-dynamic";

export default async function UsageBillingPage() {
  const session = await getCurrentSession();
  if (!session) redirect(LOGIN_PATH);

  const database = getBillingRuntime().database;
  const [summary, plans, billingStatus, payments] = await Promise.all([
    getUsageBillingSummary(session.userId),
    getPlanCatalog(),
    getBillingStatus(database, session.userId),
    database.payment.findMany({
      where: { userId: session.userId, status: { in: ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"] } },
      orderBy: { createdAt: "desc" }, take: 100,
      select: { id: true, createdAt: true, productCode: true, amountPaise: true, currency: true, status: true, receipt: { select: { id: true } } },
    }),
  ]);

  return (
    <div className="usage-billing-page">
      <header className="app-page-header">
        <div>
          <p className="eyebrow">{USAGE_BILLING_EYEBROW}</p>
          <h1>{USAGE_BILLING_TITLE}</h1>
          <p>{USAGE_BILLING_DESCRIPTION}</p>
        </div>
        <a className="sc-button sc-button--blue" href="#packs">{USAGE_BILLING_UPGRADE_LABEL}</a>
      </header>
      <UsageOverview summary={summary} />
      <BillingAccountDetails status={billingStatus} payments={payments} />
      <BillingPlanGrid currentPlanKey={summary.currentPlan.key} plans={plans} />
    </div>
  );
}
