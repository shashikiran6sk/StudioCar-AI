const ORIGIN_HEADER = "origin";
const HOST_HEADER = "host";
const FORWARDED_PROTOCOL_HEADER = "x-forwarded-proto";
const HTTP_PROTOCOL = "http";
const HTTPS_PROTOCOL = "https";

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get(ORIGIN_HEADER);
  if (!origin) return false;

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    if (origin !== originUrl.origin) return false;
    if (originUrl.origin === requestUrl.origin) return true;

    // Next may expose localhost internally behind a proxy. The browser's Host
    // remains authoritative; never take the target host from X-Forwarded-Host.
    const host = request.headers.get(HOST_HEADER);
    if (!host) return false;
    const forwardedProtocol = request.headers.get(FORWARDED_PROTOCOL_HEADER);
    if (forwardedProtocol && forwardedProtocol !== HTTP_PROTOCOL && forwardedProtocol !== HTTPS_PROTOCOL) return false;
    const protocol = forwardedProtocol ? `${forwardedProtocol}:` : requestUrl.protocol;
    const publicUrl = new URL(`${protocol}//${host}`);
    if (publicUrl.username || publicUrl.password || publicUrl.pathname !== "/" || publicUrl.search || publicUrl.hash) return false;
    return originUrl.origin === publicUrl.origin;
  } catch {
    return false;
  }
}
