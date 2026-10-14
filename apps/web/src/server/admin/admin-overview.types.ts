export interface AdminOverview {
  administratorCount: number;
  userCount: number;
  activePlanCount: number;
  paidAccountCount: number;
  enabledSocialLinkCount: number;
}

export interface PlanAccountCount {
  accountCount: number;
  planKey: string;
}
