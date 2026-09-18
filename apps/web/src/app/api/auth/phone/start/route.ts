import { handlePhoneAuthStart } from "../../../../../server/auth/phone/phone-auth-start-handler";
import { getPhoneOtpApplication } from "../../../../../server/auth/phone/phone-auth-runtime";

export const runtime = "nodejs";

export function POST(request: Request): Promise<Response> {
  return handlePhoneAuthStart(
    request,
    getPhoneOtpApplication(),
    process.env.NODE_ENV === "production",
  );
}
