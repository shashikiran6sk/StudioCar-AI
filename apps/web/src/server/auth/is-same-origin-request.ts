const ORIGIN_HEADER = "origin";

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get(ORIGIN_HEADER);
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
