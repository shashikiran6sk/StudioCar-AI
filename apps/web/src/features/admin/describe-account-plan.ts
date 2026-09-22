export interface AccountPlanDescription {
  planName: string;
  /** True when a payment provider owns it, so it must not be changed here. */
  providerManaged: boolean;
}

/**
 * Says what plan an account is on and who decides it.
 *
 * Rendered as one sentence rather than as fragments a reader has to reassemble.
 */
export function describeAccountPlan(description: AccountPlanDescription): string {
  return description.providerManaged
    ? `On ${description.planName}, owned by the billing provider.`
    : `On ${description.planName}.`;
}
