import { redirect } from "next/navigation";

import { LOGIN_PATH } from "../../../app-routes";
import { BillingPlanGrid } from "../../../../features/billing/billing-plan-grid";
import { BillingUnavailableAction } from "../../../../features/billing/billing-unavailable-action";
import { UsageOverview } from "../../../../features/billing/usage-overview";
import {
  USAGE_BILLING_DESCRIPTION,
  USAGE_BILLING_EYEBROW,
  USAGE_BILLING_TITLE,
  USAGE_BILLING_UPGRADE_LABEL,
} from "../../../../features/billing/usage-billing.constants";
import { getCurrentSession } from "../../../../server/auth/get-current-session";
import { getUsageBillingSummary } from "../../../../server/billing/get-usage-billing-summary";

export const dynamic = "force-dynamic";

export default async function UsageBillingPage() {
  const session = await getCurrentSession();
  if (!session) redirect(LOGIN_PATH);

  const summary = await getUsageBillingSummary(session.userId);

  return (
    <div className="usage-billing-page">
      <header className="app-page-header">
        <div>
          <p className="eyebrow">{USAGE_BILLING_EYEBROW}</p>
          <h1>{USAGE_BILLING_TITLE}</h1>
          <p>{USAGE_BILLING_DESCRIPTION}</p>
        </div>
        <BillingUnavailableAction label={USAGE_BILLING_UPGRADE_LABEL} />
      </header>
      <UsageOverview summary={summary} />
      <BillingPlanGrid currentPlanKey={summary.currentPlan.key} />
    </div>
  );
}
