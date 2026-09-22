import { PlanConfigurationForm } from "../../../../features/admin/plan-configuration-form";
import { toPlanConfigurationFields } from "../../../../features/admin/to-plan-configuration-fields";
import {
  ADMIN_PRICING_DESCRIPTION,
  ADMIN_PRICING_EYEBROW,
  ADMIN_PRICING_TITLE,
} from "../../../../server/admin/admin.constants";
import { requireAdministrator } from "../../../../server/admin/require-administrator";
import { getFullPlanCatalog } from "../../../../server/plans/get-plan-catalog";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  await requireAdministrator();
  const plans = await getFullPlanCatalog();

  return (
    <>
      <header className="app-page-header">
        <div>
          <p className="eyebrow">{ADMIN_PRICING_EYEBROW}</p>
          <h1>{ADMIN_PRICING_TITLE}</h1>
          <p>{ADMIN_PRICING_DESCRIPTION}</p>
        </div>
      </header>
      <div className="admin-plan-grid">
        {plans.map((plan) => (
          <PlanConfigurationForm
            key={plan.planKey}
            plan={toPlanConfigurationFields(plan)}
          />
        ))}
      </div>
    </>
  );
}
