import { Skeleton } from "@studiocar/ui";

const BILLING_PLAN_SKELETON_COUNT = 3;

export default function UsageBillingLoading() {
  return (
    <div
      aria-label="Loading usage and billing"
      className="usage-billing-page"
      role="status"
    >
      <Skeleton className="usage-loading__header" />
      <div className="usage-overview">
        <Skeleton className="usage-loading__plan" />
        <div className="usage-overview__quotas">
          <Skeleton className="usage-loading__quota" />
          <Skeleton className="usage-loading__quota" />
        </div>
      </div>
      <div className="billing-packs__grid">
        {Array.from({ length: BILLING_PLAN_SKELETON_COUNT }, (_, index) => (
          <Skeleton className="usage-loading__pack" key={index} />
        ))}
      </div>
    </div>
  );
}
