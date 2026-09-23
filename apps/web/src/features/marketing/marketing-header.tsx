import type { AuthUser } from "@studiocar/contracts";
import { BrandMark, ButtonLink } from "@studiocar/ui";

import { DASHBOARD_PATH, LOGIN_PATH } from "../../app/app-routes";
import { AccountMenu } from "../shell/account-menu";
import {
  MARKETING_COPY,
  MARKETING_NAVIGATION,
  MARKETING_START_PATH,
} from "./marketing.constants";

export interface MarketingHeaderProps {
  /** The signed-in account, or null for a visitor. */
  user: AuthUser | null;
}

/**
 * A signed-in person sees their account and a way back into the workspace,
 * exactly as on the dashboard, rather than being invited to sign in again.
 */
export function MarketingHeader({ user }: MarketingHeaderProps) {
  return (
    <header className="marketing-header">
      <a aria-label={MARKETING_COPY.header.homeLabel} className="marketing-header__brand" href="#top">
        <BrandMark withName />
      </a>
      <nav aria-label={MARKETING_COPY.header.navigationLabel} className="marketing-header__navigation">
        {MARKETING_NAVIGATION.map((item) => (
          <a href={item.href} key={item.href}>{item.label}</a>
        ))}
      </nav>
      <div className="marketing-header__actions">
        {user === null ? (
          <>
            <ButtonLink href={LOGIN_PATH} size="marketing">{MARKETING_COPY.header.loginLabel}</ButtonLink>
            <ButtonLink href={MARKETING_START_PATH} size="marketing" variant="primary">
              {MARKETING_COPY.header.startLabel}
            </ButtonLink>
          </>
        ) : (
          <>
            <ButtonLink href={DASHBOARD_PATH} size="marketing">
              {MARKETING_COPY.header.dashboardLabel}
            </ButtonLink>
            <AccountMenu user={user} />
          </>
        )}
      </div>
    </header>
  );
}
