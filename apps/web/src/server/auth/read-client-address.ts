const VERCEL_FORWARDED_FOR_HEADER = "x-vercel-forwarded-for";
const FORWARDED_FOR_HEADER = "x-forwarded-for";
const REAL_IP_HEADER = "x-real-ip";
const UNKNOWN_CLIENT_ADDRESS = "unknown";
const MAXIMUM_CLIENT_ADDRESS_LENGTH = 255;

export function readClientAddress(request: Request): string {
  const forwarded =
    request.headers.get(VERCEL_FORWARDED_FOR_HEADER) ??
    request.headers.get(FORWARDED_FOR_HEADER) ??
    request.headers.get(REAL_IP_HEADER);
  const firstAddress = forwarded?.split(",", 1)[0]?.trim();

  return firstAddress
    ? firstAddress.slice(0, MAXIMUM_CLIENT_ADDRESS_LENGTH)
    : UNKNOWN_CLIENT_ADDRESS;
}
