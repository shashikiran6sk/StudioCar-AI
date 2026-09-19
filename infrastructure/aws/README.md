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
