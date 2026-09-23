# StudioCar AI Implementation Progress

Last updated: 2026-09-23

## Current status

Every slice in the accepted plan is implemented and merged.

The production foundation, authentication with account linking, private direct
uploads, asynchronous provider-independent processing, truthful polling,
screenshot-derived product surfaces, immutable-event-backed Usage & Billing, and
durable transactional email are in place. So are browser response hardening, a
blocking production dependency audit, durable authenticated command limits,
runtime secret isolation, signed-webhook verification, bounded retention,
durable abandoned-upload cleanup, production read-path hardening, and the
image-worker observability foundation.

Database ownership belongs to `apps/web`, S3 and SQS connections are
configurable, phone OTP uses the MSG91 Widget flow, and a deterministic local
environment reproduces the production data plane end to end.

The internal administration area is complete. Authorization is a row in
`UserRole` and is re-checked against the database on every page and every
mutation. Plan prices, allowances and batch limits are configuration rows read
fresh on each request; the application carries no second copy of a plan. An
administrator can assign a paid plan by hand, administer the public footer's
social links, manage who else has access, and read the recent administrative
changes. Every change writes an `AuditLog` entry naming who made it.

Payment checkout remains intentionally unavailable until a billing provider is
selected, and no plan is marked purchasable. See **Not yet implemented** for
everything the accepted plan still leaves open.

## Completed

### SC001 — Monorepo foundation

- Established pnpm workspaces and Turborepo tasks for lint, typecheck, test, integration test, build, and end-to-end test.
- Created the Next.js web application and shared packages/workers.
- Added strict shared TypeScript and ESLint configuration, CI, Vitest, React Testing Library, and Playwright foundations.

### SC002 — Design-system primitives

- Implemented shared tokens and reusable UI primitives from `docs/design.md`.
- Added component behavior/accessibility tests and the initial visual smoke flow.

### SC003 — Canonical contracts and environment validation

- Added Zod contracts for vehicles, uploads, processing options, jobs, phone auth, usage, worker messages, webhooks, and API errors/idempotency.
- Added strict server/client environment validation with provider-specific requirements.
- Added behavior-source test mapping enforcement.

### SC004 — Persistence foundation

- Added the canonical Prisma model and a reviewable initial migration.
- Added indexes and database constraints for tenant queries, processing, sessions, and usage.
- Added a bounded PostgreSQL pool and real-database schema integration tests.

### SC005 — Tenant and session repositories

- Added tenant-scoped vehicle repository operations with filtering, sorting, search, and cursor pagination.
- Added session creation, lookup, rotation, and revocation repository operations.
- Verified cross-tenant failure behavior and session transactions against real PostgreSQL.

### SC006 — Opaque session lifecycle

- Added cryptographically secure opaque session issuance, SHA-256 hashing, authentication, rotation, and logout services.
- Added secure production and local-development cookie policies.
- Added focused unit tests and verified all local quality gates.

### SC007 — Google OAuth/OIDC

- Added Authorization Code authentication with PKCE, state, OIDC nonce, discovery, and verified ID-token claims through `openid-client`.
- Added short-lived, one-time PostgreSQL OAuth challenges that retain only a state hash and an AES-256-GCM-protected PKCE/nonce payload.
- Bound each flow to the initiating browser with a short-lived HttpOnly, SameSite=Lax, Secure-in-production state cookie to prevent login CSRF.
- Added canonical Google identity resolution by `provider + providerSubject`; email is profile data and collisions require explicit authenticated linking.
- Added opaque application-session issuance after successful identity resolution and thin App Router start/callback endpoints.
- Added a backward-compatible OAuth challenge migration, concurrency-safe repository behavior, unit/route tests, and real PostgreSQL integration tests.

### SC008 — MSG91 phone OTP

- Added Indian mobile-number normalization to canonical E.164 values and validated public start/verify response contracts.
- Added browser-bound, expiring PostgreSQL OTP challenges and verification attempts without storing raw OTP values.
- Added transaction-level advisory locks for concurrent per-phone/per-IP send limits, per-challenge attempt caps, and per-IP verification limits.
- Added an MSG91 V5 adapter behind a provider port; credentials stay server-side and provider response/error semantics do not leak into product routes.
- Added same-origin enforcement, opaque client-address hashing, stable API errors, Retry-After responses, secure binding cookies, and separate start/verify App Router endpoints.
- Added canonical `PHONE + E.164 number` identity resolution and atomic challenge consumption, identity creation/update, and opaque session creation.
- Added a backward-compatible migration, unit/route tests, and real PostgreSQL integration tests for concurrent limiting, identity conflicts, and exactly-once session completion.

### SC009A — Sign-in UI and authorization shell

- Added a screenshot-aligned, responsive sign-in surface for Google OAuth and MSG91 phone OTP with safe return-path handling, local validation, provider-safe errors, pending states, and OTP-step focus management.
- Added request-scoped session lookup for Server Components, an authenticated App Router layout, a responsive sidebar/topbar shell, truthful dashboard empty state, and inaccessible placeholders for product routes that are not implemented yet.
- Added same-origin POST logout with database-backed session revocation, secure cookie clearing, and a redirect back to sign in.
- Added the shared link-button primitive and forwarded input refs required for accessible form focus behavior.
- Expanded web component-test discovery and TypeScript coverage, added focused route/service/component tests, and added desktop/mobile Playwright coverage for the unauthenticated redirect and sign-in UI.

### SC009B — Profile and session security

- Added a canonical profile contract and tenant-scoped repository for display details, linked Google/phone identities, and active-session counts without exposing provider subjects or session tokens.
- Added a responsive profile surface for display-name editing, verified contact details, linked sign-in status, current-session expiry, current-device logout, and all-device revocation.
- Added a same-origin authenticated profile update endpoint and a separate same-origin logout-all endpoint that revokes every active database session and clears the browser cookie.
- Added unit, component, route, and real-PostgreSQL repository coverage. The CI browser job now provisions PostgreSQL and applies migrations for an authenticated Playwright profile/update/logout-all flow.

### SC010 — Direct private-S3 uploads

- Added canonical presign/commit request and response contracts with required SHA-256 integrity, immutable tenant-prefixed object keys, and replay-safe upload-intent idempotency.
- Added a tenant-scoped image-asset repository and backward-compatible idempotency migration. Duplicate intent reservations and upload commits resolve to the same authoritative PostgreSQL asset.
- Added separate same-origin authenticated presign and commit endpoints behind application services and storage/repository ports; browser image bytes travel directly to private S3 and never through Next.js.
- Added an AWS SDK v3 S3 adapter that binds content length, SHA-256, and ownership metadata to short-lived PUT requests. Commit verifies S3 HEAD metadata and a bounded range of image bytes before the `PENDING_UPLOAD` to `UPLOADED` transition.
- Added JPEG, PNG, and WebP magic-byte/dimension parsing with configured axis and total-pixel limits, deterministic invalid states, and no fabricated browser trust.
- Added a deployable CloudFormation template for retained, encrypted, versioned, public-access-blocked storage, exact-origin CORS, TLS enforcement, lifecycle cleanup for replaced object versions, and a least-privilege application policy.
- Added contract, configuration, parser, service, handler, route, S3 adapter, and real-PostgreSQL repository tests.

### SC011A — Vehicle draft boundary

- Added canonical serialized vehicle, create response, update response, and vehicle-path contracts for the creation workflow.
- Added replay-safe vehicle creation idempotency with a backward-compatible nullable key and tenant-scoped unique index.
- Added tenant-owned draft reservation and draft-only update repository operations with deterministic idempotency, duplicate-reference, not-found, and race outcomes.
- Added a provider-independent vehicle application service and separate same-origin authenticated create/update App Router endpoints. Route handlers validate canonical Zod input and never contain persistence logic.
- Added contract, mapping, service, handler, route, and real-PostgreSQL repository coverage for exact replays, reused-key conflicts, duplicate stock references, cross-tenant access, and non-draft mutation prevention.

### SC011B1 — Vehicle details UI foundation

- Added the screenshot-derived Vehicle Details form with the required two-column desktop layout, responsive single-column behavior, inline Zod validation, pending/error states, and the exact Step 1 action hierarchy.
- Added a focused reusable textarea primitive with accessible hint/error associations.
- Added transient Zustand wizard state for draft identity, step navigation, and editable vehicle details; PostgreSQL remains authoritative after draft creation.
- Added form normalization, component accessibility, validation, error recovery, store, and textarea tests. The form remains intentionally unmounted until the remaining wizard steps can be delivered without exposing a dead-end workflow.

### SC011B2 — Direct photo upload step

- Added the screenshot-derived upload dropzone, free-plan limit messaging, ordered image rows, local thumbnails, accessible reorder/remove controls, retry actions, responsive layout, and truthful upload statuses.
- Added per-file selection validation so unsupported, oversized, and excess images are rejected independently without discarding valid or already uploaded work.
- Added browser SHA-256 calculation, authenticated presign calls, direct browser-to-S3 XHR uploads with measured byte progress, and authoritative upload commit validation. Image bytes never pass through Next.js.
- Extended transient Zustand wizard state with per-photo progress, failure, authoritative asset metadata, ordering, removal, and object-URL cleanup while PostgreSQL and S3 remain authoritative.
- Added focused orchestration, API-boundary, progress transport, validation, store, row, and component tests, including partial-failure preservation. The step remains unmounted until customize/review can complete the modal without a dead end.

### SC011B3 — Customize and review steps

- Extended the canonical processing-options contract with normalized plate-privacy and enhancement flags plus an explicit original-background treatment; product state remains independent of provider semantics.
- Added the screenshot-derived customization surface with four accessible switches, selectable studio presets, preserved originals messaging, responsive behavior, and a deliberately disabled custom-background choice until an authorized background-asset flow exists.
- Added the screenshot-derived review summary with vehicle identity, original preview, photo count, treatment summary, truthful estimated image-credit usage, preserved-original messaging, pending/error states, and a typed processing-command callback.
- Added a complete controlled four-step dialog orchestrator that creates or updates the authoritative vehicle draft, preserves an idempotency key across retries, advances through direct uploads and normalized options, resets transient state on close, and ignores late draft responses after dismissal.
- Added focused contract, API-client, utility, store, accessibility, component, error, and full wizard-orchestration tests. The dialog remains intentionally unmounted until SC012 supplies the real asynchronous processing command; the product will not present a fake successful Process Photos action.

### SC012A — Idempotent processing-batch reservation

- Added canonical create-processing-batch and response contracts with unique, bounded asset IDs and fully normalized processing options.
- Added deterministic SHA-256 batch-request and per-asset job keys in `packages/processing`; exact retries remain stable while changes to asset order or treatment semantics produce a different request hash.
- Added a backward-compatible processing-job migration for batch idempotency keys, request hashes, and source display order, including tenant-scoped uniqueness and lookup indexes.
- Added a tenant-safe PostgreSQL repository that validates the owned draft and every uploaded asset, conditionally freezes the vehicle in `PROCESSING`, and creates the complete job batch in one transaction.
- Made concurrent duplicate reservations harmless: one transaction creates the jobs and exact competitors resolve to the same ordered records; reused keys with different semantics conflict, and incomplete/cross-tenant inputs create nothing.
- Added contract, hashing, JSON normalization, and real-PostgreSQL integration coverage. No route is exposed yet because accepting a processing command before the durable enqueue/outbox boundary would risk stranded work.

