# Security and secret ownership

Production secrets are scoped to the smallest runtime that needs them. Do not
copy the local `.env.example` union into every deployment, share credentials
between runtimes, expose secrets through `NEXT_PUBLIC_*`, or inject worker-only
provider keys into the Next.js application.

## Runtime ownership matrix

| Runtime | Secret/config access | Explicitly excluded |
| --- | --- | --- |
| Next.js session and read models | `DATABASE_URL` | Provider, email-delivery, and scheduler secrets |
| Google OAuth routes | `DATABASE_URL`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, optional `BOOTSTRAP_ADMIN_EMAIL` | MSG91, Resend, remove.bg, fal.ai |
| Administration pages and mutations | `DATABASE_URL` | Every provider and scheduler secret; authorization is read from the database |
| Phone OTP start and verify routes | `DATABASE_URL`, `SESSION_SECRET`, `PHONE_OTP_DRIVER`, `MSG91_AUTH_KEY`, `MSG91_WIDGET_ID`, `MSG91_WIDGET_TOKEN` | Google, Resend, image-provider keys |
| Phone OTP widget route | `PHONE_OTP_DRIVER`, `PHONE_OTP_DEV_CODE`, `MSG91_WIDGET_ID`, `MSG91_WIDGET_TOKEN` | `SESSION_SECRET`, `DATABASE_URL`, `MSG91_AUTH_KEY`, every other secret |
| Upload, inventory, portfolio, and storage-cleanup control plane | `DATABASE_URL`, `AWS_REGION`, `S3_BUCKET`, optional `S3_ENDPOINT`/`S3_FORCE_PATH_STYLE`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY`, workload-role S3 read/write/delete permissions | Image bytes, worker queue-consumer permissions, provider keys |
| Processing outbox dispatcher | `DATABASE_URL`, `AWS_REGION`, `SQS_IMAGE_QUEUE_URL`, optional `SQS_ENDPOINT`/`SQS_ACCESS_KEY_ID`/`SQS_SECRET_ACCESS_KEY`, `PROCESSING_DISPATCH_TOKEN`, queue-publisher permission | Queue-consumer permission, provider keys, image-object write permission |
| Email outbox dispatcher | `DATABASE_URL`, `AWS_REGION`, `SQS_EMAIL_QUEUE_URL`, optional `SQS_ENDPOINT`/`SQS_ACCESS_KEY_ID`/`SQS_SECRET_ACCESS_KEY`, `EMAIL_DISPATCH_TOKEN`, `APPLICATION_BASE_URL`, queue-publisher permission | `RESEND_API_KEY`, queue-consumer permission |
| Image-processing worker | `DATABASE_URL`, private-image S3 read/write, image-queue consume, only the selected provider credential | Session, OAuth, OTP, email, scheduler secrets, dispatch tokens |
| Email-delivery worker | `DATABASE_URL`, `EMAIL_DRIVER`, `RESEND_API_KEY`, `EMAIL_FROM`, `APPLICATION_BASE_URL`, email-queue consume | S3, image queue, image-provider, auth secrets, dispatch tokens |
| Trusted processing scheduler | Processing dispatch URL and `PROCESSING_DISPATCH_TOKEN` only | Database, AWS, provider, session secrets |
| Trusted email scheduler | Email dispatch URL and `EMAIL_DISPATCH_TOKEN` only | Database, AWS, Resend, session secrets |
| Trusted lifecycle scheduler | Lifecycle cleanup URL and `LIFECYCLE_CLEANUP_TOKEN` only | Database, AWS, provider, auth, and dispatch secrets |
| Trusted storage-cleanup scheduler | Storage cleanup URL and `STORAGE_CLEANUP_TOKEN` only | Database, AWS, provider, auth, and dispatch secrets |

Use workload identities and the checked-in least-privilege IAM policies instead
of long-lived AWS access keys in production. Explicit `S3_*` and `SQS_*` key
pairs exist for local emulators and for deployments with no attachable role;
configuring only half of a pair is rejected at startup rather than failing
opaquely at the first signed request. Processing and email dispatch tokens
and both cleanup tokens must be independently generated. Rotate a credential inside its owning runtime,
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

## Local development drivers

The local environment selects development drivers that cannot reach a customer:
`PHONE_OTP_DRIVER=fake` sends no message, and `EMAIL_DRIVER=mailpit` delivers
only to an inbox on the developer's own machine. Environment validation refuses
both when `NODE_ENV` is `production`.

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
Environment validation refuses it when `NODE_ENV` is `production`.

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
