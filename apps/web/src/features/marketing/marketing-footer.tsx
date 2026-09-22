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

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="marketing-footer__brand">
        <BrandMark inverted withName />
        <p>
          {MARKETING_COPY.footer.description}
        </p>
      </div>
      <nav aria-label="Product footer links">
        <strong>{MARKETING_COPY.footer.productLabel}</strong>
        <a href="#top">Home</a>
        {MARKETING_NAVIGATION.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
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
        {MARKETING_COMPANY_LINKS.map((label) => <span aria-disabled="true" key={label}>{label}</span>)}
      </nav>
      <div className="marketing-footer__legal">
        <span>{MARKETING_COPY.footer.copyright}</span>
        <span>{MARKETING_COPY.footer.signature}</span>
      </div>
    </footer>
  );
}