### SC012B1 — Durable processing outbox and queue infrastructure

- Added one processing outbox message per job in the same PostgreSQL transaction that reserves the batch and freezes the vehicle, including a backward-compatible migration that backfills any pre-existing `CREATED` jobs.
- Added concurrency-safe bounded claims, expiring leases, attempt tracking, retry scheduling, and an atomic outbox-published plus `CREATED` to `QUEUED` transition. A database or application crash cannot erase accepted enqueue intent.
- Added a provider-independent dispatcher that publishes the stable versioned worker contract, applies bounded exponential backoff with jitter after SQS failures, and never persists raw exception details.
- Added an AWS SDK SQS adapter behind the processing queue port and a deployable CloudFormation stack with encrypted standard queue, retained DLQ, redrive policy, separate least-privilege publisher/consumer policies, and queue-depth, age, and DLQ alarms.
- Added dispatcher, retry, validation, adapter, migration, and real-PostgreSQL outbox coverage. The user-facing command remains closed until SC012B2 composes reservation and dispatch behind authenticated handlers and a scheduled recovery entry point.

### SC012B2 — Processing command activation

- Added a provider-selected processing application service that derives deterministic batch/job hashes, reserves every owned job and outbox record atomically, and immediately attempts durable dispatch without leaking provider semantics into the request contract.
- Added a same-origin, authenticated `POST /api/jobs` endpoint with canonical Zod validation, idempotency enforcement, tenant-safe failure mapping, private no-store responses, and deterministic retry behavior.
- Added a secret-protected internal outbox recovery endpoint and bounded environment configuration for leases, batches, and backoff. Deployments must schedule the recovery call at least once per minute so accepted work survives application or SQS interruptions.
- Mounted the existing screenshot-derived four-step vehicle dialog from the dashboard Upload Vehicle action. The modal now preserves a distinct processing idempotency key across retries, submits uploaded asset IDs and normalized treatment options, closes only after command acceptance, and keeps drafts/originals intact on failure.
- Added service, provider mapping, token authentication, handler, route, environment, client-boundary, launcher, and orchestration tests; the public UI no longer simulates processing success.

### SC012C — Idempotent worker lifecycle

- Added conditional job claims with expiring worker leases, monotonic attempt records, duplicate-delivery suppression, exhausted-lease failure handling, and explicit `QUEUED → PROCESSING → COMPLETED`, retry, and terminal failure transitions.
- Added a provider-independent worker service that classifies retryable network, timeout, 429, and 5xx failures separately from terminal image, request, and authorization failures, with bounded exponential backoff and jitter.
- Made retry scheduling durable by atomically moving the job to `RETRYING` and resetting its existing outbox record. The dispatcher now republishes due retry records and changes them back to `QUEUED` only after SQS acknowledges publication.
- Made completion atomic across `ProcessedAsset`, the successful `ProcessingAttempt`, the `ProcessingJob`, the vehicle aggregate status, and exactly one immutable `BACKGROUND_REMOVAL_COMPLETED` usage event.
- Added stable SQS event contracts and a Lambda-compatible partial-batch handler. Malformed records and unexpected infrastructure exceptions are retried by SQS; terminal, completed, duplicate, and durably rescheduled records are acknowledged.
- Added a backward-compatible retry-scheduling migration, pure retry/classification tests, worker handler tests, and real-PostgreSQL integration coverage for competing claims, duplicate completion, retry republish, usage idempotency, invalid-image failure, and vehicle status reconciliation.

### SC013A — Background-removal provider boundary and remove.bg adapter

- Added the stable `BackgroundRemovalProvider` port with provider-independent binary input, normalized shadow treatment, idempotency tag, timing, request identity, and discriminated success/failure results.
- Added a server-only remove.bg adapter using the official multipart API, `type=car`, transparent WebP output for high-resolution support, current `shadow_type` values, a bounded abort timeout, bounded response bytes, and no provider response-body leakage.
- Normalized 429, 5xx, credential/billing, invalid-request, timeout, network, and malformed-success outcomes into the worker failure taxonomy so retry policy remains outside the adapter.
- Added focused option validation, response ID, HTTP failure, shadow mapping, multipart request, response-boundary, and network-failure tests. No remove.bg credential enters the product application or client bundle.

### SC013B — Private-S3 execution and Lambda runtime

- Added a concrete provider-independent job executor that reads committed originals from private S3, verifies authoritative size and SHA-256 metadata, enforces the remove.bg 22 MB input ceiling, and forces a full bounded Sharp decode before any provider request.
- Added deterministic tenant-prefixed provider-result, processed-output, and WebP-preview keys. Provider results are checksum-tagged and persisted before final rendering so retries after output/database finalization failures reuse the previously charged result instead of invoking the provider again.
- Added output treatment for normalized background, crop, padding, enhancement, format, and quality options, plus bounded inventory previews. Final and preview objects carry job/checksum metadata and remain private; PostgreSQL stores only their immutable keys.
- Added a bounded S3 adapter, worker-only Zod environment, configuration-selected provider factory that fails closed for unimplemented fal.ai/BiRefNet adapters, warm Lambda composition root, and a Node.js 24 handler using the stable partial-batch queue contract.
- Added a deployable CloudFormation worker stack with least-privilege S3/SQS access, Secrets Manager dynamic references, reserved/event-source concurrency limits, `ReportBatchItemFailures`, and a Lambda error alarm.
- Added focused configuration, decoder, transform, checksum, object-key, executor recovery/tamper, S3 adapter, missing-object, and provider-factory tests. The worker build now emits a bundled Lambda entry module while leaving production-native dependencies explicit for Linux arm64 packaging.

### SC014 — Batched processing status and adaptive polling UX

- Extended the canonical job-status contract with owned vehicle identity and a bounded response envelope while preserving explicit states and truthful stages without fabricated provider percentages.
- Added a dedicated tenant-scoped PostgreSQL status repository that returns all requested jobs in request order or no result when any ID is missing or belongs to another tenant. Completed output identity and the latest attempt's retryability are selected without loading unrelated relations.
- Added a processing status application service and authenticated `GET /api/jobs?ids=...` behavior with strict UUID validation, a 100-job batch bound, private no-store responses, stable API errors, and no partial ownership disclosure.
- Added a transient Zustand activity store populated from accepted processing commands, a single batched poller with 1/2/5/10-second adaptive intervals, immediate refresh on visibility, complete pause while hidden, cancellation-safe requests, and immediate per-job polling stop for completed, failed, or cancelled states.
- Added the screenshot-derived compact top-bar activity indicator and bounded activity panel with redundant dot/text status, truthful stage labels, refresh errors, terminal failure presentation, accessible expansion/dismiss controls, and no synthetic progress bars or percentages.
- Added contract, repository integration, service, mapping, handler, route, store, request, interval, visibility, terminal-state, stage-label, and component accessibility tests.

### SC015A — Inventory foundation

- Added canonical inventory query, filter, view, aggregate item, and page contracts with bounded cursor pagination and shareable URL state.
- Added a dedicated tenant-scoped inventory read repository that excludes unfinished drafts, searches vehicle name/brand/model/stock/internal reference, applies status filters and deterministic sorting, derives search-aware filter counts, validates cursors inside the active tenant/filter scope, and selects only bounded job/output fields.
- Added an inventory application service and private-S3 preview signer. Only preview object keys returned by the owned repository are signed, URLs are short-lived, and PostgreSQL/S3 keys remain authoritative.
- Added the screenshot-derived authorized Inventory route with search, sorting, status filters, grid/list views, responsive four/three/two/one-column cards, truthful count-derived processing progress, loading/error/empty/no-result states, cursor continuation, and a working upload CTA.
- Enabled Inventory navigation and routed accepted vehicle-processing submissions to Inventory with an immediate server refresh while retaining the transient global activity store.
- Added contract, service, storage adapter, utility, component, page, real-PostgreSQL repository, and desktop/mobile Playwright coverage. Corrected Turborepo E2E environment pass-through so authenticated browser tests execute instead of silently skipping.
- Verified lint, strict typecheck, unit/source-mapping tests, all migrations, Prisma validation, 14 real-PostgreSQL integration files, production build, and the complete five-test Playwright suite locally.

### SC015B — Vehicle portfolio and authorized asset delivery

- Added a canonical portfolio contract containing normalized processing options, vehicle identity, truthful completion status, and a bounded set of authorized original, processed, preview, and download URLs.
- Added a dedicated tenant-scoped PostgreSQL portfolio repository that returns only an operational owned vehicle and its latest completed processing batch. Processing, draft, missing-output, and cross-tenant records resolve to no portfolio.
- Added an application service that validates persisted processing options, derives completion metadata, and signs only the private object keys selected by the owned repository. Original, processed, preview, and attachment responses use short-lived S3 GET signatures; object keys never enter the client contract.
- Added the screenshot-derived `/inventory/[vehicleId]` Server Component with back navigation, vehicle/treatment summary, partial-success notice, draggable original/processed comparison, selectable thumbnail rail, per-image authorized download, full-screen keyboard viewer, treatment facts, and responsive desktop/mobile layouts.
- Added working portfolio links to Inventory cards only when at least one completed output exists. Edit, reprocess, hero selection, and ZIP download controls remain absent until their mutation/archive boundaries exist.
- Added contract, filename, status mapping, service, S3 signer, utility, component, route-state, inventory-link, real-PostgreSQL latest-batch/tenant-ownership, and authenticated desktop/mobile Playwright coverage.
- Verified source mapping, lint, strict typecheck, 158 web unit/component files with 271 tests, Prisma validation, all migrations, 15 real-PostgreSQL integration files with 30 tests, production build, and the complete five-test Playwright suite locally.

### SC016A — Screenshot-derived marketing homepage

- Replaced the design-foundation placeholder with the complete scrollable homepage from the six supplied references: sticky product navigation, two-column hero, draggable before/after treatment comparison, interactive feature selector, audience strip, four-step workflow, studio-background gallery, shared pricing system, final CTA, and structured footer.
- Added an original repository-owned transparent automotive image and reused the same vehicle across original, Premium White, Dark Studio, and Grey Studio treatments so the visual story demonstrates consistent processing without remote image dependencies.
- Kept all acquisition actions connected to the real authentication entry point. Illustrative plan actions do not simulate checkout and explicitly disclose that paid checkout remains unavailable until a billing provider is connected.
- Established one canonical pricing-plan presentation module for reuse by the future Usage & Billing page, avoiding divergent plan names, prices, limits, and benefits.
- Added marketing design tokens for the documented hero/lift shadows and major-surface radius, plus responsive single-column layouts, horizontally scrollable mobile navigation, 44px mobile actions, keyboard-native feature controls, semantic landmarks, reduced-motion behavior, and optimized Next.js image delivery.
- Added focused component tests for every marketing behavior file, replaced the old foundation browser smoke with full desktop/mobile homepage coverage, and visually compared both rendered pages against all supplied homepage screenshots.
- Verified source mapping, lint, strict typecheck, 168 web unit/component files with 281 tests, Prisma validation, all migrations, 15 real-PostgreSQL integration files with 30 tests, production build, and the complete five-test Playwright suite locally.

