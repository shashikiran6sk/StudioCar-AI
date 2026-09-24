import type { AuthUser } from "@studiocar/contracts";
import Link from "next/link";

import { DASHBOARD_PATH, LOGOUT_PATH, PROFILE_PATH } from "../../app/app-routes";
import { userDisplayName } from "./user-display-name";
import { userInitials } from "./user-initials";

const DASHBOARD_LABEL = "Dashboard";
const LOGOUT_LABEL = "Log out";
const PROFILE_LABEL = "Profile & security";

export interface AccountMenuProps {
  user: AuthUser;
  /**
   * Adds a way into the workspace. Outside the workspace, such as on the
   * homepage, the menu is the only route back to the dashboard.
   */
  showDashboardLink?: boolean;
}

export function AccountMenu({ showDashboardLink = false, user }: AccountMenuProps) {
  const displayName = userDisplayName(user);

  return (
    <details className="account-menu">
      <summary aria-label={`Account menu for ${displayName}`}>
        <span className="account-menu__name">{displayName}</span>
        <span aria-hidden="true" className="account-menu__avatar">
          {userInitials(displayName)}
        </span>
      </summary>
      <div className="account-menu__panel">
        <p>{user.primaryEmail ?? user.primaryPhone ?? displayName}</p>
        {showDashboardLink ? <Link href={DASHBOARD_PATH}>{DASHBOARD_LABEL}</Link> : null}
        <Link href={PROFILE_PATH}>{PROFILE_LABEL}</Link>
        <form action={LOGOUT_PATH} method="post">
          <button type="submit">{LOGOUT_LABEL}</button>
        </form>
      </div>
    </details>
  );
}
