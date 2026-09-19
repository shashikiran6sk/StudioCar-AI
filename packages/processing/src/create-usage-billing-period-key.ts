export function createUsageBillingPeriodKey(occurredAt: Date): string {
  return occurredAt.toISOString().slice(0, 7);
}
