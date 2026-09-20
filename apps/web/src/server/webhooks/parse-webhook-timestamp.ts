const UNIX_TIMESTAMP_PATTERN = /^\d{1,16}$/;

export function parseWebhookTimestamp(value: string): number | null {
  if (!UNIX_TIMESTAMP_PATTERN.test(value)) return null;
  const timestamp = Number(value);
  return Number.isSafeInteger(timestamp) ? timestamp : null;
}
