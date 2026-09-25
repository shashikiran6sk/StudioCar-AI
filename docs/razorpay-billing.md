# Razorpay billing operations

Studio Plus is an Orders API purchase. Studio Pro is a monthly Razorpay Plan and Subscription. Browser Checkout callbacks are verified but financial effects come from signed webhooks. The plan catalog in `PlanConfig` supplies the current price, allowance, and batch limit. `PlanPrice` preserves each Pro provider plan, environment, price, and allowance version.

## Business identity

StudioCar AI is the product brand. The merchant is the configured sole proprietorship, and the receipt snapshots its legal business name, proprietor, address, and billing email at payment time. Enter the actual identity used on the Razorpay merchant account before enabling checkout. Do not put real legal details in the repository.

Create a private JSON file outside the repository with this shape, then run `pnpm billing:business:setup /absolute/private/path.json` in the target environment:

```json
{
  "businessType": "SOLE_PROPRIETORSHIP",
  "legalProprietorName": "<legal proprietor>",
  "legalBusinessName": "<registered proprietorship>",
  "tradingName": "<trading name>",
  "productBrandName": "StudioCar AI",
  "businessAddress": "<registered address>",
  "billingEmail": "billing@example.invalid",
  "supportEmail": "support@example.invalid",
  "gstRegistered": false,
  "gstin": null
}
```

The command validates with Zod and stores the object as `AppConfig.billing-business` in PostgreSQL. It never prints the values. Review access to that database row as business data. Billing currently issues a **PAYMENT RECEIPT** with zero tax only for a business configured as not GST registered. A GST-registered configuration is accepted as data but checkout is blocked until tax rate, place of supply, customer billing details, and compliant tax invoice numbering are implemented and reviewed. It must not be enabled by inventing a tax rate.

## Development and Test Mode

1. Open the Razorpay Dashboard and switch to **Test Mode**.
2. Generate a Test API key. Set `APP_ENV=development` and put `RAZORPAY_KEY_ID=rzp_test_...`, `RAZORPAY_KEY_SECRET`, and a distinct `RAZORPAY_WEBHOOK_SECRET` in the development secret store. `APP_ENV=local` also accepts only Test keys for local payment work.
3. Apply migrations and run `pnpm db:seed`; review the Studio Plus ₹1,999 and Studio Pro ₹5,499/400 catalog rows in the admin pricing page.
4. Configure the sole proprietor's merchant identity using the private setup command above. Confirm it matches the Razorpay account.
5. Run `pnpm billing:razorpay:setup --create` intentionally. It creates one ₹5,499 monthly Test Plan and stores its ID in `PlanPrice`. Running without `--create` only reports the existing mapping. A changed Pro price or allowance needs a new mapping and provider Plan; existing subscriptions keep their old version.
6. Configure `https://<development-public-url>/api/webhooks/razorpay` as a Test webhook. A local server needs a public HTTPS tunnel. Use a Test webhook secret distinct from Live.
7. Enable `payment.captured`, `payment.failed`, `subscription.authenticated`, `subscription.activated`, `subscription.charged`, `subscription.pending`, `subscription.halted`, `subscription.paused`, `subscription.resumed`, `subscription.cancelled`, `subscription.completed`, `refund.created`, `refund.processed`, and `refund.failed` if available to the account. Check the Dashboard's current event list against [Razorpay subscription events](https://razorpay.com/docs/payments/subscriptions/subscribe-to-webhooks) and [webhook validation](https://razorpay.com/docs/webhooks/validate-test/).
8. Run the Studio Plus and Studio Pro manual flows below with Test Checkout. Test and Live have separate keys, webhooks, and Plan IDs.

## Production and Live Mode

1. Activate the Razorpay merchant account and confirm its legal identity matches `AppConfig.billing-business`.
2. Switch the Dashboard to **Live Mode** and generate Live credentials. Set `APP_ENV=production`, `RAZORPAY_KEY_ID=rzp_live_...`, `RAZORPAY_KEY_SECRET`, and a separate Live `RAZORPAY_WEBHOOK_SECRET` in the production secret store. A Test key in production fails configuration validation.
3. Apply the reviewed migration and seed the catalog. Configure the real business record in the production database.
4. Run `pnpm billing:razorpay:setup --create` in the production environment. Confirm the stored Live Plan is ₹5,499/month with 400 images in the matching `PlanPrice` row. Never copy a Test Plan ID to production.
5. Configure `https://<production-domain>/api/webhooks/razorpay` over HTTPS with the Live webhook secret and the events listed above.
6. Run a controlled Live payment smoke test and reconcile Razorpay's order, payment, subscription, receipt, and credit records before general availability.

