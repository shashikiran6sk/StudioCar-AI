import { withRouteMonitoring } from "../../../../../server/observability/with-route-monitoring";
import { handlePhoneAuthVerify } from "../../../../../server/auth/phone/phone-auth-verify-handler";
import { getPhoneOtpApplication } from "../../../../../server/auth/phone/phone-auth-runtime";

export const runtime = "nodejs";

function handlePOST(request: Request): Promise<Response> {
  return handlePhoneAuthVerify(
    request,
    getPhoneOtpApplication(),
    process.env.NODE_ENV === "production",
  );
}

export const POST = withRouteMonitoring("/api/auth/phone/verify", handlePOST);
