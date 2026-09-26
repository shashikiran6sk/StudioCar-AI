import { withRouteMonitoring } from "../../../../server/observability/with-route-monitoring";
import { handleLogout } from "../../../../server/auth/logout-handler";
import { getSessionService } from "../../../../server/auth/session-runtime";

export const runtime = "nodejs";

function handlePOST(request: Request): Promise<Response> {
  return handleLogout(
    request,
    getSessionService(),
    process.env.NODE_ENV === "production",
  );
}

export const POST = withRouteMonitoring("/api/auth/logout", handlePOST);