### SC016B — Tenant-scoped dashboard data surface

- Replaced the authenticated dashboard placeholder with the supplied composition: date-aware greeting, upload CTA, five compact operational metrics, vehicle-image quick actions, and the three newest authorized vehicle batches with truthful processing cards.
- Added a canonical dashboard response contract and a dedicated PostgreSQL read repository. Counts, immutable usage totals, active jobs, success rate inputs, and original-plus-processed storage bytes are selected only inside the authenticated tenant boundary; recent cards reuse the bounded Inventory application service and short-lived private preview signatures.
- Kept the initial plan presentation truthful while checkout is unavailable: dashboard remaining usage is derived from current-period immutable usage events against the centrally named free allowance, and values never fall below zero. Storage includes only committed originals and persisted processed outputs.
- Added responsive five/three/two/one-column statistics, three/two/one-column action and recent grids, layout-preserving skeletons, retry-safe error UI, accessible section naming, and the original local marketing vehicle as the shared quick-action visual.
- Added contract, aggregate calculation, byte-safety, service, component, page-state, real-PostgreSQL ownership, and authenticated desktop/mobile Playwright coverage. The dashboard was visually compared with the supplied reference at both breakpoints.
- Verified source mapping, lint, strict typecheck, 181 web unit/component files with 298 tests, Prisma validation, all migrations, 16 real-PostgreSQL integration files with 31 tests, production build, and the complete five-test Playwright suite locally.

### SC016C — Immutable Usage & Billing surface

- Added `VEHICLE_PROCESSING_BATCH_CREATED` as a committed usage-event type and a backward-compatible PostgreSQL enum migration. Each accepted processing batch now creates exactly one upload-session event inside the same transaction as its jobs and outbox records; concurrent idempotent replays cannot consume a second session.
- Added canonical plan and Usage & Billing response contracts, a tenant-scoped repository for period image/session events, committed-original plus processed storage, and active subscription selection, and an application service that derives bounded remaining capacity from the shared plan catalog.
- Expanded the homepage plan catalog into the single source for plan keys, image/session/storage capacity, names, prices, benefits, and presentation. Dashboard and billing values no longer maintain separate free-plan constants.
- Added the screenshot-derived `/settings/billing` page with current-plan image usage, session/storage quota cards, the shared Free/Studio Pack/Studio Pro cards, responsive layouts, loading/error states, and enabled application navigation.
- Established the `BillingPort` checkout/subscription boundary without selecting a payment provider. Upgrade actions open an accessible, explicit unavailable-checkout dialog confirming that no payment was made and no user work or plan changed.
- Added contract, idempotency-key, processing-service, component, page-state, real-PostgreSQL transaction/tenant/plan, and authenticated Playwright coverage; visually compared the completed desktop surface with the supplied Usage & Billing reference.
- Verified source mapping, lint, strict typecheck, 192 web unit/component files with 310 tests, Prisma validation, nine migrations, 17 real-PostgreSQL integration files with 32 tests, production build, and the complete five-test Playwright suite locally.

### SC017A — Independent email delivery plane

- Added a strict, versioned processing-completion email message contract that carries a stable message UUID, recipient, authorized portfolio URL, and bounded vehicle name without accepting arbitrary email HTML from producers.
- Added an independently deployable Node.js 24 email-delivery worker behind a `MailerPort`, with a fixed escaped HTML/text template and a server-only fetch-based Resend adapter.
- Bound each provider request to the stable message UUID through Resend's `Idempotency-Key` header. The adapter applies bounded timeouts and distinguishes retryable network, timeout, 429, 5xx, and concurrent-idempotency failures from terminal 4xx or payload-conflict failures.
- Added SQS partial-batch handling: successful and terminal records are acknowledged, transient failures are retried, and malformed messages follow the queue's bounded receive policy into the DLQ without exposing recipient data, credentials, or content in logs.
- Added focused worker environment validation and deployable, independently scalable CloudFormation stacks for the encrypted email queue, retained DLQ, least-privilege policies, bounded Lambda concurrency, Secrets Manager key resolution, and queue/Lambda alarms.
- Generalized behavior-source mapping discovery so every worker workspace is covered automatically, and added contract, renderer, escaping, retry-classification, adapter, handler, and composition tests.
- Verified source mapping, lint, strict typecheck, the complete unit/component suite, the worker's six focused test files with 15 tests, Prisma validation, all nine migrations, 17 real-PostgreSQL integration files with 32 tests, production builds for all ten packages, and the five-test Playwright suite locally. Database-backed producer, delivery audit, and end-to-end dispatch remain intentionally closed until SC017B.

### SC017B1 — Atomic processing-completion email reservation

- Added a durable `EmailOutboxMessage` lifecycle with explicit pending, queued, processing, delivered, and failed states; separate publish and delivery claims; attempt counts; provider/queue identifiers; terminal timestamps; and indexes for bounded recovery scans.
- Snapshot the verified primary recipient and vehicle name for a versioned processing-completion notification, keyed uniquely by user, processing-batch idempotency key, and message type.
- Reserve the email outbox record in the same PostgreSQL transaction that persists the final processed asset, immutable usage event, successful attempt, completed job, and vehicle `READY` transition. Phone-only users and partially failed batches do not create an inapplicable success email.
- Serialized terminal vehicle evaluation with a transaction-scoped advisory lock so concurrent final-job transactions cannot both miss the `READY` transition or reserve duplicate notifications.
- Added a backward-compatible tenth migration and real-PostgreSQL assertions for successful outbox reservation and absence on terminal image failure. Queue publication and worker delivery claims remain closed until SC017B2.
- Verified source mapping, lint, strict typecheck, the complete unit/component suite, Prisma validation, all ten migrations, 17 real-PostgreSQL integration files with 32 tests, production builds for all ten packages, and the five-test Playwright suite locally.

### SC017B2 — Email dispatch and durable delivery

- Added the provider-neutral `@studiocar/email` package with bounded outbox dispatch, exponential backoff with jitter, canonical message construction, delivery leasing, terminal finalization, and `MailerPort` orchestration independent of Resend semantics.
- Added separate Prisma publisher and delivery adapters. Pending rows use expiring publish leases and durable retry scheduling; queued rows use expiring delivery leases, attempt accounting, provider identifiers, terminal failure codes, and duplicate suppression after delivery or failure.
- Added a dedicated SQS email publisher and secret-protected `POST /api/internal/email/dispatch` recovery endpoint. The email token, queue settings, public application origin, batch size, leases, and retry bounds are validated independently from processing configuration.
- Changed the email worker to treat queue content as an untrusted reference: after validating the stable contract, it claims the message UUID and reconstructs recipient, vehicle name, and portfolio URL from the PostgreSQL snapshot before contacting Resend.
- Updated the independently deployable email Lambda stack with database configuration and a delivery lease shorter than queue visibility, while retaining separate concurrency, queue, DLQ, credentials, and alarms from image processing.
- Added domain, adapter, route, environment, worker, and real-PostgreSQL coverage for publish recovery, competing claims, transient release, terminal failure, successful finalization, and delayed duplicate suppression.
- Verified source mapping, Prisma validation, all ten migrations, lint, strict typecheck, the complete unit/component suite, 19 real-PostgreSQL integration files with 35 tests, production builds for all eleven packages, and the five-test Playwright suite locally.

### SC018A1 — Browser and dependency security baseline

- Added a repository-owned response-header policy to every Next.js route: Content Security Policy, HSTS, clickjacking denial, MIME-sniffing prevention, strict referrer handling, a least-capability Permissions Policy, same-origin opener isolation, and legacy cross-domain policy denial.
- Kept the production CSP free of `unsafe-eval`, denied objects, framing, foreign form targets, and foreign base URIs, and allowed only the private S3 data-plane origin class required for direct browser uploads and signed image reads. Development-only eval and WebSocket allowances are excluded from production output.
- Preserved static marketing rendering by using Next.js's documented non-nonce CSP approach. The remaining `unsafe-inline` script/style allowance is explicit; adopting request nonces would deliberately trade away static generation and CDN caching for the affected routes.
- Added a blocking moderate-or-higher production dependency audit to CI. Pinned patched pnpm workspace overrides for vulnerable Prisma CLI transitive dependencies and verified the audit reports no known vulnerabilities while Prisma generation and schema validation continue to pass.
- Audited the current App Router surface: every cookie-authenticated mutation rejects absent/cross-origin `Origin` values, internal dispatch endpoints use constant-time dedicated bearer checks, and data repositories remain tenant-scoped. Google authorization start remains browser-bound through one-time state, nonce, PKCE, and its HttpOnly binding cookie.
- Added unit coverage for production/development CSP behavior and the full header set, plus browser-level assertions against the built application response.
- Verified a clean moderate-or-higher production dependency audit, source mapping, Prisma generation/validation, all ten migrations, lint, strict typecheck, the complete unit/component suite including 197 web files with 317 tests, 19 real-PostgreSQL integration files with 35 tests, production builds for all eleven packages, and the five-test Playwright suite locally.

### SC018A2a — Durable authenticated command limits

- Added an exact sliding-window command limiter backed by PostgreSQL rather than process memory, so limits remain consistent across Vercel instances and cold starts.
- Serialized consumption with tenant-and-scope advisory locks and persisted only successful allowance events. Concurrent requests cannot exceed the configured bound, while upload-presign and processing-batch budgets remain isolated.
- Applied configurable per-user limits to the cost-bearing upload-presign and processing-batch commands after authentication and validation but before S3 signing, database reservation, or queue dispatch.
- Added stable `429 RATE_LIMITED` responses with bounded `Retry-After` values. Storage transfer and asynchronous worker concurrency remain governed by their existing data-plane controls rather than this control-plane limit.
- Added the eleventh backward-compatible migration plus unit, route, configuration, and real-PostgreSQL concurrency/window-expiry coverage. Cleanup of expired limiter events is intentionally part of the lifecycle-retention slice.
- Verified a clean production dependency audit, source mapping, Prisma generation/validation, all eleven migrations, lint, strict typecheck, the complete web unit/component suite with 321 tests, 20 real-PostgreSQL integration files with 37 tests, production builds for all eleven packages, and the five-test Playwright suite.

### SC018A2b — Secret isolation and signed-webhook foundation

- Removed the unused aggregate server-environment parser that grouped unrelated Google, MSG91, Resend, S3/SQS, and image-provider secrets. Runtime composition continues to use focused Zod parsers that strip credentials outside each process's responsibility.
- Added a deployment ownership matrix for the Next.js control plane, processing and email dispatchers, independent workers, and trusted schedulers. The matrix requires workload identities, separate dispatch tokens, selected-provider-only credentials, and prohibits copying the local environment union into production runtimes.
- Added a provider-neutral `WebhookSignatureVerifier` boundary and a raw-body HMAC-SHA256 adapter with validated header configuration, bounded timestamp tolerance, constant-time digest comparison, malformed-header bounds, and two-secret rotation support.
- Documented the mandatory future webhook admission order: bounded raw bytes, provider-selected verifier, freshness/signature verification, Zod parsing, and unique provider/external-ID persistence. No public webhook route was exposed because no selected provider signature contract currently justifies one.
- Added focused parser, digest, option-validation, adapter, configuration-isolation, and rotation/tamper/freshness tests. Verified a clean dependency audit, source mapping, all eleven migrations, lint, strict typecheck, the complete web suite with 203 files and 327 tests, 20 real-PostgreSQL integration files with 37 tests, production builds for all eleven packages, and the five-test Playwright suite.

