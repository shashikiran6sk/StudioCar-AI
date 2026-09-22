import {
  MANUAL_SUBSCRIPTION_MAX_MONTHS,
  MANUAL_SUBSCRIPTION_MIN_MONTHS,
} from "@studiocar/contracts";

import { AccountLookupForm } from "../../../../features/admin/account-lookup-form";
import { AssignSubscriptionForm } from "../../../../features/admin/assign-subscription-form";
import { ManualSubscriptionList } from "../../../../features/admin/manual-subscription-list";
import { describeAccountName } from "../../../../features/admin/describe-account";
import { describeAccountPlan } from "../../../../features/admin/describe-account-plan";
import {
  ADMIN_LOOKUP_INVALID_MESSAGE,
  ADMIN_LOOKUP_NOT_FOUND_MESSAGE,
  ADMIN_LOOKUP_QUERY_KEY,
  ADMIN_SUBSCRIPTIONS_DESCRIPTION,
  ADMIN_SUBSCRIPTIONS_EYEBROW,
  ADMIN_SUBSCRIPTIONS_TITLE,
} from "../../../../server/admin/admin.constants";
import { getManualSubscriptionRepository } from "../../../../server/admin/manual-subscription-runtime";
import { parseAccountLookup } from "../../../../server/admin/parse-account-lookup";
import { requireAdministrator } from "../../../../server/admin/require-administrator";
import { getPlanCatalog } from "../../../../server/plans/get-plan-catalog";
import { FALLBACK_PLAN_KEY } from "../../../../server/plans/plans.constants";

export const dynamic = "force-dynamic";

/** The default assignment length: one month, matching a monthly plan. */
const DEFAULT_MONTHS = 1;

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdministrator();
  const now = new Date();
  const repository = getManualSubscriptionRepository();
  const [catalog, subscriptions] = await Promise.all([
    getPlanCatalog(),
    repository.listActive(now),
  ]);

  const requested = (await searchParams)[ADMIN_LOOKUP_QUERY_KEY];
  const query = typeof requested === "string" ? requested : "";
  const lookup = query === "" ? null : parseAccountLookup(query);
  const account = lookup
    ? await repository.findAccountByVerifiedContact(lookup)
    : null;
  const live = account
    ? await repository.findLivePlan(account.userId, now)
    : null;

  const assignable = catalog.filter(
    (plan) => plan.active && plan.planKey !== FALLBACK_PLAN_KEY,
  );
  const planName = (planKey: string): string =>
    catalog.find((plan) => plan.planKey === planKey)?.displayName ?? planKey;

  const accountLabel =
    account === null
      ? ""
      : `${describeAccountName(account)} — ${describeAccountPlan({
          planName:
            live === null
              ? planName(FALLBACK_PLAN_KEY)
              : planName(live.planKey),
          providerManaged: live?.providerManaged === true,
        })}`;

  return (
    <>
      <header className="app-page-header">
        <div>
          <p className="eyebrow">{ADMIN_SUBSCRIPTIONS_EYEBROW}</p>
          <h1>{ADMIN_SUBSCRIPTIONS_TITLE}</h1>
          <p>{ADMIN_SUBSCRIPTIONS_DESCRIPTION}</p>
        </div>
      </header>
      <AccountLookupForm value={query} />
      {query !== "" && lookup === null ? (
        <p className="admin-message admin-message--error" role="alert">
          {ADMIN_LOOKUP_INVALID_MESSAGE}
        </p>
      ) : null}
      {lookup !== null && account === null ? (
        <p className="admin-message admin-message--error" role="alert">
          {ADMIN_LOOKUP_NOT_FOUND_MESSAGE}
        </p>
      ) : null}
      {account === null ? null : (
        <AssignSubscriptionForm
          accountLabel={accountLabel}
          currentPlanKey={live?.planKey ?? null}
          defaultMonths={DEFAULT_MONTHS}
          maximumMonths={MANUAL_SUBSCRIPTION_MAX_MONTHS}
          minimumMonths={MANUAL_SUBSCRIPTION_MIN_MONTHS}
          plans={assignable.map((plan) => ({
            displayName: plan.displayName,
            planKey: plan.planKey,
          }))}
          userId={account.userId}
        />
      )}
      <ManualSubscriptionList
        subscriptions={subscriptions.map((subscription) => ({
          ...subscription,
          currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
          planName: planName(subscription.planKey),
        }))}
      />
    </>
  );
}
