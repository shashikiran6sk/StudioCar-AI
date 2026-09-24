# StudioCar AI

Production-oriented automotive image processing built as a pnpm and Turborepo monorepo.

## Requirements

- Node.js 24 or newer
- pnpm 12.3.4

## Getting started

StudioCar runs in three environments selected by `APP_ENV` — `local`,
`development`, and `production`. See [`docs/environments.md`](./docs/environments.md)
for what each one runs and requires.

### Local (no external accounts except remove.bg)

```bash
cp .env.example.local .env.local   # then fill in REMOVEBG_API_KEY
pnpm install --frozen-lockfile
pnpm infra:up                      # PostgreSQL, MinIO, ElasticMQ, image worker, dispatcher
pnpm db:reset                      # Local only: drop and reapply every migration
pnpm db:seed                       # install the plan catalog
pnpm dev                           # http://localhost:3000
```

"Continue with Google" signs in as `developer@studiocar.local` without
contacting Google, and phone sign-in accepts the code `1234` without sending a
message. Both run the ordinary challenge, identity, and session flow. Uploads go
to MinIO, and processing goes through ElasticMQ and the real image worker to
remove.bg. Results appear through the application's ordinary status polling;
StudioCar sends no email.

### Development (real Google, MSG91, AWS S3, and database)

```bash
cp .env.example.development .env.local   # then fill in every required value
pnpm infra:up                            # ElasticMQ, image worker, dispatcher
pnpm db:migrate:deploy                   # against the Development database
pnpm dev
```

Allow-list the Development origin (`http://localhost:3000`) on the MSG91 widget
and in the Development bucket's CORS rule, and register the Google redirect URI.

### Production

`.env.example.production` documents the production contract for reference.
Production values come from the deployment platform, never from a file.

## Workspace commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
pnpm e2e
```

## Local stack

Both startup modes are driven by `infrastructure/local/docker-compose.yml`:

```bash
pnpm infra:up    # the support plane for the configured APP_ENV
pnpm dev         # Next.js natively, with fast reloads

pnpm app:up      # Local only: the same, plus the application in a container
pnpm app:down    # or pnpm infra:down
```

`pnpm infra:build` rebuilds the worker and application images after changing
their code or dependencies; `up` on its own reuses them.

| Service | Address | Notes |
| --- | --- | --- |
| Application | http://localhost:3000 | `pnpm dev`, or the `web` container under `app:up` |
| PostgreSQL | `postgresql://studiocar:studiocar@localhost:5432/studiocar` | Local only |
| Object storage | http://localhost:9001 | MinIO console, `studiocarlocal` / `studiocarlocal123`; Local only |
| Queues | http://localhost:9324 | ElasticMQ, SQS-compatible |

The local stack reproduces the production data plane: a presigned browser
upload, a durable outbox drained by the dispatcher, an SQS-compatible queue, the
and the real image worker, which runs the same deployed handler the Lambda
runtime does.

### One settings file

Every local process reads the repository-root `.env.local`: the application,
Prisma, `pnpm db:reset`, `pnpm db:seed`, and every compose command, which runs
through `scripts/local-compose.sh`. The dispatcher and the application therefore
always agree on the dispatch tokens, and the image worker receives the
background-removal key without a second copy of it. Settings files inside
`apps/web` are refused, and no `.env` file is ever copied into an image.

The image worker uses the application's database and storage settings, so it
reads originals from whichever bucket the browser uploaded them to: MinIO under
Local, the AWS Development bucket under Development. A `localhost` address is
rewritten to `host.docker.internal`, because inside a container `localhost` is
the container itself.

### A job stuck on "Processing"

A queue message that fails five times is moved to a dead-letter queue and is
not retried automatically, so its job stays `QUEUED`. Once the cause is fixed,
move the message back:

```bash
export AWS_ACCESS_KEY_ID=studiocarlocal AWS_SECRET_ACCESS_KEY=studiocarlocal123 AWS_REGION=ap-south-1
Q=http://localhost:9324/000000000000
aws sqs receive-message --endpoint-url http://localhost:9324 \
  --queue-url $Q/studiocar-images-dlq --visibility-timeout 120 > dlq.json
# Re-send its Body to $Q/studiocar-images, then delete it from the
# dead-letter queue using its ReceiptHandle.
```

Redelivering a job's message is safe: the worker treats a duplicate `jobId` as
harmless, and usage is charged only once.

## Database

The Prisma schema, migrations, and configuration belong to `apps/web`. The
generated client and the repositories shared with the deployable worker live in
`packages/database-runtime`.

```bash
pnpm db:generate        # regenerate the Prisma client
pnpm db:validate        # validate the schema
pnpm db:migrate:deploy  # apply committed migrations
pnpm db:migrate:status  # verify applied migrations
pnpm db:reset           # LOCAL ONLY: drop, reapply every migration, regenerate
pnpm db:seed            # install the canonical plan catalog
```

`pnpm db:seed` installs configuration, not sample data: it creates no users,
vehicles or images, and it never overwrites a plan an administrator has edited,
so it is safe to re-run. Social links are deliberately not seeded; a link exists
only once a real address is configured.

`pnpm db:reset` creates no sample data. It runs only when `APP_ENV=local`, and
refuses when `NODE_ENV` is `production` or when the database does not point at
a known local host; that last guard can only be overridden with an explicit
flag. Prisma itself
additionally refuses a destructive reset requested by an AI agent unless a human
has consented through `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`.

Database commands are deliberately invoked directly rather than through
Turborepo, so stateful migration work is never served from a task cache.

They read the repository-root `.env.local`; under `APP_ENV=local` the database
address comes from the Local profile, so nothing needs to be set. A variable
already set in the environment always wins, so a deployment or CI run is never
masked by a local file.

## Administration

Signed-in administrators reach an internal area at `/admin`, hidden from
everybody else and authorized against the database on every page and every
mutation.

| Destination | What it changes |
| --- | --- |
| `/admin` | Bounded counts, accounts by plan, and the recent administrative changes |
| `/admin/pricing` | Plan prices, allowances, batch limits, storage, and copy |
| `/admin/subscriptions` | A paid plan assigned by hand, until a billing provider exists |
| `/admin/content` | The public footer's social links |
| `/admin/admins` | Who has administrator access |

Authorization is a row in `UserRole`, never an environment value.
`BOOTSTRAP_ADMIN_EMAIL` names the one verified Google email that may become the
**first** administrator on a database that has never had one; completion is
recorded in `AppConfig`, so the value is inert afterwards and cannot re-grant a
revoked administrator. Everyone else is granted from inside the product.

Every grant, revocation, plan edit, subscription assignment, and footer-link
change writes an `AuditLog` entry naming the administrator who made it.

See [`docs/security.md`](./docs/security.md) for the full secret-ownership and
authorization model.

Product and architecture requirements live in [`docs/`](./docs/).

