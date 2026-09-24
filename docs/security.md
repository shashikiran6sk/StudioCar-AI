# Security and secret ownership

Production secrets are scoped to the smallest runtime that needs them. Do not
copy `.env.example.production` (a reference list, not a file to deploy) into
every runtime, share credentials between runtimes, expose secrets through
`NEXT_PUBLIC_*`, or inject worker-only provider keys into the Next.js
application.

Every runtime also receives `APP_ENV`, which selects its environment profile;
see [`docs/environments.md`](./environments.md). `NODE_ENV` never selects
infrastructure or a provider.

## Runtime ownership matrix

| Runtime | Secret/config access | Explicitly excluded |
| --- | --- | --- |
| Next.js session and read models | `DATABASE_URL` | Provider and scheduler secrets |
| Google OAuth routes | `DATABASE_URL`, `SESSION_SECRET`, `GOOGLE_AUTH_DRIVER` (profile default), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, optional `BOOTSTRAP_ADMIN_EMAIL` | MSG91, remove.bg, fal.ai |
| Administration pages and mutations | `DATABASE_URL` | Every provider and scheduler secret; authorization is read from the database |
| Phone OTP start and verify routes | `DATABASE_URL`, `SESSION_SECRET`, `PHONE_OTP_DRIVER`, `MSG91_AUTH_KEY`, `MSG91_WIDGET_ID`, `MSG91_WIDGET_TOKEN` | Google, image-provider keys |
| Phone OTP widget route | `PHONE_OTP_DRIVER`, `PHONE_OTP_DEV_CODE`, `MSG91_WIDGET_ID`, `MSG91_WIDGET_TOKEN` | `SESSION_SECRET`, `DATABASE_URL`, `MSG91_AUTH_KEY`, every other secret |
| Upload, inventory, portfolio, and storage-cleanup control plane | `DATABASE_URL`, `AWS_REGION`, `S3_BUCKET`, optional `S3_ENDPOINT`/`S3_FORCE_PATH_STYLE`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY`, workload-role S3 read/write/delete permissions | Image bytes, worker queue-consumer permissions, provider keys |
| Processing outbox dispatcher | `DATABASE_URL`, `AWS_REGION`, `SQS_IMAGE_QUEUE_URL`, optional `SQS_ENDPOINT`/`SQS_ACCESS_KEY_ID`/`SQS_SECRET_ACCESS_KEY`, `PROCESSING_DISPATCH_TOKEN`, queue-publisher permission | Queue-consumer permission, provider keys, image-object write permission |
| Image-processing worker | `DATABASE_URL`, private-image S3 read/write, image-queue consume, only the selected provider credential | Session, OAuth, OTP, scheduler secrets, dispatch tokens |
| Trusted processing scheduler | Processing dispatch URL and `PROCESSING_DISPATCH_TOKEN` only | Database, AWS, provider, session secrets |
| Trusted lifecycle scheduler | Lifecycle cleanup URL and `LIFECYCLE_CLEANUP_TOKEN` only | Database, AWS, provider, auth, and dispatch secrets |
| Trusted storage-cleanup scheduler | Storage cleanup URL and `STORAGE_CLEANUP_TOKEN` only | Database, AWS, provider, auth, and dispatch secrets |

Use workload identities and the checked-in least-privilege IAM policies instead
of long-lived AWS access keys in production. Explicit `S3_*` and `SQS_*` key
pairs exist for local emulators and for deployments with no attachable role;
configuring only half of a pair is rejected at startup rather than failing
opaquely at the first signed request. The processing dispatch token and both
cleanup tokens must be independently generated. Rotate a credential inside its owning runtime,
then revoke the old value; never log either value during rollout.

The configuration package deliberately exposes focused runtime parsers. There is
no aggregate parser that requires every product secret in one environment.
Provider selection must fail closed when the selected provider's credential is
absent.

## Administrator authorization

Authorization is a row in `UserRole`, never an environment value. Revoking a
role takes effect on the next request everywhere, and nothing re-derives it from
configuration.

`BOOTSTRAP_ADMIN_EMAIL` names the one verified Google email that may become the
first administrator on a database that has never had one. It is matched only
against an email Google itself verified during a real sign-in, never against an
address in a request, an address somebody typed, or a profile field on a
phone-only account. Comparison trims and lowercases and does nothing else:
Gmail dot and plus aliasing is deliberately not folded, because that would let
one configured value match addresses its owner never chose.

Completion is persisted in `AppConfig` under `admin.bootstrap`. That record, not
the absence of an administrator, is what closes the window. Removing the
environment variable afterwards revokes nothing, changing it transfers nothing,
and an administrator who is later revoked is never re-granted by signing in
again.

Every administration page, route handler, and server action authorizes for
itself against the database. Hiding the navigation entry is presentation, not a
control: it stops nobody from requesting an endpoint directly. A signed-in
non-administrator receives `404` rather than a refusal, so the existence of the
administration area is not disclosed.

## Administrator management

Access is granted only to a **verified Google identity**. An administrator
entering an email grants immediately when a Google-verified identity already
holds that address, and otherwise records a pending invitation. No placeholder
account is ever created, and a phone-only account whose profile happens to carry
that address is never granted: the address is on the profile, but Google never
verified it.

An invitation becomes a role only when somebody signs in with a Google account
Google has verified for that address. Expired invitations are closed rather than
honoured, and revoked ones never activate.

StudioCar AI can never reach zero administrators. Revocation counts and deletes
under one lock, so two administrators revoking each other simultaneously cannot
both succeed. Every grant, invitation, cancellation, and revocation writes an
`AuditLog` entry naming the acting administrator, and none of that metadata
contains a token or credential.

## Configuration an administrator may change

Plan configuration is a row in `PlanConfig`, read fresh on each request rather
than cached across them: an allowance decides whether somebody's work is charged
or refused, so it is never served from a stale copy.

Three fields are deliberately not editable. `planKey` identifies existing
subscriptions and keeps the set of plans closed, so an edit cannot invent a plan
nothing else in the product understands. `allowanceScope` decides how usage
**already charged** is counted, so changing it would reinterpret history rather
than change the future. `currency` is fixed for the same reason.

Validation is layered. The canonical Zod contract refuses a batch limit larger
than the plan's whole allowance, and the database's own CHECK constraints refuse
the same thing, so neither can be bypassed by reaching the other first. Every
save runs under an advisory lock and writes a `PLAN_CONFIG_UPDATED` audit entry
in the same transaction.

Resolution never fails: a plan the live catalog does not describe falls back to
the shipped default, and a key nothing describes falls back to the free plan.
Falling back to the smallest allowance is the safe direction — it can delay
work, never over-grant it.

## Manually assigned subscriptions

A subscription a payment provider owns is **never** overwritten from the
administration area. The provider is the authority on what somebody has paid
for, and two rows disagreeing with no way to tell which is right is worse than
refusing the change. When a billing provider lands, its webhook remains the only
writer of `PAYMENT_PROVIDER` rows.

At most one manual assignment is ever in force, enforced by a partial unique
index as well as by the write path, so "which plan applies" is never ambiguous.
Assignments are bounded in length; no grant is open-ended.

An account is found for subscription management only through a sign-in method it
has **verified** — a Google identity with a verified email, or a phone identity.
Never `User.primaryEmail` or `primaryPhone`, which are profile values somebody
typed rather than proof.

Lookup is exact-match only. There is no partial search and no customer listing:
an administrator assigning a subscription already knows who to, and a browsable
directory of customers would disclose more than the task needs. A malformed
lookup queries nothing at all.

Ownership is keyed by account. The assignment contract takes a `userId` and
rejects a contact detail in its place, so a subscription can never be attached
to an address rather than to a person.

## Public footer links

A footer link is an address the public will follow. It must be `https`, which
the database's `SocialLink_url_is_https` CHECK constraint mirrors, so an
administrator cannot downgrade visitors to plaintext by pasting.

An address carrying credentials is refused. `https://studiocar.example@evil.example/`
reads as a StudioCar address in a status bar but is not one, and nothing
legitimate needs a password in a link the whole world can see. An `@` in the
path is accepted, because that is how most handles are written.

