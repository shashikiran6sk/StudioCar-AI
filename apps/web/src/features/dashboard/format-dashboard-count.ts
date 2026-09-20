const DASHBOARD_COUNT_FORMAT = new Intl.NumberFormat("en-IN");

export function formatDashboardCount(count: number): string {
  return DASHBOARD_COUNT_FORMAT.format(count);
}
