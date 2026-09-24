import { handleCreatePhoneAccount } from "../../../../../server/auth/phone/create-phone-account-handler";
import { getPhoneAccountService } from "../../../../../server/auth/phone/phone-auth-runtime";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleCreatePhoneAccount(
    request,
    getPhoneAccountService(),
    process.env.NODE_ENV === "production",
  );
}
