import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { LOGIN_PATH, BILLING_PATH } from "../../../../app-routes";
import { PrintReceiptAction } from "../../../../../features/billing/print-receipt-action";
import { getCurrentSession } from "../../../../../server/auth/get-current-session";
import { getBillingRuntime } from "../../../../../server/billing/billing-runtime";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const fullDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default async function ReceiptPage({ params }: { params: Promise<{ receiptId: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect(LOGIN_PATH);
  const { receiptId } = await params;
  if (!z.uuid().safeParse(receiptId).success) notFound();
  const receipt = await getBillingRuntime().database.receipt.findFirst({
    where: { id: receiptId, userId: session.userId },
    include: { payment: { select: { status: true, razorpayPaymentId: true } } },
  });
  if (!receipt) notFound();

  return (
    <div className="receipt-page">
      <div className="receipt-controls"><Link href={BILLING_PATH}>Back to Usage & Billing</Link><PrintReceiptAction /></div>
      <article className="receipt-document">
        <header><h1>StudioCar AI</h1><h2>PAYMENT RECEIPT</h2></header>
        <p>Receipt No: {receipt.receiptNumber}<br />Date: {fullDate.format(receipt.paidAt)}</p>
        <div className="receipt-parties">
          <section><h3>Merchant</h3><p>StudioCar AI<br />A product of {receipt.businessLegalName}<br />Proprietor: {receipt.proprietorName}<br />{receipt.businessAddress}<br />{receipt.billingEmail}</p></section>
          <section><h3>Billed To</h3><p>{receipt.customerName ?? "Customer"}<br />{receipt.customerEmail ?? ""}</p></section>
        </div>
        <section><h3>Description</h3><p>{receipt.productName} — {receipt.description}</p></section>
        <dl className="receipt-totals">
          <div><dt>Subtotal</dt><dd>{money.format(receipt.subtotalPaise / 100)}</dd></div>
          <div><dt>Tax</dt><dd>{money.format(receipt.taxPaise / 100)}</dd></div>
          <div><dt>Total</dt><dd>{money.format(receipt.totalPaise / 100)}</dd></div>
        </dl>
        <p>Payment Status: {receipt.payment.status}<br />Payment Method: {receipt.paymentMethod ?? "Not provided"}<br />Razorpay Payment ID: {receipt.payment.razorpayPaymentId}</p>
        <footer>Thank you for using StudioCar AI.</footer>
      </article>
    </div>
  );
}
