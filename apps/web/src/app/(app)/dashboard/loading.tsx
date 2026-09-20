import { Skeleton } from "@studiocar/ui";

const DASHBOARD_STAT_SKELETON_COUNT = 5;
const DASHBOARD_CARD_SKELETON_COUNT = 3;

export default function DashboardLoading() {
  return (
    <div aria-label="Loading dashboard" className="dashboard-page" role="status">
      <Skeleton className="dashboard-loading__header" />
      <div className="dashboard-stats">
        {Array.from({ length: DASHBOARD_STAT_SKELETON_COUNT }, (_, index) => (
          <Skeleton className="dashboard-loading__stat" key={index} />
        ))}
      </div>
      <div className="dashboard-loading__cards">
        {Array.from({ length: DASHBOARD_CARD_SKELETON_COUNT }, (_, index) => (
          <Skeleton className="dashboard-loading__card" key={index} />
        ))}
      </div>
      <div className="dashboard-loading__cards">
        {Array.from({ length: DASHBOARD_CARD_SKELETON_COUNT }, (_, index) => (
          <Skeleton className="dashboard-loading__card" key={index} />
        ))}
      </div>
    </div>
  );
}
