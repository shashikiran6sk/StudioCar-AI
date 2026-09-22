# StudioCar AI

Production-oriented automotive image processing built as a pnpm and Turborepo monorepo.

## Requirements

- Node.js 24 or newer
- pnpm 12.3.4

## Workspace commands

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
pnpm e2e
```

## Local development

Two startup modes, both driven by `infrastructure/local/docker-compose.yml`:

```bash
pnpm infra:up    # PostgreSQL, MinIO, ElasticMQ, Mailpit, both workers, dispatcher
pnpm dev         # Next.js natively, with fast reloads

pnpm app:up      # the same, plus the application in a container
pnpm app:down    # or pnpm infra:down
```

`pnpm infra:up` is the usual choice: it starts every dependency and background
process except the web application. `pnpm infra:build` rebuilds the worker and
application images after changing their code or dependencies; `up` on its own
reuses them.

| Service | Address | Notes |
| --- | --- | --- |
| Application | http://localhost:3000 | `pnpm dev`, or the `web` container under `app:up` |
| PostgreSQL | `postgresql://studiocar:studiocar@localhost:5432/studiocar` | |
| Object storage | http://localhost:9001 | MinIO console, `studiocarlocal` / `studiocarlocal123` |
| Queues | http://localhost:9324 | ElasticMQ, SQS-compatible |
| Mail inbox | http://localhost:8025 | Mailpit; no mail leaves the machine |

The local environment reproduces the production data plane: a presigned browser
upload to MinIO, a durable outbox drained by the dispatcher, an SQS-compatible
queue, the real image worker, and the real email worker delivering to a local
inbox. Both workers run the same deployed handler the Lambda runtime does.

Phone sign-in defaults to `PHONE_OTP_DRIVER=fake`, which sends no message and
accepts `PHONE_OTP_DEV_CODE`. Email defaults to the Mailpit driver. Both are
refused in production by environment validation.

## Database

The Prisma schema, migrations, and configuration belong to `apps/web`. The
generated client and the repositories shared with the deployable workers live in
`packages/database-runtime`.

```bash
pnpm db:generate        # regenerate the Prisma client
pnpm db:validate        # validate the schema
pnpm db:migrate:deploy  # apply committed migrations
pnpm db:migrate:status  # verify applied migrations
pnpm db:reset           # LOCAL ONLY: drop, reapply every migration, regenerate
```

`pnpm db:reset` creates no sample data. It refuses to run when `NODE_ENV` is
`production` or when `DATABASE_URL` does not point at a known local host, and
that second guard can only be overridden with an explicit flag. Prisma itself
additionally refuses a destructive reset requested by an AI agent unless a human
has consented through `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`.

Database commands are deliberately invoked directly rather than through
Turborepo, so stateful migration work is never served from a task cache.

Product and architecture requirements live in [`docs/`](./docs/).