### SC018B1a — Bounded database lifecycle retention

- Added a dedicated, secret-protected lifecycle cleanup command with independent retention windows for expired sessions, OAuth challenges, phone OTP challenges/attempts, and command-rate-limit events.
- Implemented every deletion as an ordered PostgreSQL candidate batch with `FOR UPDATE SKIP LOCKED` and a configured maximum. Concurrent scheduler invocations remain safe, and repeated calls drain backlog without an unbounded transaction.
- Preserved active/recent security state and excluded users, vehicles, image assets, processing jobs, outputs, usage events, subscriptions, webhook events, email records, and audit logs from deletion.
- Added a backward-compatible OAuth expiry index migration and a focused environment parser with a separately generated lifecycle token, batch bound, and retention settings.
- Documented the trusted scheduler contract and kept the root environment file local-only. The cleanup response contains aggregate counts only and is private/no-store.
- Added service, handler, route, configuration, and real-PostgreSQL cutoff/batch coverage. Verified a clean production dependency audit, source mapping, Prisma generation/validation, all twelve migrations, lint, strict typecheck, the complete web suite with 206 files and 331 tests, 21 integration files with 39 tests, production builds for all eleven packages, and the five-test Playwright suite.

### SC018B1b — Durable abandoned-upload cleanup

- Added a durable storage-deletion outbox and atomic `PENDING_UPLOAD` to `DELETED` reservation, so PostgreSQL never loses retry authority before a private S3 object is removed.
- Restricted eligibility to upload intents older than a configurable post-expiry grace period. Committed `UPLOADED` originals, invalid assets, processed outputs, and customer history are never selected.
- Added ordered skip-locked batches, expiring deletion leases, idempotent S3 deletes, bounded exponential retry with jitter, terminal failure state, and aggregate conflict/failure reporting for operational alerts.
- Added a separately authenticated private storage-cleanup command, focused configuration, least-privilege `s3:DeleteObject` permission under the existing tenant object prefix, and a trusted scheduler contract.
- Added service, retry, handler, route, S3 adapter, configuration, and real-PostgreSQL reservation/claim/idempotency coverage. Verified a clean production dependency audit, source mapping, Prisma generation/validation, all thirteen migrations, lint, strict typecheck, the complete web suite with 211 files and 339 tests, 22 integration files with 41 tests, production builds for all eleven packages, and the five-test Playwright suite.

### SC018B2 — Query and load hardening

- Replaced the inventory card query's unbounded processing-job relation load with one page-bounded PostgreSQL latest-batch aggregate. Reprocessing history no longer inflates current image counts or response size, and only one preview key per visible vehicle crosses the repository boundary.
- Added deterministic cursor-sort indexes for tenant vehicle creation/name ordering plus focused processing-job indexes for dashboard completion windows, latest vehicle batches, portfolio completion lookup, and batch display ordering.
- Exported the canonical 100-job polling bound and made the client split larger transient activity sets into sequential bounded requests, preserving order while avoiding a single invalid or unbounded query.
- Added multi-batch/cross-tenant real-PostgreSQL coverage, migration index verification, large polling-set coverage, and updated inventory service/repository tests. Verified a clean production dependency audit, source mapping, Prisma generation/validation, all fourteen migrations, lint, strict typecheck, the complete web suite with 212 files and 340 tests, 24 integration files with 43 tests, production builds for all eleven packages, and the five-test Playwright suite.

### SC018C1 — Image-worker operational telemetry

- Activated `packages/observability` with a provider-neutral structured-event port and a fail-safe CloudWatch Embedded Metric Format sink. Metric dimensions are restricted to bounded service/outcome/provider values; tenant, asset, vehicle, job, queue-message, and provider-request IDs remain searchable correlation fields rather than high-cardinality dimensions.
- Enriched internal processing outcomes with the authoritative claimed-job context and normalized failure kind, then instrumented every valid, ignored, retried, terminal, completed, malformed, and unexpectedly failed queue record without logging image bytes, object keys, provider errors, credentials, or queue bodies.
- Added truthful message count, worker duration, end-to-end latency, provider latency, images processed, terminal failure, retry, ignored-delivery, and provider-429 metrics. Reused provider outputs omit provider latency rather than fabricating a new call, and telemetry sink failures cannot change SQS acknowledgement decisions.
- Added retained configurable Lambda log storage plus alarms for p95 Lambda duration, terminal failure spikes, retry spikes, provider rate-limit spikes, and p95 end-to-end latency. Existing queue depth, oldest-message age, DLQ, and Lambda error alarms remain in place.
- Added focused serializer, failure-isolation, correlation, metric-classification, handler-emission, and enriched worker-result tests. Verified a clean production dependency audit, source mapping, Prisma validation, all fourteen migrations, lint, strict typecheck, the complete web suite with 212 files and 340 tests, 24 integration files with 43 tests, observability and image-worker suites with 34 tests, production builds for all eleven packages, and the five-test Playwright suite.

### SC019 — Database ownership moved into the web application

- Moved the Prisma schema, all fourteen committed migrations, and `prisma.config.ts` into `apps/web`; every migration and its `migration_lock.toml` moved byte-identically, so existing databases keep matching by checksum and nothing was squashed, reapplied, or reset.
- Moved twenty-one tenant repositories into `apps/web/src/server/db/repositories`, where the application services now import them directly instead of through a workspace barrel.
- Replaced `@studiocar/database` with the deliberately minimal `@studiocar/database-runtime`, which owns only the generated Prisma client, the pooled client factory, and the two repositories the deployable image and email workers genuinely share. The workers keep a real package boundary rather than reaching into another application's source.
- Pointed the generator output at `packages/database-runtime/generated/prisma`, moved the `db:*` scripts to `apps/web`, and made the root `lint`, `typecheck`, `test`, `test:integration`, and `build` scripts generate the client first. Database commands are invoked directly rather than through Turborepo so stateful migration work can never be served from a task cache.
- Mirrored every moved source in the behaviour-test map: repository tests now live under `tests/unit/server/db` and `tests/integration/server/db`, with the shared client and worker repositories under `tests/unit/database-runtime` and `tests/integration/database-runtime`.
- Verified Prisma generation and schema validation from the new location, all fourteen migrations applying cleanly to an empty PostgreSQL instance, lint, strict typecheck, source mapping, 217 web test files with 345 tests, 24 integration files with 43 tests against real PostgreSQL, and production builds for all eleven packages.

### SC020 — Configurable S3 and SQS connections

