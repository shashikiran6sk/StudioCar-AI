# AWS infrastructure

The runtime credential and IAM ownership matrix is documented in
[`docs/security.md`](../../docs/security.md). Treat that matrix as a deployment
constraint: worker-only provider credentials must not be injected
into the Next.js runtime.

Every deployed runtime runs with `APP_ENV=production`; the worker templates set
it. Under that profile environment validation refuses every local adapter and
committed local value, so a deployment misconfiguration fails at startup rather
than quietly using a local driver. See [`docs/environments.md`](../../docs/environments.md).

`upload-storage.yml` provisions the private, encrypted, versioned S3 bucket used
for browser-to-S3 image uploads and a least-privilege managed policy for the
Next.js application role. The policy also permits deletion under the same
tenant-prefixed object namespace for the durable abandoned-upload cleanup
command. Supply the exact deployed web origin for browser CORS. The rule allows
`PUT` for direct uploads and `GET` so the portfolio can assemble a ZIP in the
browser from its short-lived signed links. A non-production stack
may additionally supply `AdditionalBrowserOrigin` so a local development host
can upload directly; leave it empty in production. `AppEnvironment` records the
owning environment as the `studiocar:environment` tag. A production bucket name
must carry a `prod` or `production` segment (for example
`studiocar-prod-images`), because that is how the application tells it apart:
production refuses a bucket without one, and Development refuses a bucket with
one.

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

Configure a second trusted scheduler to invoke
`POST /api/internal/lifecycle/cleanup` with
`Authorization: Bearer <LIFECYCLE_CLEANUP_TOKEN>`. Run it repeatedly until its
bounded aggregate count reaches zero, then continue on the selected maintenance
cadence. Keep this token distinct from the processing dispatch token. The cleanup command
deletes only sessions, OAuth/OTP challenges, and command-limit events older than
their configured retention cutoffs; it does not delete vehicles, image assets,
processing jobs, usage, audit logs, or private S3 objects.

Configure a third trusted scheduler to invoke
`POST /api/internal/storage/cleanup` with
`Authorization: Bearer <STORAGE_CLEANUP_TOKEN>`. Keep this token distinct from
the lifecycle and processing dispatch tokens. Each invocation atomically marks only
long-expired `PENDING_UPLOAD` assets as deleted and reserves their immutable
object keys before attempting a bounded number of S3 deletes. Repeat while
`reserved`, `claimed`, or `retrying` work remains. Alert on non-zero `failed`
or `claimConflicts`; failed rows retain retry authority for an explicit replay
procedure. The configured grace period begins after the upload intent expires,
and committed `UPLOADED` assets are never eligible.