There is no shipped default and nothing is seeded. A link exists only once a
real address is supplied, so the footer renders nothing rather than a dead link.

## Reading the audit trail

The administration overview reads `AuditLog`, restricted to the administrative
actions and bounded, so it cannot become an unpaged dump of a table that also
carries ordinary account activity.

`AuditLog.metadata` is `Json`, so it arrives as `unknown` and is validated
before any field is read. Entries are rendered to sentences **on the server**:
stored metadata never reaches the browser, so a key added to it later cannot
leak into a page by accident.

`AuditLog.userId` is set to null when an account is deleted. A null actor
therefore means one of two different things — the system acted, which only
first-run bootstrap does, or the administrator's account is gone. The trail
names them separately, because conflating them would mislead exactly where an
audit trail matters most.

## Local development drivers

The Local profile selects drivers that cannot reach a customer: fake Google
sign-in (`GOOGLE_AUTH_DRIVER=fake`) completes the ordinary OAuth challenge and
session flow for one fixed local identity, and `PHONE_OTP_DRIVER=fake` sends
no message. StudioCar sends no email in any environment.

Only the Local profile allows the fake sign-in drivers, and production does
not allow MinIO, ElasticMQ, localhost endpoints, the local queue
consumers, non-production buckets or queues, or any committed local value.
Development refuses the fake sign-in drivers too, and a missing Google or MSG91
setting is an error in both, never a fallback. The committed Local values
(`packages/config/src/local-infrastructure.ts`) are emulator settings and
throwaway tokens; Development refuses the committed session secret and
production refuses all of them. The rules live in `packages/config` and are
applied by every runtime parser.

