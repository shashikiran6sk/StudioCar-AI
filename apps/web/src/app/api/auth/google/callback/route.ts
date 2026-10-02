import { withRouteMonitoring } from "../../../../../server/observability/with-route-monitoring";
import { handleGoogleAuthCallback } from "@/server/auth/google/google-auth-callback-handler";
import { getGoogleOAuthApplication } from "@/server/auth/google/google-auth-runtime";
import { getCurrentSession } from "@/server/auth/get-current-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleGET(request: Request): Promise<Response> {
  const session = await getCurrentSession();

  return handleGoogleAuthCallback(
    request,
    getGoogleOAuthApplication(),
    process.env["NODE_ENV"] === "production",
    session?.userId ?? null,
  );
}

export const GET = withRouteMonitoring("/api/auth/google/callback", handleGET);
