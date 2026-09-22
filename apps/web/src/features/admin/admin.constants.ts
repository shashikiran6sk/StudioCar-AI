import type { AdminOverview } from "../../server/admin/admin-overview.types";

export interface AdminOverviewStat {
  detail: string;
  key: keyof AdminOverview;
  label: string;
}

export const ADMIN_OVERVIEW_STATS: readonly AdminOverviewStat[] = [
  {
    key: "administratorCount",
    label: "Administrators",
    detail: "with database-backed access",
  },
  { key: "userCount", label: "Accounts", detail: "registered" },
  { key: "activePlanCount", label: "Active plans", detail: "offered" },
  {
    key: "activeSubscriptionCount",
    label: "Active subscriptions",
    detail: "across all sources",
  },
  {
    key: "manualSubscriptionCount",
    label: "Assigned by an admin",
    detail: "of those subscriptions",
  },
  {
    key: "enabledSocialLinkCount",
    label: "Social links",
    detail: "shown in the footer",
  },
];
