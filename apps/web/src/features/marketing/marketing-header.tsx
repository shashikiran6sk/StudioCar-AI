import { BrandMark, ButtonLink } from "@studiocar/ui";

import { LOGIN_PATH } from "../../app/app-routes";
import {
  MARKETING_COPY,
  MARKETING_NAVIGATION,
  MARKETING_START_PATH,
} from "./marketing.constants";

export function MarketingHeader() {
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
        <ButtonLink href={LOGIN_PATH} size="marketing">{MARKETING_COPY.header.loginLabel}</ButtonLink>
        <ButtonLink href={MARKETING_START_PATH} size="marketing" variant="primary">
          {MARKETING_COPY.header.startLabel}
        </ButtonLink>
      </div>
    </header>
  );
}
