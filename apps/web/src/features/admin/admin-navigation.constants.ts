import {
  ADMINS_PATH,
  ADMIN_PATH,
  ADMIN_PRICING_PATH,
  ADMIN_SUBSCRIPTIONS_PATH,
} from "../../server/admin/admin.constants";

export interface AdminNavigationItem {
  href: string;
  label: string;
}

/** Every administration destination that exists so far. */
export const ADMIN_NAVIGATION_ITEMS: readonly AdminNavigationItem[] = [
  { href: ADMIN_PATH, label: "Overview" },
  { href: ADMIN_PRICING_PATH, label: "Plans and pricing" },
  { href: ADMIN_SUBSCRIPTIONS_PATH, label: "Subscriptions" },
  { href: ADMINS_PATH, label: "Administrators" },
];
