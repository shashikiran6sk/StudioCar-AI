import { NextResponse } from "next/server";

/** Application redirects stay on the browser's origin, including HTTPS tunnels. */
export function createGoogleAuthRedirect(
  destination: URL,
  status: number,
): NextResponse {
  // Collapse leading slashes so an application path cannot become a network-path
  // reference (//host) when the reverse proxy's internal origin is removed.
  const pathname = destination.pathname.replace(/^\/+/, "/");
  return new NextResponse(null, {
    status,
    headers: {
      location: `${pathname}${destination.search}${destination.hash}`,
    },
  });
}
