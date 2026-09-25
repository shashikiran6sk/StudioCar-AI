# Environments

StudioCar AI runs in exactly three environments, selected by `APP_ENV`:

| `APP_ENV` | Purpose |
| --- | --- |
| `local` | Everything on the developer's machine. Needs nothing but a remove.bg key. |
| `development` | Real Google, MSG91, AWS S3, AWS SQS, remove.bg, and database; the image worker and dispatcher stay local. |
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
| Processing queue | ElasticMQ | AWS SQS Development queue | AWS SQS |
| Image worker | local container | local container | deployed Lambda |
| Background removal | remove.bg | remove.bg | configured provider (remove.bg) |
| Email delivery | none | none | none |
| Dispatch scheduler | local ticker | local ticker | trusted scheduler |
| AWS credentials | none | explicit S3 and SQS pairs or AWS default chain | workload identity |
| Google credentials | none | required | required |
| MSG91 credentials | none | required | required |

StudioCar sends no email. Users follow processing through the application's
own status polling. Email addresses remain identity and profile data only: the
verified Google address, the profile's primary email, administrator invitations,
and `BOOTSTRAP_ADMIN_EMAIL`.

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
(remove.bg, Google, MSG91, AWS), a Development session secret, and
anything a deployment owns have no default anywhere.

The Local defaults live in one module,
[`packages/config/src/local-infrastructure.ts`](../packages/config/src/local-infrastructure.ts).
A unit test keeps the compose file, which cannot import TypeScript, in step
with it.

Provider selection happens only at composition roots
(`create-google-identity-provider.ts`, the phone runtime,
`create-background-removal-provider.ts`, and the S3/SQS client options).
Domain code and the worker core behave identically in every environment.

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
pnpm infra:up                      # PostgreSQL, MinIO, ElasticMQ, image worker, dispatcher
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

| Service | Address |
| --- | --- |
| Application | http://localhost:3000 |
| PostgreSQL | `postgresql://studiocar:studiocar@localhost:5432/studiocar` |
| MinIO console | http://localhost:9001 (`studiocarlocal` / `studiocarlocal123`) |
| ElasticMQ | http://localhost:9324 |

`pnpm app:up` runs the application in a container as well (Local only).
`pnpm infra:build` rebuilds the worker and application images after their code
or dependencies change.

Automated tests never call remove.bg, Google, or MSG91; they replace
providers at their ports.

## Development

Development tests the external boundaries that matter, the processing queue
included, while keeping the image worker easy to debug locally.

```bash
cp .env.example.development .env.local   # then fill in every required value
pnpm infra:up                            # image worker and dispatcher only
pnpm db:migrate:deploy                   # against the Development database
pnpm dev                                 # http://localhost:3000
```

Required: `DATABASE_URL` (the Development database), `SESSION_SECRET`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MSG91_WIDGET_ID`,
`MSG91_WIDGET_TOKEN`, `MSG91_AUTH_KEY`, `AWS_REGION` (the example sets
`ap-south-1`), `S3_BUCKET` (the Development bucket), `SQS_IMAGE_QUEUE_URL` (the
Development queue), and `REMOVEBG_API_KEY`. Optional: the `S3_*` and `SQS_*`
key pairs (see below), and `WORKER_DATABASE_URL`, for a database the worker
container cannot reach at `DATABASE_URL` (see below). `pnpm infra:up` refuses to
start without `SQS_IMAGE_QUEUE_URL`.

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
  Error mapping, attempt and resend policy, and the SMS template setup are in
  `docs/phone-otp.md`.
- **Storage** is the dedicated AWS S3 Development bucket, reached by the
  browser through presigned PUTs exactly as in production. Its CORS rule must
  allow the Development origin (`AdditionalBrowserOrigin` in
  `infrastructure/aws/upload-storage.yml`).
- **AWS credentials** come from an explicit `S3_ACCESS_KEY_ID` /
  `S3_SECRET_ACCESS_KEY` pair for storage and `SQS_ACCESS_KEY_ID` /
  `SQS_SECRET_ACCESS_KEY` for the queue, or, when a pair is empty, the AWS
  default chain (CLI profile, SSO, or `AWS_*` variables). The containerised
  image worker cannot see `~/.aws`: give it the explicit pairs, or
  `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, exported or in `.env.local`.
  The simplest setup is one IAM key with S3 and SQS access under those two
  `AWS_*` names in `.env.local`, with both pairs empty: `pnpm dev` loads it into
  its environment and compose passes it to the worker, so both processes
  reach S3 and SQS through the default chain. Without any of these the worker
  logs `image worker receive failed: CredentialsProviderError`.
