import type { SocialLink } from "@studiocar/contracts";
import { BrandMark } from "@studiocar/ui";
import Link from "next/link";

import {
  BILLING_PATH,
  DASHBOARD_PATH,
  INVENTORY_PATH,
  PROFILE_PATH,
} from "../../app/app-routes";
import {
  MARKETING_ABOUT_ID,
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
      <section className="marketing-footer__brand" id={MARKETING_ABOUT_ID}>
        <h2 className="sc-visually-hidden">About StudioCar AI</h2>
        <BrandMark inverted withName />
        <p>{MARKETING_COPY.footer.description}</p>
      </section>
      <nav aria-label="Product footer links">
        <strong>{MARKETING_COPY.footer.productLabel}</strong>
        <Link href="/#top">Home</Link>
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
        <a href={`/#${MARKETING_ABOUT_ID}`}>About</a>
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
