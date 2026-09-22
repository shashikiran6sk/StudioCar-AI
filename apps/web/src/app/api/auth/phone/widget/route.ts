import { handlePhoneOtpWidget } from "../../../../../server/auth/phone/phone-widget-handler";
import { getPhoneOtpWidget } from "../../../../../server/auth/phone/phone-auth-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  return handlePhoneOtpWidget(request, getPhoneOtpWidget());
}
