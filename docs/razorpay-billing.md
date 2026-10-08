# Plus-only Razorpay billing and release runbook

StudioCar supports one paid product: **StudioCar Plus, ₹1,999 INR (199900 paise), 100 image credits, one-time payment**. Credits never expire, carry forward indefinitely, and each successful new purchase adds 100. Free remains 15 lifetime images, maximum five per batch. Purchased processing uses a separate ledger and never consumes the free trial; after a purchase, paid processing requires an available purchased balance, matching the existing paid-account behavior. Paid batches support up to 20 images.

The server validates the database product against the canonical Plus product. Administrators cannot change its price, currency, billing interval, or credit quantity. They can pause sales and manage copy, batch limits and storage. There are no recurring allowances, monthly resets, renewal dates, mandates, Plans API calls or subscription capabilities.

## Architecture and endpoints

Browser → authenticated same-origin Route Handler → BillingService → local Payment → Razorpay Orders API → Checkout. Order creation and verification use the existing durable command limiter (10 order requests and 30 verification requests per tenant per minute).

| Endpoint | Responsibility |
| --- | --- |
| `POST /api/billing/orders` | Snapshot authoritative price and credits in a pending local purchase; create the Razorpay order |
| `POST /api/billing/orders/verify` | Verify `order_id|payment_id` HMAC signature; record verified intent only |
| `GET /api/billing/status?orderId=…` | Owner-scoped available purchased balance, cumulative grants and that order's status |
| `GET /api/billing/receipts` | Owner-only receipt history |
| `GET /api/billing/receipts/[receiptId]` | Owner-only receipt, with current payment/refund status |
| `POST /api/webhooks/razorpay` | Verify raw bytes before parsing; process only payment/refund events |

Removed: all three `/api/billing/subscriptions` creation, verification and cancellation handlers, `/admin/subscriptions`, manual assignment/lifecycle tools, recurring provider adapter methods and `billing:razorpay:setup`. Prisma no longer contains `PlanSubscription`, `PlanPrice`, `SubscriptionAllowance`, their lifecycle/source enums, or subscription identifiers on payments and allocations. The unused PlanConfig providerPriceId is removed only when empty; populated values stop for review. Historical migration files and audit sentences remain readable history; they expose no billing capability.

## Payment and credit invariants

Checkout never grants credits. A signed `payment.captured` event must match an existing local order, ₹1,999, INR and the 100-credit product. Finalization serializes by order and tenant and atomically writes the captured Payment, one `PURCHASE_GRANT` of +100 and an immutable Receipt. Database unique constraints protect provider order ID, provider payment ID, ledger type/reference, receipt payment ID and provider/event ID. A capture already finalized is checked against its payment ID and never re-granted, including after a refund.

Purchases accumulate: +100 −25 +100 = **175**. There is no expiry field, credit billing period, or reset scheduler. UsageEvent's existing YYYY-MM key remains reporting metadata only. Processing reservations serialize on `billing-credit:<userId>`, debit purchased credits once when jobs are created, and keep them reserved during retryable failures. Successful completion consumes the allocation. Terminal failure conditionally releases it and records a +1 `PROCESSING_REFUND`; duplicates cannot release or consume twice. Free quota accounting continues counting completed and in-flight free jobs.

The durable webhook inbox stores normalized financial identifiers/status/amount fields, without raw customer/card payloads. Duplicate deliveries lock the event; different events for one order lock the order. Invalid signatures get 401, malformed events get 400, and failed database/financial processing gets 503. Failed events remain FAILED with a sanitized recovery message and no processed timestamp. Unknown local orders are retryable failures, never successful financial events.

Refund events preserve the receipt and original grant. A processed refund updates payment status and creates one reconciliation audit entry per provider refund. Older pending/failed refund deliveries cannot regress a processed refund. Credits may already be spent, so refunds do **not** automatically claw back credits or create a negative balance. The operator must review consumed jobs and outstanding reservations, agree the customer balance treatment, and apply a separately reviewed ledger adjustment if needed. Refunds remain a manual accounting process.

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

