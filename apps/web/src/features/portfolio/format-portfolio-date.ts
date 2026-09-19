const PORTFOLIO_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatPortfolioDate(value: string): string {
  return PORTFOLIO_DATE_FORMAT.format(new Date(value));
}