- Fixed the root cause of failing production-credential uploads. Every AWS client was constructed as `new S3Client({ region })`, and the upload parser accepted only `AWS_REGION` and `S3_BUCKET`, so credentials could reach the SDK only through the default provider chain. Where no workload identity or shared credentials file exists, presigning failed with `CredentialsProviderError` and the service converted it into an opaque `503`.
- Added a shared `S3ConnectionSchema`/`SqsConnectionSchema` plus `createS3ClientOptions`/`createSqsClientOptions`, and routed all seven S3 and SQS construction sites through them: upload, dashboard, inventory, portfolio, storage cleanup, the processing dispatcher, the email dispatcher, and the image worker.
- Optional `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `SQS_ENDPOINT`, `SQS_ACCESS_KEY_ID`, and `SQS_SECRET_ACCESS_KEY` now exist. Omitting the key pairs preserves the AWS default provider chain, which is how production resolves a workload identity; supplying half a pair is rejected at parse time rather than failing opaquely at the first signed request.
- Left presign generation itself untouched. Inspecting a generated URL confirmed it was already correct, signing `content-length`, `host`, `x-amz-checksum-sha256`, and the three ownership metadata headers with an unsigned payload, and no spurious checksum algorithm header.
- Allowed an optional second browser origin in the storage CloudFormation template so a non-production stack can accept a local development host for CORS; production still supplies one exact HTTPS origin.
- Verified the complete data plane against a real S3-compatible endpoint: presign, a browser-equivalent `PUT` with the checksum and ownership headers, a `HEAD` matching content length, content type, SHA-256, and all three metadata values, and the bounded range read used by upload commit.
- Verified lint, strict typecheck, source mapping, 35 configuration tests, the complete 217-file web suite with 345 tests, every package suite, and production builds for all eleven packages.

### SC021 — MSG91 Widget-based phone OTP

- Fixed the `templateId missing` failure. `MSG91_TEMPLATE_ID` was a required field of the phone environment parser, so the runtime threw before any request whenever it was absent, and the adapter targeted the DLT-template server API `/api/v5/otp` that the deployment has no registration for.
- Replaced that flow with the MSG91 Widget flow. The browser loads `verify.msg91.com/otp-provider.js`, runs `sendOtp`/`retryOtp`/`verifyOtp`, and exchanges the typed code for a signed access token. The six digits never reach the application.
- The server presents that token to `control.msg91.com/api/v5/widget/verifyAccessToken` with the server-only `MSG91_AUTH_KEY` and asks whose handset it proves. The claimed number is treated as an assertion to check, not as input: a token naming a different handset is refused with exactly the same answer as a refused token, so the response reveals nothing about whose number a token belongs to.
- Added `PHONE_OTP_DRIVER`, `MSG91_WIDGET_ID`, `MSG91_WIDGET_TOKEN`, and `PHONE_OTP_DEV_CODE`, and removed `MSG91_TEMPLATE_ID`. Selecting `msg91` requires all three credentials; the `fake` driver sends no message, accepts one configured code, and is refused when `NODE_ENV` is production.
- Added `GET /api/auth/phone/widget`, a same-origin, `no-store` endpoint that serves only the browser-safe widget id and public token. `MSG91_AUTH_KEY` is never in that response. Serving it rather than inlining `NEXT_PUBLIC_*` makes rotating a widget a restart instead of a rebuild.
- Added a `providerTokenHash` column with a unique index. A verified access token is claimed exactly once, so replaying one against a second challenge collides and is refused; re-running the same challenge with the same token stays idempotent so a completion failure can still be retried.
- Kept the existing durable challenge, browser-binding cookie, per-phone/per-IP send limits, per-challenge attempt cap, and per-IP verification limits. Because the widget sends from the browser, the application reserves the rate-limited challenge first: that is what bounds how many messages a caller can cause.
- Extended the content security policy with the two MSG91 browser origins and nothing else.
- Added widget loader, bounded-call, send, resend, verify, token-reader, identifier-normalisation, adapter, development-driver, widget-configuration, endpoint, and sign-in-form coverage, including that a DLT template is never requested and that the server auth key never reaches a browser payload.
- Verified lint, strict typecheck, source mapping, 233 web test files with 436 tests, 38 configuration tests, 24 integration files with 43 tests against real PostgreSQL, all fifteen migrations, and production builds for all eleven packages.

### SC022 — Local development environment

- Added `infrastructure/local/docker-compose.yml` with PostgreSQL, MinIO, ElasticMQ, Mailpit, both workers, and a dispatch ticker. `pnpm infra:up` starts everything except the Next.js application so `pnpm dev` can run it natively; `pnpm app:up` additionally runs the application in a container. `pnpm infra:down` and `pnpm app:down` stop them.
- Every dependency declares a health check and every dependant waits on `service_healthy` or `service_completed_successfully`, so startup ordering is observed rather than slept through. ElasticMQ's image carries no HTTP client that treats an SQS error response as success, so its readiness is the queue port accepting connections.
- Added `@studiocar/local-queue`, a long-polling consumer that drives each worker's deployed Lambda handler with the event shape the runtime delivers, then acknowledges exactly the messages the handler did not report as failures. Local development therefore exercises the real worker, its retry decisions, and its partial-batch acknowledgement rather than a parallel implementation.
- Added a Mailpit mailer behind the existing `MailerPort` and an `EMAIL_DRIVER` switch. The local inbox never forwards mail off the machine, which is why environment validation refuses that driver in production; `RESEND_API_KEY` is now required only when the production driver is selected.
- Added focused `ImageWorkerQueueEnvironmentSchema` and `EmailWorkerQueueEnvironmentSchema` parsers so a locally running worker reads only an SQS connection and its own queue URL. A worker never holds a dispatch token: publishing is the application's job and consuming is the worker's.
- Added `pnpm db:reset`, which drops the local database, reapplies every migration, and regenerates the client without creating sample data. It refuses to run when `NODE_ENV` is production or when `DATABASE_URL` does not name a known local host, and the second guard needs an explicit flag to override.
- The worker image installs only the two worker dependency trees and receives the Prisma client generated on the host, because installing the application's build toolchain downloaded far more than these processes run. Image rebuilds are opt-in through `pnpm infra:build` so the common path stays fast.
- Gave the widget endpoint a focused `PhoneOtpWidgetEnvironmentSchema` that reads only the driver, development code, and browser-safe widget identifiers. Describing browser configuration must not depend on, or fail because of, the session secret and database URL it has no business reading; requiring them made the endpoint return `500` wherever they were absent, which silently removed the phone sign-in form.
- Verified the stack end to end: all four dependencies healthy, the bucket and four queues created, both workers polling, all fifteen migrations applied against the compose database, `pnpm db:reset` completing, and every safeguard refusing production-shaped input. Verified lint, strict typecheck, source mapping, every package suite, and production builds for all twelve packages.

### SC023 — Workspace navigation, sidebar plan summary, and usage consolidation

- Reduced workspace navigation to the four destinations that exist: Dashboard, Inventory, Packs & Billing, and Profile. Portfolio, Usage, and Help are gone rather than disabled, and their route constants were deleted so nothing can link to them by accident.
- A vehicle portfolio is reached from its inventory card, which is where the vehicle is known; `/inventory/[vehicleId]` already served it. Inventory now stays the current destination while a portfolio is open, so the sidebar never claims nothing is active.
- Replaced the static sidebar placeholder with the real plan and usage summary from the screenshot: plan name, an accessible progress bar labelled `used / allowance images used`, and storage against the plan allowance. It never reports more used than the allowance permits.
- The summary degrades to a truthful notice rather than an error when usage is unavailable. The workspace must not become unreachable because one aggregate failed.
- Memoised the usage summary for the request, so the sidebar and the billing page, which report the same numbers, run the aggregates once instead of twice on every visit to Packs & Billing.
- Removed the origin check from the widget configuration read. Browsers omit `Origin` on same-origin GET requests, so requiring it rejected the sign-in page's own read and silently removed the phone form. Origin checks defend state-changing requests against CSRF; this changes nothing. The controls that matter are unchanged: `MSG91_AUTH_KEY` is never in the response, MSG91 honours the widget only on allow-listed domains, and the response stays `no-store`.
- Added navigation, active-destination, sidebar-summary, and request-memoisation coverage, plus an authenticated Playwright walk asserting the four destinations, the absence of the retired three, the plan summary, and that Profile becomes current.
- Verified lint, strict typecheck, source mapping, 238 web test files with 459 tests, production builds for all twelve packages, and all six Playwright tests.

### SC024 — Dashboard Quick Action imagery

- Gave each quick action its own image. All three cards previously rendered the single marketing vehicle render, so the imagery said nothing about what the action did.
- Composed three assets from the existing licensed `silver-sedan.png`, whose background is already transparent: one vehicle on a neutral ground for **Upload a vehicle**, three vehicles for **View inventory**, and one vehicle on a bright studio sweep with a floor reflection for **Recent results**. The third deliberately looks like a processed result, which is what the card opens.
- Renamed the third action from **View portfolio** to **Recent results**. Portfolio is no longer a destination; the card opens completed vehicles in inventory, so it is now named for what it reveals.
- The images carry meaningful alternative text instead of `alt="" aria-hidden`, because they now distinguish the actions rather than decorate them.
- Authored at the card's own 1200×324 aspect and switched the media to `object-fit: cover`. The previous `contain` plus fixed scale only looked right because the old asset was transparent and its letterboxing blended into the card; an opaque ground would have shown bands. Card dimensions, structure, typography, spacing, buttons, and tags are unchanged.
- Total asset weight is 73 KB across three WebP files, against 1.7 MB for the single PNG they replace. `fill` inside a fixed-height media band means no layout shift, and the existing `sizes` hint is unchanged.
- Added card, action-grid, and Playwright coverage asserting three distinct sources, described imagery, and the new wording.
- Verified lint, strict typecheck, source mapping, 238 web test files with 464 tests, production builds, and all six Playwright tests, then compared the rendered dashboard against `docs/screens/Dashboard_Page`.

### SC025 — Free plan limits, enforced on the server

- The Free plan is now **15 images in total with a maximum of 5 per batch**. It was 9 images across 3 upload sessions with 3 per batch, and none of it was enforced: `FREE_PLAN_PHOTO_LIMIT` was a client constant, and the reservation checked ownership, vehicle state, and asset readiness but never quota.
- Both limits are enforced **inside the reservation transaction**, after the vehicle is locked and before any job or outbox message is created. A check made before the transaction could be overtaken by a concurrent batch; this one cannot.
- The allowance counts charged images **plus reserved-but-unfinished work**. Images are charged on successful completion, so committed usage alone would let a tenant reserve without limit while work was still in flight. Cancelled and failed jobs are excluded, because a failure must not consume someone's allowance.
- Introduced `PlanAllowanceScope`. A `LIFETIME` allowance is counted across every billing period, which is what makes a free trial something that runs out; a `BILLING_PERIOD` allowance stays scoped to the current month and refills. Free and Studio Pack are lifetime; Studio Pro is monthly.
- Free no longer advertises an upload-session cap. The accepted specification names exactly two limits, and enforcing a third the product never asked for would refuse work the plan permits.
- Refusals are distinct and actionable: `BATCH_LIMIT_EXCEEDED` and `ALLOWANCE_EXHAUSTED` are new canonical API error codes returning `422` with a message naming the limit, so a client can offer an upgrade rather than a pointless retry. Neither queues any work.
- The dashboard now reports allowance against the tenant's resolved plan instead of assuming Free, so its numbers agree with the sidebar and with billing.
- The upload wizard reads the plan's batch limit through a shell-provided context rather than a hardcoded 3. Outside that context it falls back to the smallest allowance, so a failure to resolve never lets someone start work the server will refuse. This remains guidance; the transaction decides.
- Added allowance-resolution, service-refusal, plan-limit-context, and contract coverage, plus real-PostgreSQL integration tests proving a six-image batch is refused with the vehicle left as a draft and no jobs created, a five-image batch is accepted, in-flight work counts against the allowance, and a failed job does not.
- Verified lint, strict typecheck, source mapping, 19 package suites, 24 integration files with 43 tests against real PostgreSQL, production builds, and six Playwright tests.

### SC026 — Account linking and Profile sign-in methods

- Identity resolution already refused to merge accounts, but there was no way to complete a link, so a phone-first user who chose Google reached an error page with no way forward. A signed-in user can now securely connect the method they do not yet have.
- **Google.** `GET /api/auth/google/start?intent=link` requires a session and records the intent inside the **encrypted, one-time challenge payload**, never the URL, so it cannot be forged or pointed at another account. The callback refuses unless the session completing it is still the account that asked, and a link issues **no new session**: the person is already signed in, and minting one would silently rotate their session as a side effect.
- **Phone.** `POST /api/profile/identities/phone` runs the same challenge, per-phone and per-IP limits, browser binding, provider verdict, identifier assertion, and single-use access-token claim as signing in. `verify` and `link` now share one `proveNumber` path so the two cannot diverge.
- Linking never merges and never transfers. An identity another account holds is refused, as is a contact detail another account holds, and a unique-constraint violation from a concurrent link resolves to the same refusal. Business data stays on the same internal user throughout, which an integration test asserts directly.
- Profile gained Connect actions for whichever method is missing, an inline phone-verification form, and a success notice after a Google link. The card states plainly that connecting a second method never merges accounts.
- Added link-href, link-handler, route, service-linking, and connect-form coverage, plus eight real-PostgreSQL integration tests covering adoption of a verified email, idempotent relinking, a refused identity that stays with its owner, a refused contact detail, phone linking, concurrent linking creating exactly one identity, and preserved ownership.
- Verified lint, strict typecheck, source mapping, 244 web test files with 501 tests, 25 integration files with 55 tests against real PostgreSQL, production builds, and six Playwright tests.

### SC027 — Administration and dynamic configuration data model

- Added `UserRole`, `AppConfig`, `AdminInvite`, `PlanConfig`, and `SocialLink`, and extended `PlanSubscription` with `source`, `assignedByUserId`, and `note`. Every statement is additive and existing rows keep their meaning: `source` defaults to `PAYMENT_PROVIDER`.
- Authorization is a row, never an environment value, so revoking a role takes effect everywhere immediately. `AppConfig` holds the one-time record that first-administrator bootstrap has happened, which is what will stop a revoked administrator regaining access from a still-set environment variable.
- An invitation names an email, never a user, and creates no placeholder account. It can only be matched later by a verified Google identity carrying that address.
- Added database `CHECK` constraints and partial unique indexes so invalid configuration is impossible however a row is written: no negative price, no zero or above-allowance batch limit, no negative allowance or display order, no non-`https` social URL, at most one pending invitation per email, and at most one active manual subscription per tenant. Each was verified against real PostgreSQL by attempting the violation.
- Seeded the canonical plan catalog including **Studio Plus at ₹7,999 per month, 1,500 images, 20 per batch, on a billing-period allowance**. Prices are stored in minor units so money is never a float. No plan is purchasable while `BillingPort` is unimplemented, because advertising a checkout that cannot complete would be a lie.
- Added `pnpm db:seed`. It installs configuration rather than sample data, creates no users, vehicles, or images, and never overwrites a plan an administrator has edited, so it is safe to re-run. Social links are deliberately not seeded: a row exists only once a real address is supplied, so the footer renders nothing instead of a placeholder that goes nowhere.
- Excluded unrelated pre-existing drift from the migration. The generated diff wanted to drop `id` defaults on three existing tables; that is a difference between the live database and the schema, not part of this change.
- Verified lint, strict typecheck, source mapping, all package suites, 26 integration files with 61 tests against real PostgreSQL, production builds, and `pnpm db:reset` followed by `pnpm db:seed` producing a clean, configured database.

### SC028 — Administrator authorization and first-administrator bootstrap

- Authorization is now read from the database on every request. `UserRole` is the only source; nothing consults the environment, so revoking a role takes effect everywhere on the next request.
- Added `BOOTSTRAP_ADMIN_EMAIL`, which names the one verified Google email that may become the first administrator on a database that has never had one. It is matched only against an email Google itself verified during a real sign-in, never against an address in a request, one somebody typed, or a profile field on a phone-only account.
- Comparison trims and lowercases and does nothing else. Gmail dot and plus aliasing is deliberately not folded, because that would let one configured value match addresses its owner never chose.
- Completion is persisted in `AppConfig` under `admin.bootstrap`, and **that record, not the absence of an administrator, is what closes the window**. An integration test proves the case this exists for: after the bootstrap administrator is revoked by another administrator, signing in again with the environment variable still naming them grants nothing.
- The one-time grant is serialised by an advisory lock, so two simultaneous sign-ins create exactly one administrator. The grant, the completion record, and an `INITIAL_ADMIN_BOOTSTRAPPED` audit entry are written in one transaction, with the actor recorded as the system because no administrator existed to perform it.
- Bootstrap can never be the reason a sign-in fails. It is evaluated after identity resolution on both the sign-in and link paths, and a failure is swallowed: the role is a convenience the deployment configured, while authentication is what the person actually asked for.
- Added `requireAdministrator` for pages and `assertAdministrator` for handlers and actions. A signed-in non-administrator receives `404` rather than a refusal, so the existence of the administration area is not disclosed. Every page authorizes for itself and not only through its layout.
- Added a gated `/admin` overview reporting bounded counts only, and a conditional Admin navigation entry. Hiding that entry is presentation, never a control.
- Added bootstrap-decision, guard, overview, navigation, page, and layout coverage; eight real-PostgreSQL bootstrap tests; role and overview repository tests; and a Playwright walk proving a signed-in non-administrator gets a genuine `404` at `/admin` while an administrator gets `200`.
- Verified lint, strict typecheck, source mapping, every package suite, 28 integration files with 77 tests against real PostgreSQL, production builds, and seven Playwright tests.

### SC029 — Administrator management

- An administrator can now grant access by email. When a **verified Google identity** already holds that address the role is granted at once; otherwise a pending invitation is recorded. No placeholder account is ever created.
- A phone-only account whose profile carries the address is never granted. The address is on the profile, but Google never verified it, and an integration test asserts exactly that case.
- An invitation becomes a role only when somebody signs in with a Google account Google has verified for that address. Acceptance rides the same verified-email moment as bootstrap and is checked first, so an invited administrator is granted even on a database where bootstrap already completed. Expired invitations are closed rather than honoured, and revoked ones never activate.
- **StudioCar AI can never reach zero administrators.** Revocation counts and deletes under one advisory lock, so two administrators revoking each other simultaneously cannot both succeed; an integration test runs exactly that race and asserts one survives. The interface disables the control and explains why rather than letting somebody discover the refusal by trying.
- At most one pending invitation per address, enforced by the partial unique index added with the data model rather than by a read-then-write.
- Every grant, invitation, cancellation, and revocation writes an `AuditLog` entry naming the acting administrator. `AuditLog` is no longer unused.
- Server actions authorize for themselves against the database. The navigation entry is hidden from other people, but that is presentation: a server action is an endpoint, and tests assert that a signed-in non-administrator and an unauthenticated caller both reach no repository at all.
- Added `/admin/admins` with a grant form, the administrator list showing where each person's access came from, and pending invitations. Provenance is rendered as one sentence rather than fragments a reader has to reassemble.
- Added action-authorization, message-mapping, expiry, provenance, and component coverage, thirteen real-PostgreSQL management tests, and a Playwright walk asserting the last administrator's revoke control is disabled and that `/admin/admins` is a genuine `404` for everybody else.
- Verified lint, strict typecheck, source mapping, every package suite, 29 integration files with 90 tests against real PostgreSQL, production builds, and seven Playwright tests.

### SC030 — Database-backed plan configuration

- **Plan configuration is now read, not just stored.** Prices, allowances, batch limits, storage and copy come from `PlanConfig`. `apps/web/src/features/pricing/pricing-plans.ts` and `find-pricing-plan.ts` are deleted; nothing in the product carries a second copy of a plan any more.
- `getPlanCatalog` is memoised per request with React `cache`, deliberately not across requests: an allowance decides whether somebody's work is charged or refused, so it is read fresh from one indexed query rather than served from a stale copy.
- Resolution never fails. A plan the live catalog does not describe falls back to the shipped default, and a key nothing describes falls back to the free plan — the smallest allowance, which can delay work but never over-grant it. Unit tests assert each step.
- The shipped catalog stands in when the table holds no active plan, so an unseeded database shows correct prices rather than a blank pricing page.
- Added `/admin/pricing`, where an administrator edits every plan. Prices are entered in rupees and storage in gibibytes and converted to the units the database stores, so no rounded float can reach a charge.
- `planKey`, `allowanceScope` and `currency` are not editable. The key identifies existing subscriptions and the scope decides how usage **already charged** is counted, so editing either would silently reinterpret it. An integration test asserts an edit cannot change the scope of a row that already exists.
- Only a plan the deployment ships can be saved, keeping `planKey` a closed set. The write upserts under an advisory lock and records a `PLAN_CONFIG_UPDATED` audit entry naming the acting administrator, in the same transaction.
- Validation is layered: a Zod contract in `packages/contracts/src/plans.ts` refuses a batch larger than the whole allowance, and the database's own CHECK constraint refuses the same thing. An integration test asserts the transaction rolls back leaving neither the plan nor the audit trail changed.
- `STUDIO_PLUS` joins `PlanKeySchema`, so a Studio Plus subscription now resolves to its real allowance of 1,500 images and 20 per batch.
- Added administration sub-navigation (Overview, Plans and pricing, Administrators) so the new page is reachable.
- The marketing homepage is now server-rendered per request. It previously shipped a static copy of the prices, which an administrator's edit would have left stale.
- Added catalog-resolution, formatting, form-parsing, action-authorization, contract, component and page coverage; five real-PostgreSQL repository tests including a concurrent-edit race; and a Playwright walk that edits Studio Pro as an administrator and asserts the new price appears on Packs & Billing and on the public homepage.
- Verified lint, strict typecheck, source mapping, every package suite (644 tests), 28 integration files with 91 tests against real PostgreSQL, `prisma validate`, production builds, and eight Playwright tests.

### SC031 — Manual subscriptions

- An administrator can now hand a paid plan to one account at `/admin/subscriptions`, until a billing provider exists. `PlanSubscription` rows are finally written; the read path that resolves somebody's plan was already there.
- **A subscription a payment provider owns is never overwritten.** The provider is the authority on what somebody has paid for, and two rows disagreeing with no way to tell which is right is worse than refusing. An integration test asserts the assignment is refused and the provider's plan survives untouched.
- At most one assignment is ever in force. Reassigning cancels the previous one in the same transaction, which the partial unique index also enforces, so two administrators acting at once cannot create a second. A concurrency test runs exactly that race.
- The cancellation sweep closes every manual row the unique index counts, not only those still inside their period. An expired row left `ACTIVE` still occupies the index, and an integration test covers that case directly.
- Ending an assignment changes only the status. The row is kept and its period left as granted, so what somebody was given and when it was withdrawn both stay answerable. The database's `PlanSubscription_period_check` caught an earlier version that rewrote the end date, which would have erased exactly that.
- **An account is found only by a sign-in method it has verified.** A Google identity with a verified email, or a phone identity — never a `primaryEmail` somebody merely typed into their profile. Two integration tests assert an unverified identity and a profile-only address both find nothing.
- Exact match only. There is no partial search and no customer listing: an administrator assigning a subscription already knows who to, and a browsable directory would disclose more than the task needs. A malformed lookup queries nothing at all.
- Ownership stays keyed by account. `ManualSubscriptionAssignmentSchema` takes a `userId` and rejects a contact detail in its place, so a subscription can never be attached to an address rather than to a person.
- Assignments are bounded to 1–24 months, so no grant is open-ended. Period arithmetic is whole calendar months and never rolls into the next one: 31 January plus a month is 28 February, or 29 in a leap year.
- Only a plan the catalog **currently offers** can be assigned, so nobody is put on a plan the product has deactivated or no longer describes. `FREE` is excluded on purpose: it is the absence of a subscription.
- Every assignment and every withdrawal writes an `AuditLog` entry naming the acting administrator, with the reason they gave, in the same transaction as the change.
- Fixed an email-normalisation ordering bug found while building this: `z.email().trim()` validates the format **before** trimming, so an address with a stray space was rejected rather than cleaned. The same pattern in the administrator grant action is corrected and covered.
- Added contract, lookup-parsing, period-arithmetic, action-authorization, component and page coverage; eighteen real-PostgreSQL repository tests; and a Playwright walk that assigns Studio Plus to an account and asserts that account's own billing page shows the 1,500-image allowance.
- Verified lint, strict typecheck, source mapping, every package suite (690 tests), 29 integration files with 110 tests against real PostgreSQL, production builds, and nine Playwright tests.

### SC032 — Dynamic footer social links

- The public footer now shows the links an administrator configures at `/admin/content`. `SocialLink` had a model and a platform catalog but nothing rendered or administered them.
- **There is no fallback and no shipped default.** A footer link is an address somebody will follow, so it exists only once a real one is supplied. With nothing configured the footer renders no social section at all, rather than a heading with nothing under it or a placeholder that goes nowhere.
- `https` only, which the database's `SocialLink_url_is_https` CHECK constraint mirrors. An administrator cannot downgrade the public to plaintext by pasting, and an integration test asserts the database refuses it even if the contract were bypassed.
- **An address that carries credentials is refused.** `https://studiocar.example@evil.example/` reads as a StudioCar address in a status bar but is not one, and nothing legitimate needs a password in a link the whole world sees. An `@` in the *path* is still accepted, because that is how most handles are written.
- A platform's position in the footer comes from the shipped catalog, not from the submission: the footer's order is a design decision, not something to retype on every edit. A test asserts a submitted `displayOrder` is ignored.
- Only a platform the footer knows how to render can be saved. A platform nobody has configured still gets a form, and starts hidden rather than live, so saving a blank form can never publish a link nobody reviewed.
- Hiding a link keeps the row; removing it deletes it. Both write an `AuditLog` entry naming the administrator. The address is public, so recording it discloses nothing.
- Every save upserts under a per-platform advisory lock, so two administrators editing the same platform cannot create a second row; a concurrency test asserts one survives.
- Moved the platform catalog from `server/plans/` to `server/content/`, where it belongs, and retyped it against the canonical `SocialPlatform` contract rather than a duplicated union.
- The footer widens to a fourth column only when links exist, so with none configured its composition is byte-identical to the screenshots.
- Added contract, mapper, reader, action, component and page coverage; eight real-PostgreSQL repository tests; and a Playwright walk that starts with an empty footer, configures a link, sees a plaintext address refused, and finds the link on the public homepage while signed out.
- Verified lint, strict typecheck, source mapping, every package suite (725 tests), 30 integration files with 118 tests against real PostgreSQL, production builds, and ten Playwright tests.

