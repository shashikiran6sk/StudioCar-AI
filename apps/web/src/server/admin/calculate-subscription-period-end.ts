/**
 * When an assigned plan stops applying.
 *
 * Whole calendar months, so a plan assigned on the 31st of a month with fewer
 * days ends on that month's last day rather than rolling into the next one —
 * which would quietly give somebody more than was assigned.
 */
export function calculateSubscriptionPeriodEnd(
  start: Date,
  months: number,
): Date {
  const end = new Date(start.getTime());
  const targetMonth = end.getUTCMonth() + months;
  const dayOfMonth = end.getUTCDate();

  end.setUTCDate(1);
  end.setUTCMonth(targetMonth);
  const lastDayOfTargetMonth = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0),
  ).getUTCDate();
  end.setUTCDate(Math.min(dayOfMonth, lastDayOfTargetMonth));

  return end;
}
