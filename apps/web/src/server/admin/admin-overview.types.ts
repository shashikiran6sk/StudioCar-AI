export interface AdminOverview {
  administratorCount: number;
  userCount: number;
  activePlanCount: number;
  activeSubscriptionCount: number;
  manualSubscriptionCount: number;
  enabledSocialLinkCount: number;
}

export interface PlanAccountCount {
  accountCount: number;
  planKey: string;
}
