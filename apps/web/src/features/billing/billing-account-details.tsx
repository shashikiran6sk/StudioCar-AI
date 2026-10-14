import Link from "next/link";

import type { getBillingStatus } from "../../server/billing/get-billing-status";
import { PROFILE_PAYMENT_HISTORY_LINK } from "../profile/profile.constants";

type BillingStatus = Awaited<ReturnType<typeof getBillingStatus>>;

export interface BillingAccountDetailsProps { status: BillingStatus; }

export function BillingAccountDetails({ status }: BillingAccountDetailsProps) {
  return (
    <div className="billing-account-details">
      <section className="billing-detail-card" aria-label="Purchased credits">
        <h2>Purchased credits</h2>
        <p>{status.purchasedCredits} remaining</p>
        <p>Credits never expire. Buy additional credits at any time.</p>
        <Link href={PROFILE_PAYMENT_HISTORY_LINK}>View payment history in Profile</Link>
      </section>
    </div>
  );
}
