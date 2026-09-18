import { handlePhoneAuthVerify } from "../../../../../server/auth/phone/phone-auth-verify-handler";
import { getPhoneOtpApplication } from "../../../../../server/auth/phone/phone-auth-runtime";

export const runtime = "nodejs";

export function POST(request: Request): Promise<Response> {
  return handlePhoneAuthVerify(
    request,
    getPhoneOtpApplication(),
    process.env.NODE_ENV === "production",
  );
}
