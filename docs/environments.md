# Environments

StudioCar AI runs in exactly three environments, selected by `APP_ENV`:

| `APP_ENV` | Purpose |
| --- | --- |
| `local` | Everything on the developer's machine. Needs nothing but a remove.bg key. |
| `development` | Real Google, MSG91, AWS S3, remove.bg, and database; queues, workers, and mail stay local. |
| `production` | Fully deployed. No local adapter can be selected. |

`NODE_ENV` keeps its ordinary Node.js and Next.js meaning (how the code was
built and is being run) and selects nothing. `NODE_ENV=production` with
`APP_ENV=development` is valid: an optimised build against Development
infrastructure. The CI browser suite runs exactly that combination with
`APP_ENV=local`.

`APP_ENV` is required. A missing or unknown value is a configuration error in
every runtime; no environment is ever assumed.

## The environment matrix

| Capability | Local | Development | Production |
| --- | --- | --- | --- |
| Google sign-in | fake (fixed local identity) | Google OAuth | Google OAuth |
| Phone OTP | fake (code `1234`) | MSG91 Widget | MSG91 Widget |
| Database | Docker PostgreSQL | Development PostgreSQL | Production PostgreSQL |
| Original and processed images | MinIO | AWS S3 Development bucket | AWS S3 production bucket |
| Processing queue | ElasticMQ | ElasticMQ (AWS SQS allowed later) | AWS SQS |
| Image worker | local container | local container | deployed Lambda |
| Background removal | remove.bg | remove.bg | configured provider (remove.bg) |
| Email queue | ElasticMQ | ElasticMQ | AWS SQS |
| Email worker | local container | local container | deployed Lambda |
| Email delivery | Mailpit | Mailpit (Resend allowed deliberately) | Resend |
| Dispatch scheduler | local ticker | local ticker | trusted scheduler |
| AWS credentials | none | explicit S3 pair or AWS default chain | workload identity |
| Google credentials | none | required | required |
| MSG91 credentials | none | required | required |
| Resend credentials | none | none | required |

The matrix is code, not only documentation:
[`packages/config/src/environment-profiles.ts`](../packages/config/src/environment-profiles.ts)
is the single source of truth for what each environment selects and which
explicit overrides it tolerates.

## How configuration is resolved

1. Each process reads the settings it owns through a focused Zod parser in
   `packages/config` (`parseUploadEnvironment`, `parseImageWorkerEnvironment`,
   and so on). No process parses another's secrets.
2. Before validating, every parser lays the `APP_ENV` profile's defaults under
   the configured values. An explicit value always wins; an empty value counts
   as unset.
3. Validation then applies the profile's rules: which drivers are allowed,
   where storage and queues may live, and which committed local values are
   refused. A violation names the setting and fails startup.

Only repository-owned infrastructure is ever defaulted. External credentials
(remove.bg, Google, MSG91, Resend, AWS), a Development session secret, and
anything a deployment owns have no default anywhere.

The Local defaults live in one module,
[`packages/config/src/local-infrastructure.ts`](../packages/config/src/local-infrastructure.ts).
A unit test keeps the compose file, which cannot import TypeScript, in step
with it.

Provider selection happens only at composition roots
(`create-google-identity-provider.ts`, the phone runtime, `create-mailer.ts`,
`create-background-removal-provider.ts`, and the S3/SQS client options).
Domain code, the worker core, and the email outbox behave identically in every
environment.

## One settings file

Every local process — `pnpm dev`, Prisma commands, `pnpm db:reset`,
`pnpm db:seed`, and the compose stack — reads the repository-root
**`.env.local`**. Start it from an example:

| File | Use |
| --- | --- |
| `.env.example.local` | `cp .env.example.local .env.local` |
| `.env.example.development` | `cp .env.example.development .env.local` |
| `.env.example.production` | Reference for deployments only. Never copy it into a file. |

Settings files inside `apps/web` are refused with an error, because Next.js
would load them on its own and they would silently override `.env.local`. A
value already present in the process environment always wins over the file.

A unit test keeps the three examples aligned with the parsers: every documented
variable must be one a runtime reads, retired names are refused, each file's
`APP_ENV` must match its name, the completed example must start every runtime
of that environment, and a variable is marked optional exactly when the
environment starts without it.

## Local

The whole application runs without any external account except remove.bg.

```bash
cp .env.example.local .env.local   # then fill in REMOVEBG_API_KEY
pnpm install
pnpm infra:up                      # PostgreSQL, MinIO, ElasticMQ, Mailpit, workers, dispatcher
pnpm db:reset                      # Local only: drop and reapply every migration
pnpm db:seed                       # install the plan catalog
pnpm dev                           # http://localhost:3000
```

- **Google sign-in** is the `fake` driver. "Continue with Google" returns
  straight to the application's own callback with a code bound to the one-time
  OAuth challenge, then resolves the fixed identity
  `developer@studiocar.local` ("StudioCar Developer") through the ordinary
  identity, account, and session path. Set
  `BOOTSTRAP_ADMIN_EMAIL=developer@studiocar.local` to make it the first local
  administrator.
- **Phone sign-in** is the `fake` driver: any valid Indian mobile number and the
  code `1234`. The challenge, browser binding, rate limits, normalisation,
  identity, linking, and session issuance all run.
- **Uploads** go from the browser straight to MinIO with the same presigned,
  checksum-bound PUT used in production, and the commit endpoint verifies the
  object. The content security policy allows the MinIO origin only under this
  profile.
- **Processing** follows the real path: reservation and outbox in PostgreSQL,
  the dispatcher, ElasticMQ, the image worker (the deployed handler driven by a
  local consumer), MinIO, remove.bg, and completion with its usage event.
