/**
 * A `Retry-After` header as milliseconds from now: either delay-seconds or an
 * HTTP date. Anything else, or a moment already past, is no hint at all.
 */
export function readRetryAfter(
  headers: Headers,
  headerName: string,
  nowMilliseconds: number,
): number | null {
  const value = headers.get(headerName)?.trim();
  if (!value) return null;
  if (/^\d{1,9}$/.test(value)) return Number(value) * 1_000;
  const date = Date.parse(value);
  if (Number.isNaN(date)) return null;
  const delay = date - nowMilliseconds;
  return delay > 0 ? delay : null;
}
