import { Card } from "@studiocar/ui";
import { PLUS_PRODUCT, type PaymentHistoryEntry } from "@studiocar/contracts";

import { BILLING_PAYMENT_STATUS_LABELS } from "../billing/usage-billing.constants";
import { formatPlanPrice } from "../../server/plans/format-plan-price";
import { formatProfileDate } from "./format-profile-date";
import { PROFILE_PAYMENT_HISTORY_DESCRIPTION, PROFILE_PAYMENT_HISTORY_EMPTY, PROFILE_PAYMENT_HISTORY_TITLE, PROFILE_HISTORICAL_PURCHASE_LABEL, PROFILE_PAYMENT_HISTORY_COLUMNS, PROFILE_PAYMENT_HISTORY_ID, PROFILE_PAYMENT_ORDER_PREFIX, PROFILE_PAYMENT_PROVIDER_PREFIX, PROFILE_PAYMENT_PURCHASE_PREFIX } from "./profile.constants";

export interface PaymentHistoryCardProps { payments: readonly PaymentHistoryEntry[]; }

export function PaymentHistoryCard({ payments }: PaymentHistoryCardProps) {
  return (
    <Card className="profile-section-card" role="region" id={PROFILE_PAYMENT_HISTORY_ID} aria-label={PROFILE_PAYMENT_HISTORY_TITLE}>
      <header className="profile-section-card__header">
        <h2>{PROFILE_PAYMENT_HISTORY_TITLE}</h2>
        <p>{PROFILE_PAYMENT_HISTORY_DESCRIPTION}</p>
      </header>
      {payments.length === 0 ? <p>{PROFILE_PAYMENT_HISTORY_EMPTY}</p> : (
        <div className="billing-payment-table-wrap">
          <table className="billing-payment-table">
            <thead><tr><th scope="col">{PROFILE_PAYMENT_HISTORY_COLUMNS.date}</th><th scope="col">{PROFILE_PAYMENT_HISTORY_COLUMNS.purchase}</th><th scope="col">{PROFILE_PAYMENT_HISTORY_COLUMNS.amount}</th><th scope="col">{PROFILE_PAYMENT_HISTORY_COLUMNS.status}</th><th scope="col">{PROFILE_PAYMENT_HISTORY_COLUMNS.reference}</th></tr></thead>
            <tbody>{payments.map((payment) => (
              <tr key={payment.id}>
                <td>{formatProfileDate(payment.paidAt ?? payment.createdAt)}</td>
                <td>{payment.productCode === PLUS_PRODUCT.code ? `${PLUS_PRODUCT.name} — ${String(PLUS_PRODUCT.credits)} credits` : PROFILE_HISTORICAL_PURCHASE_LABEL}</td>
                <td>{formatPlanPrice(payment.amountPaise, payment.currency)}</td>
                <td>{BILLING_PAYMENT_STATUS_LABELS[payment.status]}</td>
                <td>
                  {payment.razorpayOrderId ? <small className="billing-payment-reference">{PROFILE_PAYMENT_ORDER_PREFIX} {payment.razorpayOrderId}</small> : null}
                  {payment.razorpayPaymentId ? <small className="billing-payment-reference">{PROFILE_PAYMENT_PROVIDER_PREFIX} {payment.razorpayPaymentId}</small> : null}
                  <small className="billing-payment-reference">{PROFILE_PAYMENT_PURCHASE_PREFIX} {payment.id}</small>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
