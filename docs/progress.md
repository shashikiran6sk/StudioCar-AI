# StudioCar AI Implementation Progress

Last updated: 2026-09-18

## Current status

Foundation, the first design-system primitives, canonical boundary contracts, the initial persistence model, tenant-safe repositories, opaque sessions, Google OAuth/OIDC, and MSG91 phone OTP authentication are implemented. The next planned product slice is the authentication UI and authorization shell.

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

### Repository governance

- Added mandatory repository-wide agent instructions and repository context.
- Enforced no explicit `any` and no TypeScript type assertions in shared lint configuration.
- Ignored the generated Next.js `next-env.d.ts` file.
- Made Prisma client generation an explicit CI prerequisite for type-aware linting on clean runners.

## Next planned slices

1. **SC009 — Authentication UI and authorization shell**: screenshot-aligned sign-in/profile flows, authenticated layout, middleware/server authorization, security controls, and E2E coverage.
2. **SC010 — Direct S3 upload foundation**: presign and commit endpoints, tenant ownership, immutable keys, HEAD verification, file validation, and S3 adapter tests.
3. **SC011 — Vehicle creation workflow**: four-step screenshot-derived wizard, direct multi-file upload state, treatment options, review, and server-side validation.
4. **SC012 — Asynchronous processing**: job state machine, idempotent claims, SQS/DLQ, retry classification/backoff, Lambda worker, and atomic usage completion.
5. **SC013 — Provider abstraction**: stable `BackgroundRemovalProvider`, remove.bg adapter, and configuration-selected fal.ai/self-hosted extension boundaries.
6. **SC014+ — Product surfaces**: adaptive polling/status UX followed incrementally by homepage, dashboard, inventory, portfolio/detail, usage/billing, and profile.
7. **Later hardening**: asynchronous email, security review, performance/preview generation, observability/alerts, full E2E completion, AWS deployment, cleanup/replay/backups/load testing, and BiRefNet substitution proof.

## Important implementation notes

- Do not modify the committed initial migration after it has been applied; add a new backward-compatible migration for every schema change.
- Prisma CLI validation/generation can run without secrets; migration and integration commands require `DATABASE_URL`.
- Real PostgreSQL integration tests currently cover schema constraints, tenant-scoped vehicle operations, sessions, one-time OAuth challenges, canonical Google identities, OTP throttling, canonical phone identities, and atomic phone-session completion.
- Google OAuth requires an exact registered `GOOGLE_REDIRECT_URI`; production must use HTTPS. OAuth challenge TTL defaults to 10 minutes and is bounded to 1–15 minutes.
- MSG91 uses its server-side V5 OTP endpoints. Configure an approved template and tune the bounded OTP TTL/rate-limit environment values for production traffic; raw OTPs are never persisted or logged.
- Expired OTP challenge and verification-attempt cleanup is intentionally deferred to the production cleanup-jobs slice; indexes support bounded deletion without affecting authentication correctness.
- The `/auth/error` presentation route and interactive sign-in UI remain part of SC009; SC007 establishes the stable callback error-code contract.
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
