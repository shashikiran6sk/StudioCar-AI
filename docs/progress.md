# StudioCar AI Implementation Progress

Last updated: 2026-09-20

## Current status

The production foundation, authentication, private direct uploads, asynchronous provider-independent processing, truthful polling, screenshot-derived product surfaces, immutable-event-backed Usage & Billing, and durable transactional email are implemented. Browser response hardening, a blocking production dependency audit, durable authenticated command limits, runtime secret isolation, signed-webhook verification, bounded database retention, and durable abandoned-upload cleanup are also in place. Payment checkout remains intentionally unavailable until a billing provider is selected.

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

### Repository governance

- Added mandatory repository-wide agent instructions and repository context.
- Enforced no explicit `any` and no TypeScript type assertions in shared lint configuration.
- Ignored the generated Next.js `next-env.d.ts` file.
- Made Prisma client generation an explicit CI prerequisite for type-aware linting on clean runners.

## Next planned slices

1. **SC018B2 — Query and load hardening**: complete query/index review plus polling and burst-load verification.
2. **SC018C — Observability and alerts**: emit correlated operational metrics and alarms for lifecycle/storage cleanup, worker/provider health, and cost/storage growth.
3. **Later hardening**: full E2E completion, AWS deployment, DLQ replay/backups, and BiRefNet substitution proof.

## Important implementation notes

- Do not modify the committed initial migration after it has been applied; add a new backward-compatible migration for every schema change.
- Prisma CLI validation/generation can run without secrets; migration and integration commands require `DATABASE_URL`.
- Real PostgreSQL integration tests currently cover schema constraints, tenant-scoped vehicle operations, sessions, one-time OAuth challenges, canonical Google identities, OTP throttling, canonical phone identities, atomic phone-session completion, image upload idempotency, and concurrent processing-batch reservation.
- Google OAuth requires an exact registered `GOOGLE_REDIRECT_URI`; production must use HTTPS. OAuth challenge TTL defaults to 10 minutes and is bounded to 1–15 minutes.
- MSG91 uses its server-side V5 OTP endpoints. Configure an approved template and tune the bounded OTP TTL/rate-limit environment values for production traffic; raw OTPs are never persisted or logged.
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
- Batched status polling pauses completely for hidden tabs, refreshes immediately when visible, and removes terminal IDs from future poll requests. Terminal results remain in the activity panel until dismissed so failures are not silently lost.
- Inventory is a separate optimized read model rather than an extension of draft mutation endpoints. It exposes only operational vehicle batches and computes visible progress from completed image jobs; it never invents provider-level progress.
- Inventory preview URLs are signed at render time from tenant-scoped preview object keys and expire according to the bounded presigned URL configuration. Full-resolution asset signing is isolated to the tenant-authorized portfolio service.
- Portfolio URLs are signed only after the tenant-scoped detail repository selects the latest completed batch. Originals use inline signed responses, processed outputs have separate inline and attachment signatures, and all URLs expire according to the bounded presigned URL configuration.
- Favorites, edit, reprocess, hero selection, and ZIP actions remain intentionally absent until their canonical persistence, mutation, and archive-generation flows exist; the UI does not expose controls that would falsely imply those operations are implemented.
- Browser portfolio tests use explicit non-production AWS credentials solely to exercise local SigV4 generation and intercept the private S3 host before any network request; CI does not require or expose production AWS credentials.
- Marketing pricing is illustrative and centralized in `apps/web/src/features/pricing/pricing-plans.ts`; no action claims payment success, and the same module must be reused by Usage & Billing until commercial configuration moves behind the billing boundary.
- The marketing vehicle visual is an original generated RGBA asset stored at `apps/web/public/images/marketing/silver-sedan.png`; it has no embedded brand marks, readable plate, remote runtime dependency, or user-provided image content.
- Turborepo's E2E task explicitly passes only `DATABASE_URL`, `AWS_REGION`, and `S3_BUCKET`; this ensures authenticated Playwright tests actually execute while keeping unrelated secrets out of the browser-test task.
- All future work follows the branch → PR → required CI → merge workflow in `/AGENTS.md`.
- Browser security headers are generated from focused constants and applied through `next.config.ts`. The production CSP intentionally excludes eval; S3 is the only external browser data-plane origin class. Re-run browser tests whenever a new third-party client integration is introduced rather than broadening directives preemptively.
- CI runs `pnpm audit --prod --audit-level moderate`. The workspace overrides for `deepmerge-ts` and `mysql2` are temporary reviewed transitive remediations for Prisma 7.10 and must be removed once Prisma pins patched versions upstream.
- Production credential ownership is defined in `docs/security.md`. The root `.env.example` is a local-development union only; focused runtime parsers and deployment configuration must prevent unrelated secrets from crossing process boundaries.
- No webhook route may trust parsed JSON before verifying the provider's signature over the exact raw bytes. The generic HMAC-SHA256 adapter may be selected only for a provider whose official protocol matches it; other protocols require their own verifier adapter.
- Lifecycle cleanup deletes only records strictly older than configured cutoffs in bounded, skip-locked batches. Image bytes use the separate storage-deletion outbox: the asset status change and deletion intent are atomic, S3 deletion is idempotent, and exhausted failures remain queryable for explicit replay rather than being silently discarded.

## Per-slice update checklist

Update this document in every meaningful PR with:

- completed feature ID and scope;
- migrations, API/contract, UI, infrastructure, and test changes;
- verification performed;
- operational caveats or follow-up work;
- the next reviewable slice.
