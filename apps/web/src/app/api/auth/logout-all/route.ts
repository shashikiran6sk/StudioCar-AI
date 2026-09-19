import { handleLogoutEverywhere } from "../../../../server/auth/logout-everywhere-handler";
import { getSessionService } from "../../../../server/auth/session-runtime";

export const runtime = "nodejs";

export function POST(request: Request): Promise<Response> {
  return handleLogoutEverywhere(
    request,
    getSessionService(),
    process.env.NODE_ENV === "production",
  );
}