- **Email** follows the real path too: outbox, dispatcher, ElasticMQ, the email
  worker, and Mailpit at http://localhost:8025.

| Service | Address |
| --- | --- |
| Application | http://localhost:3000 |
| PostgreSQL | `postgresql://studiocar:studiocar@localhost:5432/studiocar` |
| MinIO console | http://localhost:9001 (`studiocarlocal` / `studiocarlocal123`) |
| ElasticMQ | http://localhost:9324 |
| Mailpit | http://localhost:8025 |

`pnpm app:up` runs the application in a container as well (Local only).
`pnpm infra:build` rebuilds the worker and application images after their code
or dependencies change.

Automated tests never call remove.bg, Google, MSG91, or Resend; they replace
providers at their ports.

## Development

Development tests the external boundaries that matter while keeping queues,
workers, and mail easy to debug locally.

```bash
cp .env.example.development .env.local   # then fill in every required value
pnpm infra:up                            # ElasticMQ, Mailpit, both workers, dispatcher
pnpm db:migrate:deploy                   # against the Development database
pnpm dev                                 # http://localhost:3000
```

Required: `DATABASE_URL` (the Development database), `SESSION_SECRET`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MSG91_WIDGET_ID`,
`MSG91_WIDGET_TOKEN`, `MSG91_AUTH_KEY`, `S3_BUCKET` (the Development bucket),
and `REMOVEBG_API_KEY`. `AWS_REGION` defaults to `ap-south-1`.

- **Google OAuth** is real. Register
  `http://localhost:3000/api/auth/google/callback` (or your Development
  origin's callback) as a redirect URI on the OAuth client.
- **Phone OTP** is the real MSG91 Widget flow: the widget sends and verifies
  the code in the browser, and the server verifies the resulting access token
  with `MSG91_AUTH_KEY` and asserts the handset. Replay protection, browser
  binding, and rate limits are unchanged. **Allow-list the Development origin
  on the MSG91 widget** — `http://localhost:3000` locally, and the exact origin
  of any hosted Development deployment. Do not disable the widget's domain
  restriction to make localhost work.
- **Storage** is the dedicated AWS S3 Development bucket, reached by the
  browser through presigned PUTs exactly as in production. Its CORS rule must
  allow the Development origin (`AdditionalBrowserOrigin` in
  `infrastructure/aws/upload-storage.yml`).
- **AWS credentials** come from an explicit `S3_ACCESS_KEY_ID` /
  `S3_SECRET_ACCESS_KEY` pair, or, when both are empty, the AWS default chain
  (CLI profile, SSO, or `AWS_*` variables). The containerised image worker
  cannot see `~/.aws`: give it the explicit pair, or export
  `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` before `pnpm infra:up`.
- **Queues, workers, and mail** are the local ElasticMQ, the same worker
  containers as Local (pointed at the Development database and bucket), and
  Mailpit. Resend is not required.

Development refuses the fake sign-in drivers, MinIO and localhost storage, the
local bucket and emulator keys, the committed Local session secret, and any
bucket, queue, or database that declares production ownership. A missing
Google or MSG91 setting is an error, never a fallback.

Migrating from the old `apps/web/.env`: move it to `.env.local` at the
repository root, add `APP_ENV=development` (or `local`), delete `NODE_ENV`,
the `NEXT_PUBLIC_APP_URL` line, and every value the profile now supplies, and
make sure `EMAIL_FROM`, if set, is a plain address.

## Production

Production runs deployed infrastructure only: Vercel for the application,
Lambda for both workers, AWS SQS, the production S3 bucket, production
PostgreSQL, Resend, Google OAuth, and MSG91.

- Secrets come from the deployment platform — Vercel environment variables,
  AWS Secrets Manager or SSM Parameter Store resolved into each Lambda, and a
  workload identity instead of AWS keys. Never create a committed or shared
  production settings file.
- Each runtime receives only the variables
  [`docs/security.md`](./security.md) assigns to it.
  `.env.example.production` lists the contract, annotated by runtime.
- The worker templates set `APP_ENV=production`.

Production refuses, at startup:

- fake Google and fake phone OTP;
- MinIO, any localhost or compose-host S3 endpoint, and the emulator keys;
- ElasticMQ and any non-AWS or plain-http queue URL;
- Mailpit;
- the local queue consumers (production workers are deployed functions);
- the local bucket, a bucket without a `prod`/`production` name segment, and a
  bucket, queue, or database name declaring a non-production environment;
- a local database or the committed local database credentials;
- the committed session secret and command tokens;
- an http or non-public `APPLICATION_BASE_URL` or `GOOGLE_REDIRECT_URI`.

Missing production configuration is always an error. Nothing is filled in by a
default except the driver choices the production profile itself makes.

## Storage and queue ownership

The application cannot see an AWS account, so it checks ownership by declared
name segments. A production bucket must carry a `prod` or `production` segment
(`studiocar-prod-images`); Development refuses any bucket carrying one; and
production refuses any bucket, queue, or database name carrying `dev`,
`staging`, `test`, `local`, or a similar segment. A production name copied into
Development, or a Development name copied into production, therefore fails at
startup. The storage template additionally records the owning environment as
the `studiocar:environment` bucket tag.

## Database reset

`pnpm db:reset` runs only when `APP_ENV=local`, refuses `NODE_ENV=production`,
and refuses any database host that is not the developer's machine or the
compose network unless `--i-understand-this-destroys-data` is passed. It never
creates sample data; `pnpm db:seed` installs configuration only.
