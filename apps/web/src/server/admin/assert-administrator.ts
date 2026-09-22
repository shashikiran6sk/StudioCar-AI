import { createApiErrorResponse } from "../auth/create-api-error-response";
import {
  ADMIN_FORBIDDEN_CODE,
  ADMIN_FORBIDDEN_MESSAGE,
  ADMIN_FORBIDDEN_STATUS,
} from "./admin.constants";
import { isCurrentUserAdministrator } from "./is-current-user-administrator";

/**
 * Guards an administration route handler or server action.
 *
 * Returns a refusal response when the caller may not act, and null when they
 * may. Every protected mutation calls this for itself: a hidden navigation
 * entry stops nobody from calling an endpoint directly.
 */
export async function assertAdministrator(
  requestId: string,
): Promise<Response | null> {
  if (await isCurrentUserAdministrator()) return null;

  return createApiErrorResponse({
    status: ADMIN_FORBIDDEN_STATUS,
    code: ADMIN_FORBIDDEN_CODE,
    message: ADMIN_FORBIDDEN_MESSAGE,
    requestId,
  });
}
