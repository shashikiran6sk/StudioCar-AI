import {
  BILLING_PATH,
  DASHBOARD_PATH,
  INVENTORY_PATH,
  PROFILE_PATH,
} from "../../app/app-routes";

export interface AppNavigationItem {
  href: string;
  icon: string;
  label: string;
}

/**
 * Every workspace destination that exists. Usage now lives inside Packs &
 * Billing, and the vehicle portfolio is reached from its inventory card rather
 * than from a global destination that cannot know which vehicle is meant.
 */
export const APP_NAVIGATION_ITEMS: readonly AppNavigationItem[] = [
  { href: DASHBOARD_PATH, icon: "⌂", label: "Dashboard" },
  { href: INVENTORY_PATH, icon: "▦", label: "Inventory" },
  { href: BILLING_PATH, icon: "◇", label: "Packs & Billing" },
  { href: PROFILE_PATH, icon: "◔", label: "Profile" },
];
