import { withRouteMonitoring } from "../../../../../server/observability/with-route-monitoring";
import { handlePhoneAuthStart } from "../../../../../server/auth/phone/phone-auth-start-handler";
import { getPhoneOtpApplication } from "../../../../../server/auth/phone/phone-auth-runtime";

export const runtime = "nodejs";

function handlePOST(request: Request): Promise<Response> {
  return handlePhoneAuthStart(
    request,
    getPhoneOtpApplication(),
    process.env.NODE_ENV === "production",
  );
}

export const POST = withRouteMonitoring("/api/auth/phone/start", handlePOST);
