const DASHBOARD_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
};

export function dashboardDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", DASHBOARD_DATE_FORMAT).format(date);
}
