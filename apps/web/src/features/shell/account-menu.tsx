import type { AuthUser } from "@studiocar/contracts";

import { LOGOUT_PATH } from "../../app/app-routes";
import { userDisplayName } from "./user-display-name";
import { userInitials } from "./user-initials";

const LOGOUT_LABEL = "Log out";

export interface AccountMenuProps {
  user: AuthUser;
}

export function AccountMenu({ user }: AccountMenuProps) {
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
        <form action={LOGOUT_PATH} method="post">
          <button type="submit">{LOGOUT_LABEL}</button>
        </form>
      </div>
    </details>
  );
}
