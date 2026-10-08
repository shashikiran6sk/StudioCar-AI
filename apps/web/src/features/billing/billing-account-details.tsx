import Link from "next/link";
import { BILLING_PAYMENT_STATUS_LABELS } from "./usage-billing.constants";

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
    razorpayOrderId?: string | null;
    receipt: { id: string } | null;
  }[];
}

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export function BillingAccountDetails({ status, payments }: BillingAccountDetailsProps) {
  return (
    <div className="billing-account-details">
      <section className="billing-detail-card" aria-label="Purchased credits">
        <h2>Purchased credits</h2>
        <p>{status.purchasedCredits} remaining</p>
        <p>Credits never expire. Buy additional credits at any time.</p>
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
                    <td>{"StudioCar Plus — 100 Credits"}{payment.razorpayOrderId ? <small className="billing-payment-reference">Order: {payment.razorpayOrderId}</small> : null}</td>
                    <td>{money.format(payment.amountPaise / 100)}</td>
                    <td>{BILLING_PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}</td>
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
