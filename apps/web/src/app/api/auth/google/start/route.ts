import { handleGoogleAuthStart } from "@/server/auth/google/google-auth-start-handler";
import { getGoogleOAuthApplication } from "@/server/auth/google/google-auth-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Promise<Response> {
  return handleGoogleAuthStart(
    request,
    getGoogleOAuthApplication(),
    process.env["NODE_ENV"] === "production",
  );
}
