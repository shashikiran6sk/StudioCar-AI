import { notFound, redirect } from "next/navigation";

import { isCurrentUserAdministrator } from "./is-current-user-administrator";
import { LOGIN_PATH } from "../../app/app-routes";
import { getCurrentSession } from "../auth/get-current-session";
import type { ActiveSession } from "../auth/session-service";

/**
 * Guards an administration page.
 *
 * A signed-in non-administrator gets `notFound` rather than a refusal, so the
 * existence of the administration area is not disclosed to people who may not
 * use it.
 */
export async function requireAdministrator(): Promise<ActiveSession> {
  const session = await getCurrentSession();
  if (!session) redirect(LOGIN_PATH);
  if (!(await isCurrentUserAdministrator())) notFound();
  return session;
}
