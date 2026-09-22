import { handleLinkPhoneIdentity } from "../../../../../server/auth/phone/link-phone-identity-handler";
import { getPhoneOtpApplication } from "../../../../../server/auth/phone/phone-auth-runtime";
import { getCurrentSession } from "../../../../../server/auth/get-current-session";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const session = await getCurrentSession();

  return handleLinkPhoneIdentity(
    request,
    session?.userId ?? null,
    getPhoneOtpApplication(),
    process.env.NODE_ENV === "production",
  );
}