## Safe deployment from main (all customers currently Free)

PR #73 has never shipped. Do not reset production, edit applied migrations or use `prisma db push`. Back up the database and inspect counts for `PlanSubscription`, any `SubscriptionAllowance`/recurring Payment rows if the earlier billing migration was applied, and pending processing jobs. The user reports no paid customers; the contraction independently verifies that assumption. It refuses **any** historical subscription row, not just active subscribers.

1. Pause Plus sales (`PlanConfig.active=false`) and disable public billing during rollout and retain the pre-release database backup. Run `node scripts/prepare-billing-expand.mjs`, then `pnpm --filter @studiocar/web exec prisma migrate deploy --config prisma.expand.config.ts`. This applies the unchanged historical migrations plus expansion and rate-limit enums, excluding contraction and every later cleanup migration. It does not remove tables. The allocation source default supports both old and new generated clients.
2. Roll out this web release and its matching image-worker archive against the expanded schema. Configure the new webhook only after old billing routes are inaccessible. Main never had Razorpay billing, so no recurring provider charges exist from this deployment. The new application filters old Pro catalog rows during the transition.
3. Drain old web instances and old Lambda executions/versions. Confirm no stale build or worker can access removed models. Disable the previous PR preview webhook and retire stale tabs/builds. There must be no rollback to subscription code after contraction.
4. Only after that operational confirmation, set the marker with a reviewed SQL command in the target database:

   ```sql
   INSERT INTO "AppConfig" ("key", "value", "updatedAt")
   VALUES ('billing.plus-only.rollout-drained', 'true'::jsonb, CURRENT_TIMESTAMP)
   ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP;
   ```

5. Run normal `pnpm db:migrate:deploy`, then `pnpm db:migrate:status` and `pnpm db:seed`. Contraction uses one transaction and a five-second lock timeout, guards all recurring associations, removes only empty subscription history structures and obsolete configuration, preserves Payments/Receipts/Ledger/Jobs/AuditLog, and removes the marker. Seeding is idempotent. Fresh databases with zero users can apply the whole chain directly, as CI does.
6. If contraction refuses data or times out, stop and inspect it. Do not delete rows to make the guard pass. After fixing the cause, resolve the failed Prisma migration as rolled back (`prisma migrate resolve --rolled-back 20261008110000_plus_only_contract`) before retrying. If real subscribers unexpectedly exist, export their subscriptions, payments, receipts and allowances; review a bespoke archival and remaining-credit conversion migration; confirm actual Razorpay cancellation and customer communication with the merchant before any contraction. This release does not silently cancel mandates or discard financial history.

Expansion can be rolled back at the application level before contraction. After contraction, rollback requires a compatible Plus-only build or a reviewed database restoration; do not deploy the old generated client. Existing purchased grants, receipts and original timestamps are never rewritten by the cleanup.

## Razorpay Dashboard and environment setup

1. Switch to **Test Mode**. Generate/use Test API keys. Set server-side `RAZORPAY_KEY_ID=rzp_test_…`, `RAZORPAY_KEY_SECRET` and a distinct `RAZORPAY_WEBHOOK_SECRET` with `APP_ENV=development` (Local also permits Test keys). Use the existing key configuration; there is no plan ID variable or setup script.
2. Configure the merchant identity above and review the seeded ₹1,999/100 product. Keep secrets out of `NEXT_PUBLIC_*`, logs and commits.
3. Set payment capture to **automatic** in Razorpay Dashboard. Authorized payments alone cannot grant credits.
4. Create/update the HTTPS webhook URL: `https://<test-public-host>/api/webhooks/razorpay`. A local server requires a public HTTPS tunnel.
5. Select **only** `payment.captured`, `payment.failed`, `refund.created`, `refund.processed`, `refund.failed`. Deselect subscription events on an earlier test webhook. If experimental recurring Plans exist, they need no replacement and are never referenced. Review Dashboard subscriptions/mandates and confirm none are active; if any exist, investigate their origin and explicitly approve cancellation rather than leaving charges running.
6. After the full staged rollout and testing, use **Live Mode**, `APP_ENV=production`, `rzp_live_…` keys and a separate Live webhook/secret. Confirm the legal merchant identity, capture settings and live domain. Test keys are refused in Production and Live keys in Local/Development. Perform one controlled Live purchase and reconcile its receipt and grant before public sales.

