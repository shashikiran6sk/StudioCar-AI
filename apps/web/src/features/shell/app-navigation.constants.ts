import {
  BILLING_PATH,
  DASHBOARD_PATH,
  HELP_PATH,
  INVENTORY_PATH,
  PORTFOLIO_PATH,
  USAGE_PATH,
} from "../../app/app-routes";

export interface AppNavigationItem {
  available: boolean;
  href: string;
  icon: string;
  label: string;
}

export const APP_NAVIGATION_ITEMS: readonly AppNavigationItem[] = [
  { available: true, href: DASHBOARD_PATH, icon: "⌂", label: "Dashboard" },
  { available: true, href: INVENTORY_PATH, icon: "▦", label: "Inventory" },
  { available: false, href: PORTFOLIO_PATH, icon: "▥", label: "Portfolio" },
  { available: false, href: USAGE_PATH, icon: "◔", label: "Usage" },
  { available: true, href: BILLING_PATH, icon: "◇", label: "Packs & Billing" },
  { available: false, href: HELP_PATH, icon: "?", label: "Help" },
];