Settings files are read from one place, the repository-root `.env.local`, and
never baked into container images; `.dockerignore` excludes every `.env` file.

Locally running workers consume their queue and nothing more. They parse only an
SQS connection and their own queue URL, so a worker never holds a dispatch
token: publishing is the application's job and consuming is the worker's.

## MSG91 OTP widget credentials

`MSG91_WIDGET_ID` and `MSG91_WIDGET_TOKEN` are browser-safe by design: the
widget sends the message from the browser. They are still served from an
authenticated, same-origin, `no-store` endpoint rather than inlined as
`NEXT_PUBLIC_*`, because whoever holds them can spend the account's message
balance, and because rotating a widget should be a restart rather than a
rebuild.

`MSG91_AUTH_KEY` is never in that response and must never be. It is the
credential that makes access-token verification a server-to-server call, and it
is the only thing that distinguishes a proven handset from a claimed one.

`PHONE_OTP_DRIVER=fake` sends no message and accepts `PHONE_OTP_DEV_CODE`.
Only the Local profile allows it. Under Development and production, missing
widget credentials are a configuration error rather than a silently hidden
phone sign-in form.

## Signed webhook admission

No public webhook route is exposed until a real provider and its documented
signature scheme are selected. A future route must follow this order:

1. Read a bounded raw request body without parsing or re-serializing it.
2. Select the provider-specific `WebhookSignatureVerifier`; never choose a
   verifier from an untrusted payload field.
3. Verify required signature headers in constant time and reject stale or
   future timestamps before parsing JSON.
4. Validate the verified payload with the canonical Zod webhook contract.
5. Persist the provider plus external event ID under the existing unique
   constraint before applying domain behavior; duplicate delivery is success,
   not duplicate work.
6. Record `signatureVerified = true` only after verification succeeds. Rejected
   content must not be stored as a trusted event or logged verbatim.

The repository includes a raw-body HMAC-SHA256 verifier with bounded timestamp
tolerance and two-secret rotation support. It may be used only when a provider's
official protocol matches its signing payload and header semantics. Providers
using another scheme require a separate adapter behind the same verifier port.