For credential rotation, generate a new key in the same mode, deploy it with its secret, verify Checkout and webhook delivery, then retire the old key. Rotate the webhook secret separately; Razorpay may retry older events signed with the previous secret, so arrange an overlap window or an explicit replay/reconciliation plan. Never print secrets or place them in `NEXT_PUBLIC_` variables. Only the public key ID is sent in a Checkout response.

## Accounting and recovery

- A captured Plus payment creates one Payment, a +100 purchased-credit ledger grant, and one receipt in one transaction. Repeated webhook IDs and repeated payment IDs are constrained.
- Each captured Pro charge creates its own Payment, receipt, and 400-image `SubscriptionAllowance` for the exact provider period. Old unused allowance stays historical. Processing reserves Pro before purchased credits under a per-user PostgreSQL advisory transaction lock.
- The processing outbox persists with the job. A transient enqueue failure leaves the reservation attached to a retryable outbox message. Terminal worker failure releases a Pro reservation or refunds a purchased-credit debit. Review dead-lettered jobs operationally; a job not yet terminal remains reserved.
- A refund is recorded and the payment/receipt status changes without deleting its original receipt. Purchased credits are **not automatically reversed** because part may already be spent. An audit entry flags the payment for manual reconciliation. Review the credit ledger and the customer's consumed jobs before any administrator adjustment.
- If the remote subscription creation succeeded but its local update failed, the local attempt stays `CREATED`. Its `internalSubscriptionId` is in Razorpay notes, allowing the signed webhook to attach the provider ID. An attempt still stuck in `CREATED` needs operator reconciliation; do not automatically create another remote subscription.
- Browser callbacks only record verified intent. The browser polls `/api/billing/status` for a bounded confirmation window. A timeout is not proof of failed payment; inspect Razorpay and the webhook inbox before retrying.

## Manual Test Mode checklist

1. Choose Studio Plus, pay ₹1,999 in Test Checkout, and confirm the callback signature, captured webhook, +100 purchased credits, payment history row, receipt, owner-only view, and Print / Save as PDF.
2. Choose Studio Pro, authorize the ₹5,499 monthly mandate, confirm the subscription signature and `subscription.charged` webhook, then check the current period's 400 allowance and receipt.
3. Repeat captured and charged webhooks with the same and different event IDs; verify one grant/allowance/receipt per provider payment.
4. Test failed and dismissed Checkout, a lost callback, network loss while polling, pending and halted lifecycle events, end-of-period cancellation, and a second month's charge with no rollover.
5. Process a batch across Pro and purchased credits, submit concurrent batches, exhaust both balances, and verify failed jobs return reserved credits.
6. Issue a Test refund, verify the original receipt remains marked refunded and a reconciliation audit entry exists. Confirm another user receives 404 for the receipt.

## Production go-live checklist

Confirm mode-specific keys and Plan mappings, merchant identity, non-GST receipt wording, HTTPS webhooks and secret, supported payment methods, automatic capture, a successful controlled Live charge, webhook inbox processing, cancellation, refund reconciliation ownership, and on-call access to failed event and dead-letter queues. Enable purchasing only after a complete Live receipt and entitlement flow has been verified.

## Official API references

- [Orders and Standard Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/)
- [Plans API](https://razorpay.com/docs/api/payments/subscriptions/create-plan/)
- [Subscriptions API](https://razorpay.com/docs/api/payments/subscriptions/create-subscription/)
- [Subscription Checkout and signature](https://razorpay.com/docs/payments/subscriptions/integration-guide/)
- [Cancel subscription](https://razorpay.com/docs/api/payments/subscriptions/cancel-subscription/)
- [Webhook events](https://razorpay.com/docs/webhooks/subscriptions)
- [Webhook signature and event ID](https://razorpay.com/docs/webhooks/validate-test/)