### SC033 — Administration overview

- **The audit trail is finally read.** Nine administrative actions have been written since SC028 and nothing displayed them; an administrator could not answer "who changed this price?" without database access. The overview now lists the recent administrative changes.
- The trail is restricted to the administrative actions and bounded to 25 entries, so the overview can never become an unpaged dump of a table that also carries ordinary account activity.
- Each entry is rendered to a sentence **on the server**. Stored metadata never reaches the browser, so a key added to it later cannot leak into a page by accident; a test asserts an account identifier in the metadata does not appear in what the page receives.
- `AuditLog.metadata` is `Json`, so it arrives as `unknown` and is validated before any field is read. An entry whose metadata has the wrong type, is absent, or is not an object at all still renders — with the detail omitted rather than guessed at. An action this version does not recognise is reported plainly rather than hidden.
- **A deleted administrator is no longer reported as StudioCar AI.** `AuditLog.userId` is set to null when an account is removed, which made a removed actor indistinguishable from the one action the system genuinely performs by itself. The e2e screenshot surfaced this; the two are now named separately, because conflating them would mislead exactly where an audit trail matters most.
- Added an accounts-by-plan breakdown, grouped in the database and counts only. Accounts with no live subscription are absent rather than counted as a "free" group: no row means no subscription, not a subscription to nothing. A plan the catalog no longer describes falls back to its stored key rather than rendering blank.
- Account lookup for subscription management shipped with SC031, where it was a hard prerequisite.
- Hardened the social-link integration fixtures to be unique per run. The whole integration suite shares one database across parallel package tasks, and a fixture another process can delete makes a file fail on timing rather than on behaviour. The failure was intermittent and the exact concurrent writer was not pinned; the fixture isolation removes the class of race, and the suite then ran clean four times in a row.
- Added contract, describer, actor-attribution, reader, component and page coverage; five real-PostgreSQL audit tests; and a Playwright assertion that a change an administrator has just made appears on the overview.
- Verified lint, strict typecheck, source mapping, every package suite (749 tests), 31 integration files with 123 tests against real PostgreSQL, `prisma validate`, production builds, and ten Playwright tests.

