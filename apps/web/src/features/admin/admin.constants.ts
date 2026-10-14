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
  { key: "paidAccountCount", label: "Plus accounts", detail: "with lifetime credit purchases" },
  {
    key: "enabledSocialLinkCount",
    label: "Social links",
    detail: "shown in the footer",
  },
];
