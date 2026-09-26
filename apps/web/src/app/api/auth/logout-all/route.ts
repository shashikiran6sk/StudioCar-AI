import { withRouteMonitoring } from "../../../../server/observability/with-route-monitoring";
import { handleLogoutEverywhere } from "../../../../server/auth/logout-everywhere-handler";
import { getSessionService } from "../../../../server/auth/session-runtime";

export const runtime = "nodejs";

function handlePOST(request: Request): Promise<Response> {
  return handleLogoutEverywhere(
    request,
    getSessionService(),
    process.env.NODE_ENV === "production",
  );
}

export const POST = withRouteMonitoring("/api/auth/logout-all", handlePOST);
