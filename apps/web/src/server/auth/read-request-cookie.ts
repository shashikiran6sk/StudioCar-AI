const COOKIE_SEPARATOR = ";";
const COOKIE_KEY_VALUE_SEPARATOR = "=";

export function readRequestCookie(
  request: Request,
  cookieName: string,
): string | undefined {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return undefined;

  for (const segment of cookieHeader.split(COOKIE_SEPARATOR)) {
    const separatorIndex = segment.indexOf(COOKIE_KEY_VALUE_SEPARATOR);
    if (separatorIndex < 0) continue;

    const name = segment.slice(0, separatorIndex).trim();
    if (name !== cookieName) continue;

    return segment.slice(separatorIndex + COOKIE_KEY_VALUE_SEPARATOR.length).trim();
  }

  return undefined;
}