- **The processing queue** is a dedicated AWS SQS Development queue with its
  own dead-letter queue. Provision it from
  `infrastructure/aws/image-processing-queue.yml` with a Development name, for
  example `QueueName=studiocar-dev-image-processing`; a name with a `prod` or
  `production` segment is refused. The application publishes to it, so its
  credentials need the publisher policy, and the worker's need the consumer
  policy. ElasticMQ, and any localhost or compose-host queue, is refused.
- **The image worker and the dispatcher** are the only containers
  `pnpm infra:up` starts. The worker is the same container as Local, pointed
  at the Development database, bucket, and queue; the dispatcher calls the
  application on the host. If an ElasticMQ container is left over from an
  earlier Development stack, `pnpm infra:down` removes it.
- **The worker may need its own database address.** Docker Desktop
  containers have no IPv6 route, so a host that publishes only an AAAA record
  works for `pnpm dev` on the host but fails inside the worker. Supabase's
  direct host `db.<ref>.supabase.co` is IPv6-only. Keep it as `DATABASE_URL`
  and set `WORKER_DATABASE_URL` to the session pooler,
  `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`.
  `scripts/local-compose.sh` passes it to the worker as that container's
  `DATABASE_URL`, where the worker's parser validates it like any other. Do
  not point the application at the pooler: session mode admits only a handful
  of clients (15 on the free tier), fewer than `pnpm dev` holds open, and
  every request then fails with `EMAXCONNSESSION`. Run `pnpm infra:up` after
  changing either value, because the worker reads it at start.
  `WORKER_DATABASE_URL` is refused outside Development.

Development refuses the fake sign-in drivers, MinIO and localhost storage,
ElasticMQ and localhost queues, the local bucket and emulator keys, the
committed Local session secret, and any bucket, queue, or database that
declares production ownership. A missing
Google or MSG91 setting is an error, never a fallback.

Migrating from the old `apps/web/.env`: move it to `.env.local` at the
repository root, add `APP_ENV=development` (or `local`), delete `NODE_ENV`,
the `NEXT_PUBLIC_APP_URL` line, every value the profile now supplies, and every
retired email-delivery setting (`APPLICATION_BASE_URL`, `EMAIL_*`,
`RESEND_API_KEY`, `SQS_EMAIL_QUEUE_URL`), which nothing reads any more.

## Production

Production runs deployed infrastructure only: Vercel for the application,
Lambda for the image worker, AWS SQS, the production S3 bucket, production
PostgreSQL, Google OAuth, and MSG91.

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
- the local queue consumers (production workers are deployed functions);
- the local bucket, a bucket without a `prod`/`production` name segment, and a
  bucket, queue, or database name declaring a non-production environment;
- a local database or the committed local database credentials;
- the committed session secret and command tokens;
- an http or non-public `GOOGLE_REDIRECT_URI`.

Missing production configuration is always an error. Nothing is filled in by a
default except the driver choices the production profile itself makes.

### Search indexing and Search Console

Only the canonical `https://studiocarai.com/` homepage is indexable. The SEO
routes use `APP_ENV`, Vercel's `VERCEL_ENV` when present, and the request host:
Local, Development, previews, and noncanonical hosts emit `noindex, nofollow`,
disallow crawling, and publish an empty sitemap. Workspace, administrator,
sign-in, and authentication error pages are always `noindex, nofollow`.

To complete Google Search Console verification, add the Google-provided token
as optional server-side `GOOGLE_SITE_VERIFICATION` in the Vercel Production
environment. The homepage then emits the verification meta tag. No token is
needed to build or deploy. Verify the `studiocarai.com` property and submit
`https://studiocarai.com/sitemap.xml` after deployment.

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
