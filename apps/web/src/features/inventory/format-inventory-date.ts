const INVENTORY_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatInventoryDate(value: string): string {
  return INVENTORY_DATE_FORMAT.format(new Date(value));
}
