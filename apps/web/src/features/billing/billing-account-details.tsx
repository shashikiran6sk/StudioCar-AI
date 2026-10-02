import Link from "next/link";

import { CancelSubscriptionAction } from "./cancel-subscription-action";
import type { getBillingStatus } from "../../server/billing/get-billing-status";

type BillingStatus = Awaited<ReturnType<typeof getBillingStatus>>;

export interface BillingAccountDetailsProps {
  status: BillingStatus;
  payments: readonly {
    id: string;
    createdAt: Date;
    productCode: string;
    amountPaise: number;
    currency: string;
    status: string;
    receipt: { id: string } | null;
  }[];
}

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export function BillingAccountDetails({ status, payments }: BillingAccountDetailsProps) {
  const subscription = status.subscription;
  return (
    <div className="billing-account-details">
      {subscription ? (
        <section className="billing-detail-card" aria-label="Studio Pro billing period">
          <h2>Studio Pro</h2>
          <p>{subscription.pricePaise === null ? "Monthly subscription" : `${money.format(subscription.pricePaise / 100)}/month`}</p>
          <p>Status: {subscription.status}</p>
          {subscription.currentPeriodStart && subscription.currentPeriodEnd ? (
            <p>Current billing period: {dateFormat.format(new Date(subscription.currentPeriodStart))} – {dateFormat.format(new Date(subscription.currentPeriodEnd))}</p>
          ) : null}
          <p>Monthly allowance: {subscription.remaining} / {subscription.allowance} remaining</p>
          {subscription.currentPeriodEnd && !subscription.cancelAtPeriodEnd ? <p>Next billing date: {dateFormat.format(new Date(subscription.currentPeriodEnd))}</p> : null}
          {subscription.cancelAtPeriodEnd ? <p>Cancellation scheduled at period end.</p> : subscription.status === "ACTIVE" ? <CancelSubscriptionAction /> : null}
        </section>
      ) : null}
      <section className="billing-detail-card" aria-label="Purchased credits">
        <h2>Purchased credits</h2>
        <p>{status.purchasedCredits} remaining</p>
      </section>
      <section className="billing-detail-card" aria-label="Payment history">
        <h2>Payment History</h2>
        {payments.length === 0 ? <p>No payments yet.</p> : (
          <div className="billing-payment-table-wrap">
            <table className="billing-payment-table">
              <thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th><th>Receipt</th></tr></thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{dateFormat.format(payment.createdAt)}</td>
                    <td>{payment.productCode === "STUDIO_PLUS" ? "Studio Plus — 100 Credits" : "Studio Pro — Monthly"}</td>
                    <td>{money.format(payment.amountPaise / 100)}</td>
                    <td>{payment.status === "PAID" ? "Paid" : payment.status}</td>
                    <td>{payment.receipt ? <Link href={`/billing/receipts/${payment.receipt.id}`}>View</Link> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
