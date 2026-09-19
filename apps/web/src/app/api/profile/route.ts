import { getCurrentSession } from "../../../server/auth/get-current-session";
import { getProfileService } from "../../../server/profile/profile-runtime";
import { handleUpdateProfile } from "../../../server/profile/update-profile-handler";

export const runtime = "nodejs";

export async function PATCH(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  return handleUpdateProfile(request, session, getProfileService());
}
