# StudioCar AI Implementation Progress

Last updated: 2026-09-19

## Current status

Foundation, the first design-system primitives, canonical boundary contracts, the initial persistence model, tenant-safe repositories, opaque sessions, Google OAuth/OIDC, MSG91 phone OTP authentication, authenticated account surfaces, direct private-S3 upload infrastructure, the vehicle-draft persistence boundary, and all four vehicle-wizard UI steps are implemented. The next planned slice creates and enqueues processing jobs, then mounts the complete wizard against that real command boundary.

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

### Repository governance

- Added mandatory repository-wide agent instructions and repository context.
- Enforced no explicit `any` and no TypeScript type assertions in shared lint configuration.
- Ignored the generated Next.js `next-env.d.ts` file.
- Made Prisma client generation an explicit CI prerequisite for type-aware linting on clean runners.

## Next planned slices

1. **SC012 — Asynchronous processing**: final review command, job state machine, idempotent claims, SQS/DLQ, retry classification/backoff, Lambda worker, atomic usage completion, and activation of the complete vehicle wizard.
2. **SC013 — Provider abstraction**: stable `BackgroundRemovalProvider`, remove.bg adapter, and configuration-selected fal.ai/self-hosted extension boundaries.
3. **SC014+ — Product surfaces**: adaptive polling/status UX followed incrementally by homepage, dashboard, inventory, portfolio/detail, and usage/billing.
4. **Later hardening**: asynchronous email, security review, performance/preview generation, observability/alerts, full E2E completion, AWS deployment, cleanup/replay/backups/load testing, and BiRefNet substitution proof.

## Important implementation notes

- Do not modify the committed initial migration after it has been applied; add a new backward-compatible migration for every schema change.
- Prisma CLI validation/generation can run without secrets; migration and integration commands require `DATABASE_URL`.
- Real PostgreSQL integration tests currently cover schema constraints, tenant-scoped vehicle operations, sessions, one-time OAuth challenges, canonical Google identities, OTP throttling, canonical phone identities, and atomic phone-session completion.
- Google OAuth requires an exact registered `GOOGLE_REDIRECT_URI`; production must use HTTPS. OAuth challenge TTL defaults to 10 minutes and is bounded to 1–15 minutes.
- MSG91 uses its server-side V5 OTP endpoints. Configure an approved template and tune the bounded OTP TTL/rate-limit environment values for production traffic; raw OTPs are never persisted or logged.
- Expired OTP challenge and verification-attempt cleanup is intentionally deferred to the production cleanup-jobs slice; indexes support bounded deletion without affecting authentication correctness.
- The authenticated route group enforces session authorization on the server. Future API handlers and repositories must still perform their own authentication, tenant authorization, and ownership checks.
- Product navigation entries remain non-interactive until their corresponding slices land; this prevents dead routes while preserving the screenshot-derived application shell.
- Profile updates are limited to the display name. Verified email and phone values remain identity-owned and can change only through a future explicit re-verification/linking flow.
- Upload commits perform bounded structural header validation in Next.js. The processing worker must perform a full decoder validation before any provider call; malformed or unsupported images must transition to `INVALID` without a provider charge.
- Pending assets and invalid private objects are retained for deterministic retry/audit behavior; bounded cleanup jobs are deferred to production hardening.
- Vehicle creation requires an `Idempotency-Key`; exact retries return the original draft, while reuse with different normalized details returns a conflict. Only `DRAFT` vehicles can be changed through the creation workflow update endpoint.
- The complete four-step wizard is ready for composition but remains unmounted until SC012 implements its real job-creation/enqueue callback. Custom studio backgrounds are visible but disabled until a private background-asset upload and ownership flow is implemented.
- `apps/web/next-env.d.ts` is generated by Next.js and intentionally untracked.
- Processing progress must use truthful stages unless a provider exposes meaningful progress.
- All future work follows the branch → PR → required CI → merge workflow in `/AGENTS.md`.

## Per-slice update checklist

Update this document in every meaningful PR with:

- completed feature ID and scope;
- migrations, API/contract, UI, infrastructure, and test changes;
- verification performed;
- operational caveats or follow-up work;
- the next reviewable slice.
