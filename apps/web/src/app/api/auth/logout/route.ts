import { handleLogout } from "../../../../server/auth/logout-handler";
import { getSessionService } from "../../../../server/auth/session-runtime";

export const runtime = "nodejs";

export function POST(request: Request): Promise<Response> {
  return handleLogout(
    request,
    getSessionService(),
    process.env.NODE_ENV === "production",
  );
}
