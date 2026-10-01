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
immutable, reviewed archive in a private artifact bucket. Build it with
`pnpm package:worker`, which writes
`workers/image-processing/dist/lambda/image-processing-worker.zip` and a manifest
with its SHA-256, sizes and largest entries. The archive holds one esbuild bundle
(`handler.mjs`, with Prisma, the AWS SDK and Sentry inlined), `sharp` with its
Linux arm64 glibc binaries exactly as pinned by `pnpm-lock.yaml`, and the six
studio backgrounds under `assets/backgrounds/`. Entries are sorted, timestamped
1980-01-01 and stored with fixed permissions, so the same commit always produces
the same bytes. CI rebuilds it twice and compares them, smoke-tests it inside
`public.ecr.aws/lambda/nodejs:24` on arm64, and uploads it as the
`image-processing-worker-lambda` artifact. After a merge to `main`, CI also
publishes that exact file to the artifact bucket (see below).

| Archive | Before | After |
| --- | --- | --- |
| ZIP | 62,592,857 bytes | 18,123,601 bytes (−71%) |
| Unzipped | 199,428,523 bytes (76% of Lambda's limit) | 35,071,678 bytes (13%) |
| Files | 14,288 | 120 |

### Publishing worker archives on merge

Every commit merged to `main` publishes the archive CI built and tested to the
private artifact bucket. The `publish-worker-artifact` job in `.github/workflows/ci.yml`
runs only after the lint/test, package and build/e2e jobs pass. It writes:

```
s3://<artifact-bucket>/image-processing-worker/<short-sha>.zip
s3://<artifact-bucket>/image-processing-worker/<short-sha>.manifest.json
```

`<short-sha>` is the first 5 characters of the merged commit's SHA. Set
`WORKER_ARTIFACT_SHA_LENGTH` to change it (5–40). The full SHA is stored on each
object as `commit-sha` metadata. Five characters can collide: with about 1,000
merges there is roughly a 38% chance that two share a prefix. A collision never
overwrites anything; that merge's publish fails, and raising the length (7–12
is plenty) fixes it from the next merge.

**Immutable writes.** Keys are named after the commit and never overwritten:

- every upload is conditional on the key not existing (`If-None-Match: *`);
- S3 verifies each upload's SHA-256;
- the role is denied any write without that condition;
- re-running the job for the same commit succeeds only if the stored bytes
  are identical.

**Credentials.** The job signs in through GitHub's OIDC provider, so no AWS
access keys are stored in GitHub. `worker-artifact-publisher.yml` creates a
role that only this repository's `main` branch can assume. It can only put and
read objects under the archive prefix: it cannot list, delete or replace them.

One-time setup:

1. Deploy the publisher stack. If the account already has a
   `token.actions.githubusercontent.com` OIDC provider, pass its ARN as
   `GitHubOidcProviderArn`, because an account can hold only one. If the
   bucket uses a customer-managed KMS key, pass it as `ArtifactKmsKeyArn`.

   ```sh
   aws cloudformation deploy \
     --stack-name studiocar-worker-artifact-publisher \
     --template-file infrastructure/aws/worker-artifact-publisher.yml \
     --capabilities CAPABILITY_IAM \
     --parameter-overrides ArtifactBucket=<artifact-bucket>
   ```

2. Add these GitHub repository variables (Settings → Secrets and variables →
   Actions → Variables). None of them is a secret:

   | Variable | Value |
   | --- | --- |
   | `AWS_REGION` | Region of the artifact bucket |
   | `WORKER_ARTIFACT_BUCKET` | The artifact bucket name |
   | `WORKER_ARTIFACT_ROLE_ARN` | The stack's `WorkerArtifactPublisherRoleArn` output |
   | `WORKER_ARTIFACT_PREFIX` | Optional; defaults to `image-processing-worker` |
   | `WORKER_ARTIFACT_SHA_LENGTH` | Optional; SHA characters in the key, defaults to `5` |

   Until the bucket and role variables exist, the job is skipped, so `main`
   stays green.
3. The next merge publishes. The run summary shows the key and SHA-256.
   Deploy it by updating the worker stack's `ArtifactKey` to that key.

CI runs on `main` are never cancelled by a newer push, so every merged commit
publishes its archive. Turn on bucket versioning and a lifecycle rule for old
archives as retention requires; the role never deletes them.

The stack resolves database and Leonardo.Ai credentials from
Secrets Manager, grants only tenant-prefix object access, caps both reserved and
SQS event-source concurrency, and enables `ReportBatchItemFailures`. Configure
alarm actions and ensure the queue visibility timeout is longer than the Lambda
timeout before production deployment. The worker role also needs `s3:ListBucket` on its image bucket so absent staged
provider results return 404. Without it, S3 returns 403 and the first provider
attempt fails before removal starts. Object reads/writes remain scoped to
`users/*`; do not treat arbitrary access-denied responses as missing objects.

The worker emits structured CloudWatch
Embedded Metric Format events under `StudioCarAI/Operations`, with correlation
IDs kept out of metric dimensions. The stack applies configurable log retention
and alarms on duration, terminal failures, retry spikes and end-to-end latency.
The observability stack adds sustained Lambda/provider failure and throttle alarms.

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

## Production observability

Deploy `observability.yml` with worker/queue/DLQ names from the existing stack
outputs. Attach its HTTP metric policy to the Vercel application workload role.
Pass a confirmed existing SNS `AlarmTopicArn` to all three stacks to receive
notifications. Configure worker `SentryDsn`/`SentryRelease` and the corresponding
Vercel server variables. See [the operational guide](../../docs/observability.md)
for thresholds, packaging, deployment order, queries and smoke verification.
