import type { SocialLink } from "@studiocar/contracts";
import { BrandMark } from "@studiocar/ui";

import {
  BILLING_PATH,
  DASHBOARD_PATH,
  INVENTORY_PATH,
  PROFILE_PATH,
} from "../../app/app-routes";
import {
  MARKETING_COMPANY_LINKS,
  MARKETING_COPY,
  MARKETING_NAVIGATION,
} from "./marketing.constants";
import { FOOTER_SOCIAL_LABEL } from "../../server/content/content.constants";

export interface MarketingFooterProps {
  socialLinks: readonly SocialLink[];
}

export function MarketingFooter({ socialLinks }: MarketingFooterProps) {
  return (
    <footer
      className={`marketing-footer${
        socialLinks.length === 0 ? "" : " marketing-footer--with-social"
      }`}
    >
      <div className="marketing-footer__brand">
        <BrandMark inverted withName />
        <p>{MARKETING_COPY.footer.description}</p>
      </div>
      <nav aria-label="Product footer links">
        <strong>{MARKETING_COPY.footer.productLabel}</strong>
        <a href="#top">Home</a>
        {MARKETING_NAVIGATION.map((item) => (
          <a href={item.href} key={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
      <nav aria-label="Workspace footer links">
        <strong>{MARKETING_COPY.footer.workspaceLabel}</strong>
        <a href={DASHBOARD_PATH}>Dashboard</a>
        <a href={INVENTORY_PATH}>Inventory</a>
        <a href={PROFILE_PATH}>Profile</a>
        <a href={BILLING_PATH}>Billing</a>
      </nav>
      <nav aria-label="Company footer links">
        <strong>{MARKETING_COPY.footer.companyLabel}</strong>
        {MARKETING_COMPANY_LINKS.map((label) => (
          <span aria-disabled="true" key={label}>
            {label}
          </span>
        ))}
      </nav>
      {socialLinks.length === 0 ? null : (
        <nav
          aria-label={FOOTER_SOCIAL_LABEL}
          className="marketing-footer__social"
        >
          <strong>{FOOTER_SOCIAL_LABEL}</strong>
          {socialLinks.map((link) => (
            <a
              href={link.url}
              key={link.platform}
              rel="me noopener noreferrer"
              target="_blank"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
      <div className="marketing-footer__legal">
        <span>{MARKETING_COPY.footer.copyright}</span>
        <span>{MARKETING_COPY.footer.signature}</span>
      </div>
    </footer>
  );
}
