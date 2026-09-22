# Security and secret ownership

Production secrets are scoped to the smallest runtime that needs them. Do not
copy the local `.env.example` union into every deployment, share credentials
between runtimes, expose secrets through `NEXT_PUBLIC_*`, or inject worker-only
provider keys into the Next.js application.

## Runtime ownership matrix

| Runtime | Secret/config access | Explicitly excluded |
| --- | --- | --- |
| Next.js session and read models | `DATABASE_URL` | Provider, email-delivery, and scheduler secrets |
| Google OAuth routes | `DATABASE_URL`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | MSG91, Resend, remove.bg, fal.ai |
| Phone OTP routes | `DATABASE_URL`, `SESSION_SECRET`, `PHONE_OTP_DRIVER`, `MSG91_AUTH_KEY`, `MSG91_WIDGET_ID`, `MSG91_WIDGET_TOKEN` | Google, Resend, image-provider keys |
| Upload, inventory, portfolio, and storage-cleanup control plane | `DATABASE_URL`, `AWS_REGION`, `S3_BUCKET`, optional `S3_ENDPOINT`/`S3_FORCE_PATH_STYLE`/`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY`, workload-role S3 read/write/delete permissions | Image bytes, worker queue-consumer permissions, provider keys |
| Processing outbox dispatcher | `DATABASE_URL`, `AWS_REGION`, `SQS_IMAGE_QUEUE_URL`, optional `SQS_ENDPOINT`/`SQS_ACCESS_KEY_ID`/`SQS_SECRET_ACCESS_KEY`, `PROCESSING_DISPATCH_TOKEN`, queue-publisher permission | Queue-consumer permission, provider keys, image-object write permission |
| Email outbox dispatcher | `DATABASE_URL`, `AWS_REGION`, `SQS_EMAIL_QUEUE_URL`, optional `SQS_ENDPOINT`/`SQS_ACCESS_KEY_ID`/`SQS_SECRET_ACCESS_KEY`, `EMAIL_DISPATCH_TOKEN`, `APPLICATION_BASE_URL`, queue-publisher permission | `RESEND_API_KEY`, queue-consumer permission |
| Image-processing worker | `DATABASE_URL`, private-image S3 read/write, image-queue consume, only the selected provider credential | Session, OAuth, OTP, email, scheduler secrets |
| Email-delivery worker | `DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `APPLICATION_BASE_URL`, email-queue consume | S3, image queue, image-provider, auth secrets |
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