No subscription-only environment variables existed in PR #73; plan IDs lived in PlanPrice. The three required Razorpay keys remain. CI uses synthetic Test credentials and real PostgreSQL; no CI/deployment command creates recurring plans. Merchant setup remains `pnpm billing:business:setup`. Key rotation and webhook-secret rotation are separate: account for deliveries signed with an older secret through provider replay/reconciliation before retiring it.

## Merchant testing checklist

1. Sign in with a fresh free account. Note free usage and purchased balance separately. Buy Plus; verify Checkout shows ₹1,999 INR, one-time payment and the provider order ID.
2. Complete Test Checkout. Confirm pending UI first, then one captured payment, +100 purchased credits, one receipt, owner-only receipt/API access and Print / Save as PDF.
3. Process 25 images using multiple batches if needed; expect paid balance 75. Buy again; expect **175**, then process 20 and expect **155**. Cross a month boundary (or inspect an older grant); there must be no reset/expiry.
4. Dismiss or fail Checkout. There must be no grant or receipt. A Checkout callback without a captured event must remain pending/verified with zero new credits. Delay the webhook past the bounded 15-attempt polling window: use **Check payment confirmation**, which does not create a second purchase.
5. Replay captured events with the same ID and different IDs, including concurrent delivery. Confirm one provider payment → one +100 grant → one receipt. Send an invalid HMAC or wrong amount/currency: reject without a grant. Unknown local orders remain recoverable FAILED events.
6. Submit concurrent image batches against a nearly exhausted balance. Only affordable jobs are reserved. Exercise success, retryable failure, terminal failure and duplicate delivery; refunds happen once, and retryable jobs retain reservations.
7. Issue a Test refund. The original receipt remains, the payment status changes, one accounting-review audit entry appears, and credits are unchanged until deliberate reconciliation. Replay a capture afterward; no extra credits may appear.
8. Verify the homepage/billing page show Free and StudioCar Plus only. Plus remains purchasable after a prior purchase. Creation/verification/cancellation subscription routes and `/admin/subscriptions` return 404. There are no renewal dates, recurring progress, Pro cards or cancel actions.

## Recovery and operations

Investigate inbox rows with `provider='RAZORPAY' AND status IN ('RECEIVED','FAILED')`, old CREATED/VERIFIED/FAILED payments and order IDs in Razorpay Dashboard. Monitor 503 delivery failures and configure Razorpay webhook failure notifications. Dashboard delivery replay can retry the original signed event after fixing the database or merchant configuration.

For a captured order whose webhook is delayed, disabled or no longer retried, use the target environment's private credentials:

```sh
pnpm billing:reconcile order_<provider-order-id>
```

The command fetches the order and its payments using authenticated Razorpay APIs, validates order amount/currency and its local receipt UUID, recovers a missing local order association, and finalizes only captured payments through the same transactional finalizer. Re-running cannot duplicate grants or receipts. It records an audit entry; merely authorized payments do nothing. Provider network/auth failures are safe to retry. After reconciliation, retry a failed inbox delivery to close its history. Failed order creation before the remote ID was saved can be matched using Razorpay's receipt UUID; never guess or create another charge to recover it.

Reconciliation is an operator command, not a scheduler. Assign responsibility for daily pending-payment/inbox review and alert response before launch. Do not log provider bodies, secrets, signature values, card data or raw payloads. Free/paid allocation separation and existing processing outbox/DLQ recovery remain unchanged. Baseline image-processing certification findings from earlier work remain outside this billing refactor; see the archived PR #73 evidence.

## Official references

- [Orders and Standard Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/)
- [Webhook signature validation, duplicate event IDs and retries](https://razorpay.com/docs/webhooks/validate-test/)