### SC034 — Documentation consolidation and full-stack validation

- Brought the documentation back in line with the repository after the administration work. `context.md` listed a persistence model that predated `UserRole`, `AppConfig`, `AdminInvite`, `PlanConfig` and `SocialLink`, and omitted the email-delivery worker.
- Added the administration invariants to `context.md`: authorization is a row and is re-checked per request; plans and footer links are configuration rows, not constants; `planKey`, `allowanceScope` and `currency` are not editable; a provider-owned subscription is never written from the administration area; `AuditLog.metadata` must be validated before it is read, and a null actor is ambiguous between the system and a deleted account.
- Extended `docs/security.md` to cover SC030–SC033, which it did not reach: what an administrator may and may not change and why, the provider-owned subscription rule, verified-identity-only lookup with no customer listing, https-only footer links with no embedded credentials, and how the audit trail is read without shipping stored metadata to a browser.
- Added an Administration section to `README.md` naming every destination, what it changes, and the exact role `BOOTSTRAP_ADMIN_EMAIL` plays — and does not play.
- Ran a full-stack validation pass against real infrastructure: 16 committed migrations apply cleanly and the schema is up to date; `pnpm db:seed` is idempotent across repeated runs and left every edited row untouched; the seeded catalog matches the agreed figures exactly (Free 15/5 lifetime, Studio Pack ₹1,499/100, Studio Pro ₹3,999/500, Studio Plus ₹7,999/1,500, none purchasable).
- Confirmed the end-to-end suite restores what it changes: Studio Pro's price was back to ₹3,999 after the pricing walk edited it.
- Every gate green on a clean `main`: lint, strict typecheck, source mapping, 749 unit tests, 127 integration tests against real PostgreSQL, `prisma validate`, production builds, and 10 Playwright tests.

### SC035 — Batch-limit sentence built from the account's plan

- The upload step told every account "Free plan · Up to 3 images per batch. Upgrade for 20-image batches." That was a stored constant predating SC030, which missed it: the server enforced 5 while the page said 3. SC030's claim that the application carried no second copy of a plan was therefore wrong until now.
- The sentence is now built from the signed-in account's plan name and limit, plus the largest batch any plan **on offer** allows. It offers an upgrade only when one genuinely allows more, so an account already on the largest batch is never told to upgrade to what it has, and a deactivated plan is never advertised.
- The shell's fallback when a plan cannot be resolved was a second hardcoded `5`. It now comes from the canonical free-plan definition.
- Added sentence, largest-batch, context-fallback and upload-step coverage.

### SC036 — Local processing pipeline shares one settings file

- Local processing never worked from a copied `.env.example`, for three independent reasons, all traced on a real stuck upload:
  - **The dispatcher could never authenticate.** Compose never read any `.env`, so the dispatcher always used its built-in token while the application used the one in its settings file. Every dispatch returned `403`, and a job created while the queue was unconfigured stayed `CREATED` forever.
  - **The worker never received the provider key.** It sat in the application's file, which compose did not read.
  - **The worker could not start with one provider configured.** Compose sends every provider's setting, so the two not in use arrived as empty strings, which validation treated as present-but-invalid.
- Every compose command now runs through `scripts/local-compose.sh`, which reads `apps/web/.env`, the file the application reads. Tokens and provider keys therefore come from one place.
- The image worker now uses the application's storage settings, so it reads originals from the bucket the browser uploaded to — MinIO or AWS — instead of being hard-wired to MinIO. The wrapper passes them verbatim, including settings left empty: a compose default of `true` for the path-style flag would have sent MinIO-style requests to AWS. A `localhost` endpoint is rewritten to `host.docker.internal`. The `web` container is unchanged.
- An empty optional setting now means "not set" across the storage, queue and provider settings, through one `emptyAsUnset` helper that replaces the single inline copy of that rule. It never weakens a requirement: an empty key for the **selected** provider, or an access key whose secret is empty, is still refused, and tests pin both.
- Fixed a validation-order bug in `BOOTSTRAP_ADMIN_EMAIL` found along the way: `z.email()` checked the format before trimming, so an address with a stray space was rejected. The same pattern was fixed elsewhere in SC031 but missed here.
- Verified on the real stuck uploads: the job stuck at `CREATED` processed as soon as the dispatcher authenticated, and the one parked in the dead-letter queue processed once moved back. Both outputs are in the configured bucket and usage was charged once each.

### SC037 — The logo leads home

- The StudioCar AI logo in the workspace sidebar and on the sign-in card was plain text, so clicking it did nothing. Both now link to the homepage through one shared `BrandHomeLink`, labelled for screen readers and with a visible keyboard focus. The homepage header already linked to the top of its own page and is unchanged.

### SC038 — A visible way out of the full-screen viewer

- The portfolio viewer's close button existed but could not be seen. The `ghost` button style is designed for light surfaces, so its near-black label sat invisibly on the near-black viewer and appeared only on hover. It now uses light text, a subtle outline and a translucent hover on that surface, plus a decorative `×`; its accessible name is unchanged.
- The end-to-end walk now opens the viewer and checks the button's rendered text colour, because `toBeVisible` passes for black-on-black text. It then closes the viewer with the button.

### Repository governance

- Added mandatory repository-wide agent instructions and repository context.
- Enforced no explicit `any` and no TypeScript type assertions in shared lint configuration.
- Ignored the generated Next.js `next-env.d.ts` file.
- Made Prisma client generation an explicit CI prerequisite for type-aware linting on clean runners.

## Next planned slices

Every slice in the accepted plan is done. What remains was deferred by that plan, not dropped from it.

1. **Later hardening**: control-plane and delivery telemetry, capacity and cost telemetry, recovery operations, load-test automation, AWS deployment, and BiRefNet substitution proof.

## Not yet implemented

Tracked explicitly so the gap between the plan and the repository stays visible.

- **Identity disconnection is not implemented.** Linking exists; removing a method still needs a "never leave an account without a usable sign-in method" rule and re-authentication, and nothing in the accepted scope requires it.
- **Customers still cannot buy anything.** `BillingPort` is intentionally unimplemented until a payment provider is selected, and no plan is marked purchasable, because a checkout that cannot complete must not be advertised. A subscription exists only when an administrator assigns one by hand.
- **An assignment does not expire by itself.** The period is honoured on read, so an expired assignment stops applying, but nothing sweeps the row back to `EXPIRED`. That belongs with the scheduled lifecycle jobs.
- **No social link is seeded.** The footer shows what an administrator configures and nothing otherwise, which is deliberate — but it means a fresh deployment's footer has no social section until somebody adds one.
- **New plans cannot be created from the interface.** `/admin/pricing` edits the four plans the deployment ships; adding a fifth still needs a code change, because `planKey` is the closed set that subscriptions and the usage contract are keyed by.
- **A plan-catalog read failure is not observable.** The web application has no logger yet, so a failed `PlanConfig` query surfaces as an error page rather than as a recorded event. This belongs with the control-plane telemetry slice.
- **The activity trail is not searchable or paged.** The overview shows the most recent 25 administrative changes and nothing older. Filtering by actor, action or date needs a dedicated page.
- **There is no command to redrive a dead-lettered job.** A message that fails five times is parked and its job shows "Processing" with no failure state; recovery is the manual `aws sqs` sequence in the README. This belongs with the recovery-operations slice.
- **Nothing prunes the audit trail.** It grows without bound; retention belongs with the scheduled lifecycle jobs that already cover other tables.

## Deployment state

StudioCar AI is in development and has not been deployed to production. Schema
changes therefore carry no live-data migration risk today, but the repository
keeps its additive-migration rule and its local-only reset guards so that stays
true when it does ship.

## Important implementation notes

