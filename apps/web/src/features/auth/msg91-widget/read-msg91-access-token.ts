import { MSG91_ACCESS_TOKEN_KEYS } from "./msg91-widget.constants";

/**
 * The widget reports the verified token differently across versions, so the
 * known carriers are checked in order rather than assuming one shape.
 */
export function readMsg91AccessToken(data: unknown): string | null {
  if (typeof data === "string") return data.trim() || null;
  if (typeof data !== "object" || data === null) return null;

  const record: Record<string, unknown> = { ...data };
  for (const key of MSG91_ACCESS_TOKEN_KEYS) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}
