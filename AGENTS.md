# StudioCar AI Agent Instructions

These instructions are mandatory for every AI coding agent working anywhere in this repository. They apply repository-wide unless a more specific `AGENTS.md` adds stricter guidance. Only an explicit user instruction may override a specific rule for a specific task.

## Required reading

Before changing code:

1. Read this file completely.
2. Read `/context.md` and `/docs/progress.md`.
3. Read the relevant source, tests, package configuration, and CI workflow.
4. Before UI work, read `/docs/design.md` completely and inspect every relevant screenshot under `/docs/screens/`.
5. Preserve user-owned worktree changes and avoid unrelated edits.

## Git and pull-request workflow

- Never commit or push directly to `main`.
- Start every feature, fix, refactor, documentation update, or other meaningful change on a dedicated branch created from an up-to-date `main`.
- Keep each branch and commit focused and reviewable. Do not combine unrelated changes.
- Push the branch to the remote and create a pull request targeting `main` for every change.
- Wait for every required CI check to pass. Investigate and fix failures on the branch; never skip, neutralize, or bypass checks.
- Merge only after required CI passes. `main` must contain only changes that passed the required checks.
- Do not bypass this workflow unless the user explicitly overrides it.
- Do not discard, rewrite, or include unrelated local changes belonging to the user.

## TypeScript safety

- Keep TypeScript strict. Do not weaken compiler or lint settings.
- Never use explicit or implicit `any` to make code compile.
- Never use TypeScript type assertions (`as`, angle-bracket assertions, or double assertions), including assertions in tests.
- Use precise types, generics, type guards, schema validation, discriminated unions, `satisfies`, or typed construction instead.
- Reuse canonical types. Boundary DTOs must be inferred from Zod schemas in `packages/contracts`; do not duplicate them manually.
- Treat external data as `unknown` until it has been validated.
- Do not suppress errors with `@ts-ignore`, `@ts-expect-error`, unsafe lint disables, or equivalent workarounds unless the user explicitly authorizes a documented exceptional case.

## File and module responsibilities

- Keep files small, cohesive, and discoverable.
- Put one reusable function in its own file and one React component in its own file.
- Separate business logic, presentation, types, utilities, constants, configuration, persistence, and external-service adapters.
- Move reusable helpers to the appropriate `utils` or focused domain module; do not accumulate unrelated helpers in a component or route file.
- Reuse existing utilities and abstractions before creating new ones. Do not duplicate logic.
- Avoid broad barrel files except for intentionally stable public package exports.

## Constants and configuration

- Do not scatter magic strings, numbers, labels, messages, statuses, routes, limits, or configuration through implementation code or inline return values.
- Define reusable/static values as named `const` values in the appropriate focused constants module. Use an enum when a closed related set benefits from enum semantics.
- Reuse a single canonical constant instead of duplicating literals.
- Validate environment-dependent values through `packages/config`; never hardcode deployment configuration or secrets.
- Keep secrets server-side and out of client bundles, logs, fixtures, and commits.

## Application and endpoint architecture

- Keep Next.js as the application server; do not introduce a separately deployed CRUD backend.
- Follow the boundary: UI → Server Action/Route Handler → Application Service → Domain Rules → Repository/Port → Infrastructure Adapter.
- Route handlers authenticate, validate, authorize, call an application service, and serialize the response. They must not contain business logic or direct provider/database orchestration.
- Implement one endpoint per App Router route file with a clearly discoverable path. Do not group unrelated endpoints into controller/router files.
- Keep routing, validation, authorization, business logic, database access, provider calls, utilities, and types separate.
- Prefer Server Components. Use Client Components only for genuine browser interactivity or transient state.
- Use Zustand only for transient client state; PostgreSQL and server responses remain authoritative.

## Domain, data, and security boundaries

- PostgreSQL is authoritative for application state, S3 for private image bytes, and SQS for asynchronous work.
- Large image bytes go directly from the browser to S3 with short-lived signed requests; never proxy them through Vercel.
- Image processing is asynchronous. Never call a processing provider from a user-facing request.
- Keep provider-specific behavior behind ports. Product code must not depend on remove.bg, fal.ai, or self-hosted BiRefNet semantics.
- Assume queues and webhooks deliver at least once. Claims, state transitions, provider operations, webhook handling, and usage charging must be idempotent.
- Enforce tenant ownership in every repository query and server operation. Knowing a UUID never grants access.
- Validate every untrusted boundary with canonical Zod contracts. Apply rate limits, CSRF protections, signature checks, secure cookies, private storage, and least privilege as appropriate.
- Never log tokens, OTPs, OAuth codes, signed URLs, provider secrets, or image bytes.

## UI implementation

- Treat `/docs/design.md` as the design-system source of truth and `/docs/screens/` as the visual-composition source of truth.
- Reuse `packages/ui` primitives and shared tokens before adding components or styles.
- Implement loading, empty, error, success, partial-failure, responsive, keyboard, screen-reader, focus, and reduced-motion behavior where relevant.
- Do not fabricate progress. Upload progress may use measured bytes; processing UI uses truthful stages unless a provider supplies meaningful progress.
- Visually compare completed UI with the relevant screenshot before completion.

## Tests and quality gates

- Add or update meaningful tests with every behavior change. Keep the repository's behavior-source test mapping current.
- Unit-test contracts, domain rules, transitions, authorization, retry/idempotency, utilities, and transient stores.
- Use React Testing Library for component behavior and accessibility, real PostgreSQL for repository/transaction integration tests, and Playwright for critical flows.
- Mock external services at adapter boundaries; do not replace database integration tests with mocks.
- Before committing, run the relevant focused tests and all applicable repository gates:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm test:integration`
  - `pnpm db:validate`
  - `pnpm db:migrate:status` when migrations change
  - `pnpm build`
  - `pnpm e2e`
- Do not consider a task complete with failing lint, types, tests, migration checks, build, or required CI.

## Definition of done

A task is complete only when its implementation follows the architecture and these rules, relevant tests pass, local quality gates pass, the work is committed on a dedicated branch, the branch is pushed, a PR targets `main`, all required CI checks pass, and the PR is merged. Record material progress and implementation notes in `/docs/progress.md` as part of the same change.
