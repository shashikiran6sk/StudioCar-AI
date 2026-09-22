import { cache } from "react";

import { getAdminRoleRepository } from "./admin-runtime";
import { getCurrentSession } from "../auth/get-current-session";

/**
 * Resolves administrator status from the database for the current request.
 *
 * Every protected page, action, and handler asks this independently. Hiding a
 * navigation entry is presentation, never authorization.
 */
export const isCurrentUserAdministrator = cache(async (): Promise<boolean> => {
  const session = await getCurrentSession();
  if (!session) return false;
  return getAdminRoleRepository().isAdministrator(session.userId);
});
