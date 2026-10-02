import { withRouteMonitoring } from "../../../server/observability/with-route-monitoring";
import { getCurrentSession } from "../../../server/auth/get-current-session";
import { getProfileService } from "../../../server/profile/profile-runtime";
import { handleUpdateProfile } from "../../../server/profile/update-profile-handler";

export const runtime = "nodejs";

async function handlePATCH(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  return handleUpdateProfile(request, session, getProfileService());
}

export const PATCH = withRouteMonitoring("/api/profile", handlePATCH);
