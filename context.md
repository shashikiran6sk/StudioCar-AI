# StudioCar AI Repository Context

## Product

StudioCar AI is a production-oriented automotive image-processing SaaS. Dealers upload vehicle photos directly to private object storage, request asynchronous background removal and image treatments, monitor processing, manage inventory/portfolios, and track plan usage.

The architectural goal is to move from remove.bg to fal.ai BiRefNet v2 and eventually self-hosted BiRefNet v2 without changing the product layer, upload flow, polling contract, vehicle domain, or usage accounting.

## Sources of truth

- Product and system behavior: the repository's StudioCar AI technical specification and accepted implementation requirements.
- Repository-wide engineering instructions: `/AGENTS.md`.
- Visual design tokens and component rules: `/docs/design.md`.
- Screen composition: `/docs/screens/`.
- Current delivery state and implementation notes: `/docs/progress.md`.
- Boundary contracts: `packages/contracts`.
- Persistence model: `apps/web/prisma/schema.prisma` and committed migrations.

For conflicts, apply product behavior and architecture first, then design rules, then screenshot composition. Do not ignore either design source.

## Technology and workspace

- Node.js 24+, pnpm 12, Turborepo
- Next.js App Router, React, strict TypeScript, Tailwind CSS
- Zod boundary validation and Zustand for transient client state
- PostgreSQL with Prisma
- AWS S3, SQS, Lambda, and DLQs
- Google OAuth/OIDC and MSG91 phone OTP
- Resend behind an asynchronous mail boundary
- Vitest, React Testing Library, real PostgreSQL integration tests, and Playwright
- GitHub Actions for CI; Vercel for the web application; AWS for queues, storage, and workers

Workspace layout:

- `apps/web`: Next.js application, application-server code, and the Prisma schema, migrations, and tenant repositories
- `workers/image-processing`: asynchronous image-processing worker
- `packages/ui`: reusable design-system components
- `packages/contracts`: canonical Zod schemas and inferred DTO types
- `packages/database-runtime`: generated Prisma client, pooled client factory, and the repositories shared with the deployable workers
- `packages/email`: provider-neutral email outbox, delivery claims, and mailer ports
- `packages/processing`: processing domain and provider ports/adapters
- `packages/observability`: structured logging and metrics
- `packages/config`: validated environment and shared tool configuration
- `packages/testing`: shared test support
- `infrastructure/aws`: deployable AWS resources and operational configuration
- `tests`: root unit, integration, and end-to-end suites

## Architectural boundaries

Control plane:

`Browser → Next.js → PostgreSQL`

Data plane:

`Browser → S3 → SQS → Worker → BackgroundRemovalProvider → S3`

Application flow:

`UI → Server Action/Route Handler → Application Service → Domain Rules → Repository/Port → Infrastructure Adapter`

Route handlers stay thin. React code never calls Prisma or external processing providers. PostgreSQL owns state; private S3 owns bytes. Processing is asynchronous and queue delivery is assumed to be at least once.

## Core domain

The canonical persistence model includes `User`, `AuthIdentity`, `Session`, `Vehicle`, `ImageAsset`, `ProcessingJob`, `ProcessingAttempt`, `ProcessedAsset`, `UsageEvent`, `PlanSubscription`, `WebhookEvent`, and `AuditLog`.

Important invariants:

- An `ImageAsset` is distinct from a `ProcessingJob`; the same image may be processed more than once.
- Every user-owned query enforces tenant ownership.
- Session cookies contain opaque random tokens; only hashes are stored in PostgreSQL.
- Auth identities use `provider + providerSubject`, never email as the permanent provider identity.
- Upload commit verifies S3 metadata before `PENDING_UPLOAD → UPLOADED`.
- Processing state is explicit: `CREATED`, `QUEUED`, `PROCESSING`, `RETRYING`, `COMPLETED`, `FAILED`, or `CANCELLED`.
- Duplicate delivery cannot cause duplicate provider charges, outputs, or usage events.
- Successful job completion and immutable usage-event creation occur atomically.
- Stored database values are private object keys, not permanent S3 URLs.

## Code conventions

- Strict TypeScript is mandatory; see `/AGENTS.md` for prohibited escape hatches.
- Canonical external contracts live in `packages/contracts` and infer their TypeScript types from Zod.
- Environment access is validated in `packages/config`; callers do not read ad hoc environment variables.
- One focused endpoint, component, or reusable function per file. Shared utilities and constants live in focused modules.
- Prefer explicit Prisma `select` clauses and indexed, tenant-scoped queries.
- Use structured, correlated logs without sensitive data.
- Keep implementation slices small, independently reviewable, tested, and deployable.

## Local verification

Install with `pnpm install --frozen-lockfile`. Standard quality commands are documented in `README.md` and mandated by `/AGENTS.md`. Integration tests require a real PostgreSQL test database through `DATABASE_URL`. Never point test commands at a shared or production database.
