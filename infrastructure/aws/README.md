# AWS infrastructure

`upload-storage.yml` provisions the private, encrypted, versioned S3 bucket used
for browser-to-S3 image uploads and a least-privilege managed policy for the
Next.js application role. Supply the exact deployed web origin for browser CORS.

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
timeout before production deployment.

`email-delivery-queue.yml` provisions a separate encrypted standard queue,
retained dead-letter queue, least-privilege publisher and consumer policies,
and queue-depth, oldest-message-age, and non-empty-DLQ alarms for transactional
email. Attach only its publisher policy to the future email outbox dispatcher;
the image-processing worker must never publish or deliver email directly.

`email-delivery-worker.yml` deploys the Node.js 24 email worker from an
immutable reviewed archive whose root contains `handler.mjs`. It resolves the
Resend API key from Secrets Manager, requires a verified sender address, uses
partial batch failure reporting, and caps reserved plus event-source
concurrency independently from image processing. Keep the queue visibility
timeout longer than the Lambda timeout and connect every alarm to the
environment's incident-notification topic.

Application events and the durable email outbox producer are intentionally a
separate deployment slice. Do not publish to the email queue synchronously from
a user-facing request or block request completion on Resend.
