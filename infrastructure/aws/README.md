# AWS infrastructure

The runtime credential and IAM ownership matrix is documented in
[`docs/security.md`](../../docs/security.md). Treat that matrix as a deployment
constraint: worker-only provider and delivery credentials must not be injected
into the Next.js runtime.

`upload-storage.yml` provisions the private, encrypted, versioned S3 bucket used
for browser-to-S3 image uploads and a least-privilege managed policy for the
Next.js application role. The policy also permits deletion under the same
tenant-prefixed object namespace for the durable abandoned-upload cleanup
command. Supply the exact deployed web origin for browser CORS. The rule allows
`PUT` for direct uploads and `GET` so the portfolio can assemble a ZIP in the
browser from its short-lived signed links. A non-production stack
may additionally supply `AdditionalBrowserOrigin` so a local development host
can upload directly; leave it empty in production.

`image-processing-queue.yml` provisions the encrypted standard processing queue,
its retained dead-letter queue, separate publisher and consumer policies, and
queue-depth, oldest-message-age, and non-empty-DLQ alarms. Attach only the
publisher policy to the Next.js application role; attach only the consumer policy
to the image worker role. Alarm actions should be connected to the environment's
incident-notification topic during deployment.

Configure a trusted scheduler to invoke `POST /api/internal/jobs/dispatch` at
least once per minute with `Authorization: Bearer <PROCESSING_DISPATCH_TOKEN>`.
Use a separately generated 32-character-or-longer secret and store it only in
the scheduler and server environment. User processing commands also attempt an
immediate dispatch, while this recovery call drains messages retained after
transient SQS or application failures.

Deployments must attach the output `UploadApplicationPolicyArn` only to the
application's execution role. The bucket is retained if its stack is deleted or
replaced; removing retained data is an explicit operational action.

Both the storage bucket and processing queues are retained if their stacks are
deleted or replaced. Removing retained customer data or queued work is an
explicit operational action.

`image-processing-worker.yml` deploys the Node.js 24 Lambda runtime from an
immutable, reviewed archive in a private artifact bucket. The archive must place
`handler.mjs` and its production dependencies (including the Linux arm64 Sharp
binary) at its root. The stack resolves database and remove.bg credentials from
Secrets Manager, grants only tenant-prefix object access, caps both reserved and
SQS event-source concurrency, and enables `ReportBatchItemFailures`. Configure
alarm actions and ensure the queue visibility timeout is longer than the Lambda
timeout before production deployment. The worker emits structured CloudWatch
Embedded Metric Format events under `StudioCarAI/Operations`, with correlation
IDs kept out of metric dimensions. The stack applies configurable log retention
and alarms on Lambda errors/duration, terminal failures, retry spikes, provider
rate limits, and end-to-end latency.

`email-delivery-queue.yml` provisions a separate encrypted standard queue,
retained dead-letter queue, least-privilege publisher and consumer policies,
and queue-depth, oldest-message-age, and non-empty-DLQ alarms for transactional
email. Attach only its publisher policy to the application email outbox dispatcher;
the image-processing worker must never publish or deliver email directly.

`email-delivery-worker.yml` deploys the Node.js 24 email worker from an
immutable reviewed archive whose root contains `handler.mjs` plus the external
Prisma PostgreSQL runtime dependencies. It resolves the database and Resend API
keys from Secrets Manager, requires a verified sender address, claims durable
delivery state before contacting Resend, uses partial batch failure reporting,
and caps reserved plus event-source concurrency independently from image
processing. Keep the queue visibility timeout longer than both the Lambda
timeout and delivery claim lease, and connect every alarm to the environment's
incident-notification topic.

Configure a trusted scheduler to invoke `POST /api/internal/email/dispatch` at
least once per minute with `Authorization: Bearer <EMAIL_DISPATCH_TOKEN>`. The
email token must be separately generated from the processing dispatch token and
stored only in scheduler and application server environments. This recovery
dispatcher is the only application publisher; user-facing requests never wait
for SQS or Resend.

Configure a third trusted scheduler to invoke
`POST /api/internal/lifecycle/cleanup` with
`Authorization: Bearer <LIFECYCLE_CLEANUP_TOKEN>`. Run it repeatedly until its
bounded aggregate count reaches zero, then continue on the selected maintenance
cadence. Keep this token distinct from both dispatch tokens. The cleanup command
deletes only sessions, OAuth/OTP challenges, and command-limit events older than
their configured retention cutoffs; it does not delete vehicles, image assets,
processing jobs, usage, audit logs, or private S3 objects.

Configure a fourth trusted scheduler to invoke
`POST /api/internal/storage/cleanup` with
`Authorization: Bearer <STORAGE_CLEANUP_TOKEN>`. Keep this token distinct from
the lifecycle and dispatch tokens. Each invocation atomically marks only
long-expired `PENDING_UPLOAD` assets as deleted and reserves their immutable
object keys before attempting a bounded number of S3 deletes. Repeat while
`reserved`, `claimed`, or `retrying` work remains. Alert on non-zero `failed`
or `claimConflicts`; failed rows retain retry authority for an explicit replay
procedure. The configured grace period begins after the upload intent expires,
and committed `UPLOADED` assets are never eligible.
