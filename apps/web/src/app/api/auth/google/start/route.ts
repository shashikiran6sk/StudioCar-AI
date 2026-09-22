import { handleGoogleAuthStart } from "@/server/auth/google/google-auth-start-handler";
import { getGoogleOAuthApplication } from "@/server/auth/google/google-auth-runtime";
import { getCurrentSession } from "@/server/auth/get-current-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const session = await getCurrentSession();

  return handleGoogleAuthStart(
    request,
    getGoogleOAuthApplication(),
    process.env["NODE_ENV"] === "production",
    session?.userId ?? null,
  );
}
