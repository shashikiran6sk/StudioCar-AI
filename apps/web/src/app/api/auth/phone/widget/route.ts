import { withRouteMonitoring } from "../../../../../server/observability/with-route-monitoring";
import { handlePhoneOtpWidget } from "../../../../../server/auth/phone/phone-widget-handler";
import { getPhoneOtpWidget } from "../../../../../server/auth/phone/phone-auth-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function handleGET(): Response {
  return handlePhoneOtpWidget(getPhoneOtpWidget());
}

export const GET = withRouteMonitoring("/api/auth/phone/widget", handleGET);