- Plan configuration is authoritative once a `PlanConfig` row exists; the shipped defaults in `apps/web/src/server/plans/default-plan-configurations.ts` are a fallback for an unseeded database and for a key the catalog no longer describes. `pnpm db:seed` installs missing plans and never overwrites an edited one.
- `allowanceScope` and `currency` are deliberately not editable. The scope decides how usage already charged is counted, so changing it would reinterpret history rather than change the future.
- A manual subscription never overwrites one a payment provider owns. When the billing provider lands, the provider's webhook remains the only writer of `PAYMENT_PROVIDER` rows, and the administration page must keep refusing to touch them.
- An account is found for subscription management only through a verified `AuthIdentity`, never through `User.primaryEmail` or `primaryPhone`. Those are profile values, not proof.
- A footer link has no shipped default on purpose. It is an address the public will follow, so it exists only once an administrator supplies a real one; an empty result renders no section at all.
- `AuditLog.metadata` is `Json` and must be validated before any field is read; entries written by an older version of the product still have to render. Audit entries are rendered to sentences on the server so stored metadata never reaches a page.
- `AuditLog.userId` is set to null when an account is deleted. A null actor therefore means either the system acted (first-run bootstrap only) or the administrator's account is gone; do not report them as the same thing.
- Integration fixtures must be unique per run. The whole integration suite shares one database across parallel package tasks, so a fixture another process can delete makes a file fail on timing rather than on behaviour.
- Do not modify the committed initial migration after it has been applied; add a new backward-compatible migration for every schema change.
- Prisma CLI validation/generation can run without secrets; migration and integration commands require `DATABASE_URL`.
- Real PostgreSQL integration tests currently cover schema constraints, tenant-scoped vehicle operations, sessions, one-time OAuth challenges, canonical Google identities, OTP throttling, canonical phone identities, atomic phone-session completion, image upload idempotency, and concurrent processing-batch reservation.
- Google OAuth requires an exact registered `GOOGLE_REDIRECT_URI`; production must use HTTPS. OAuth challenge TTL defaults to 10 minutes and is bounded to 1–15 minutes.
- MSG91 uses the Widget flow, not the DLT-template server API. Allow-list every origin that renders the sign-in surface on the MSG91 widget, or `sendOtp` and `verifyOtp` will never answer. Raw OTPs are never received, persisted, or logged; only a hash of the verified access token is stored, to make it single use.
- Expired OTP challenge and verification-attempt cleanup is intentionally deferred to the production cleanup-jobs slice; indexes support bounded deletion without affecting authentication correctness.
- The authenticated route group enforces session authorization on the server. Future API handlers and repositories must still perform their own authentication, tenant authorization, and ownership checks.
- Product navigation entries remain non-interactive until their corresponding slices land; this prevents dead routes while preserving the screenshot-derived application shell.
- Profile updates are limited to the display name. Verified email and phone values remain identity-owned and can change only through a future explicit re-verification/linking flow.
- Upload commits perform bounded structural header validation in Next.js. The processing worker must perform a full decoder validation before any provider call; malformed or unsupported images must transition to `INVALID` without a provider charge.
- Expired pending-upload objects are deleted only through the durable storage-deletion outbox after the configured grace period. Invalid objects remain retained for deterministic audit behavior until a separately reviewed retention policy exists.
- Vehicle creation requires an `Idempotency-Key`; exact retries return the original draft, while reuse with different normalized details returns a conflict. Only `DRAFT` vehicles can be changed through the creation workflow update endpoint.
- The complete four-step wizard is mounted from the dashboard and submits only through the real authenticated processing command. Custom studio backgrounds are visible but disabled until a private background-asset upload and ownership flow is implemented.
- Processing reservation moves the vehicle from `DRAFT` to `PROCESSING` only in the same transaction that creates every job and its outbox message. SC012B2 may expose this command only through the dispatcher and scheduled recovery path established on top of that durable intent.
- Publishing an outbox message and marking its job `QUEUED` cannot be one cross-system transaction. The dispatcher therefore retains the database claim until SQS acknowledges the message, updates outbox and job state atomically afterward, and safely republishes after a crash; the worker must treat duplicate `jobId` deliveries as harmless.
- `PROCESSING_DISPATCH_TOKEN` protects the recovery endpoint and must be distinct, randomly generated, and server-only. A trusted scheduler must invoke recovery at least once per minute; the endpoint returns only aggregate dispatch counts and never queue payloads or errors.
- Worker retries are new durable outbox publications, not in-process loops. The original SQS delivery is acknowledged only after the retry intent is committed; the dispatcher later republishes when `nextAttemptAt` becomes due.
- The worker core deliberately depends on a `ProcessingJobExecutorPort`. SC013 must perform full decode validation, deterministic private-S3 output storage, preview generation, and provider execution behind that port before exposing a deployable Lambda entry point.
- The remove.bg adapter requests transparent WebP because the current provider supports WebP up to 50 megapixels while PNG transparency is limited to 10 megapixels. Worker-side validation must still enforce the configured 22 MB provider input limit and safe pixel bounds before invoking it.
- The Lambda artifact must place `handler.mjs` plus external production dependencies and the Linux arm64 Sharp binary at the archive root. The checked-in worker stack deliberately accepts an immutable artifact key rather than building mutable source during deployment.
- Persisting the synchronous remove.bg response before transformation closes the common provider-success/finalization-failure retry path. A process termination during the external HTTP exchange remains an inherently uncertain provider outcome because remove.bg does not expose a true idempotency-key/reconciliation API; provider tags are supplied for correlation, and migration to an asynchronous provider must reconcile its external request ID inside the adapter.
- Plate-privacy detection is not fabricated by the Sharp treatment pipeline; a dedicated detection/redaction adapter remains required before that option can be truthfully advertised as enforced in production.
- `apps/web/next-env.d.ts` is generated by Next.js and intentionally untracked.
- Processing progress must use truthful stages unless a provider exposes meaningful progress.
- The global activity store contains only transient job IDs and the latest server response; it is not canonical and intentionally does not survive a full browser restart. Processing continues independently, and the inventory/dashboard server queries must rediscover active vehicle state from PostgreSQL.
- Dashboard operational values are server-authoritative: completed-image usage comes from immutable `UsageEvent` quantities, active counts from explicit database states, and storage from committed original plus processed asset sizes. The current free allowance is sourced from the shared plan catalog as nine images across three documented sessions with three images per batch.
- Upload-session usage is now recorded as `VEHICLE_PROCESSING_BATCH_CREATED` in the processing-reservation transaction and remains separate from per-image `BACKGROUND_REMOVAL_COMPLETED` charges. Usage & Billing queries filter these event types explicitly; adding a new usage type cannot silently inflate an unrelated quota.
- `BillingPort` is intentionally unimplemented until a payment provider is selected. UI upgrade controls disclose this state and never return fake checkout URLs, mutate subscriptions, or claim payment success.
- The email worker consumes only the stable `EmailWorkerMessage` contract and treats delivery as an independent data plane. No user-facing request publishes to its SQS queue or waits for Resend; a trusted scheduler invokes the recovery dispatcher at least once per minute with a dedicated `EMAIL_DISPATCH_TOKEN`.
- Resend retains idempotency keys for a bounded provider window. PostgreSQL delivery claims and terminal outcomes provide application-level duplicate suppression beyond that window; an unresolved provider-success/database-outage interval remains an externally uncertain operation and must be handled conservatively during DLQ replay.
- Processing-completion email reservation occurs only when the vehicle atomically transitions from `PROCESSING` to `READY`, a verified primary email is present, and the job belongs to a keyed batch. The email row snapshots delivery-facing values so later profile edits cannot change an already accepted notification.
- Queue payload recipient, vehicle name, and URL values are never used as worker authority. The worker claims by message UUID and reconstructs the delivery from the immutable database snapshot plus validated `APPLICATION_BASE_URL` before rendering email.
- Batched status polling pauses completely for hidden tabs, refreshes immediately when visible, removes terminal IDs from future polls, and splits more than 100 active IDs into sequential contract-bounded requests. Terminal results remain in the activity panel until dismissed so failures are not silently lost.
- Inventory is a separate optimized read model rather than an extension of draft mutation endpoints. Its bounded PostgreSQL aggregate selects only the latest processing batch for each vehicle on the current cursor page, so historical reprocessing cannot grow card payloads or alter current progress; it never invents provider-level progress.
- Inventory preview URLs are signed at render time from tenant-scoped preview object keys and expire according to the bounded presigned URL configuration. Full-resolution asset signing is isolated to the tenant-authorized portfolio service.
- Portfolio URLs are signed only after the tenant-scoped detail repository selects the latest completed batch. Originals use inline signed responses, processed outputs have separate inline and attachment signatures, and all URLs expire according to the bounded presigned URL configuration.
- Favorites, edit, reprocess, hero selection, and ZIP actions remain intentionally absent until their canonical persistence, mutation, and archive-generation flows exist; the UI does not expose controls that would falsely imply those operations are implemented.
- Browser portfolio tests use explicit non-production AWS credentials solely to exercise local SigV4 generation and intercept the private S3 host before any network request; CI does not require or expose production AWS credentials.
- Marketing pricing is illustrative and centralized in `apps/web/src/features/pricing/pricing-plans.ts`; no action claims payment success, and the same module must be reused by Usage & Billing until commercial configuration moves behind the billing boundary.
- The marketing vehicle visual is an original generated RGBA asset stored at `apps/web/public/images/marketing/silver-sedan.png`; it has no embedded brand marks, readable plate, remote runtime dependency, or user-provided image content. The three dashboard quick-action assets under `apps/web/public/images/dashboard/` are compositions of that same asset over generated studio grounds, so they inherit its provenance and carry no new licensing question.
- Turborepo's E2E task explicitly passes only `DATABASE_URL`, `AWS_REGION`, and `S3_BUCKET`; this ensures authenticated Playwright tests actually execute while keeping unrelated secrets out of the browser-test task.
- Docker Hub's `minio/minio` repository is access gated; the local stack uses `quay.io/minio/minio`. MinIO applies browser CORS through `MINIO_API_CORS_ALLOW_ORIGIN` because the bundled `mc` build has no `cors` command.
- The local worker bundles externalise `@aws-sdk/client-sqs` alongside Prisma and Sharp. esbuild's ESM output cannot satisfy that SDK's CommonJS `require` of Node builtins, and those packages are genuine runtime dependencies of the deployable artifact rather than of the bundle.
- All future work follows the branch → PR → required CI → merge workflow in `/AGENTS.md`.
- Browser security headers are generated from focused constants and applied through `next.config.ts`. The production CSP intentionally excludes eval; S3 is the only external browser data-plane origin class. Re-run browser tests whenever a new third-party client integration is introduced rather than broadening directives preemptively.
- CI runs `pnpm audit --prod --audit-level moderate`. The workspace overrides for `deepmerge-ts` and `mysql2` are temporary reviewed transitive remediations for Prisma 7.10 and must be removed once Prisma pins patched versions upstream.
- Explicit `S3_*` and `SQS_*` credentials exist for local emulators and deployments with no attachable role. Production must keep them unset and rely on workload identity; configuring only one half of a key pair fails closed at startup.
- Production credential ownership is defined in `docs/security.md`. `apps/web/.env.example` is a local-development union only; focused runtime parsers and deployment configuration must prevent unrelated secrets from crossing process boundaries.
- No webhook route may trust parsed JSON before verifying the provider's signature over the exact raw bytes. The generic HMAC-SHA256 adapter may be selected only for a provider whose official protocol matches it; other protocols require their own verifier adapter.
- Lifecycle cleanup deletes only records strictly older than configured cutoffs in bounded, skip-locked batches. Image bytes use the separate storage-deletion outbox: the asset status change and deletion intent are atomic, S3 deletion is idempotent, and exhausted failures remain queryable for explicit replay rather than being silently discarded.
- Image-worker telemetry uses CloudWatch EMF service-only aggregates for alarms and a second bounded service/outcome/provider dimension set for diagnosis. IDs remain nested correlation fields, and event construction exposes no free-form error or payload field. Estimated cost metrics are intentionally deferred until a deployment supplies a reviewed provider rate; the system must not hardcode or fabricate remove.bg pricing.

## Per-slice update checklist

Update this document in every meaningful PR with:

- completed feature ID and scope;
- migrations, API/contract, UI, infrastructure, and test changes;
- verification performed;
- operational caveats or follow-up work;
- the next reviewable slice.
