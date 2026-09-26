import { withRouteMonitoring } from "../../../../../server/observability/with-route-monitoring";
import { handleCreatePhoneAccount } from "../../../../../server/auth/phone/create-phone-account-handler";
import { getPhoneAccountService } from "../../../../../server/auth/phone/phone-auth-runtime";

export const runtime = "nodejs";

async function handlePOST(request: Request): Promise<Response> {
  return handleCreatePhoneAccount(
    request,
    getPhoneAccountService(),
    process.env.NODE_ENV === "production",
  );
}

export const POST = withRouteMonitoring(
  "/api/auth/phone/create-account",
  handlePOST,
);
