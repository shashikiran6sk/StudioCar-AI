# Observability

```text
Next.js → Vercel Logs + Sentry
    ↓ durable outbox (requestId + existing batchIdempotencyKey)
   SQS → native CloudWatch metrics
    ↓
 Lambda → structured JSON / CloudWatch Logs + Sentry
    ↓
 remove.bg → CloudWatch custom metrics from actual HTTP exchanges
    ↓
   S3 → private output and native AWS metrics

AWS infrastructure → CloudWatch Metrics
Unexpected application exceptions → Sentry
```

## Correlation and log events

Every API route returns `x-request-id`. A valid UUID supplied in that header is
reused; otherwise the server generates one. API error bodies use that same ID.
Processing reservation saves it in the nullable `ProcessingJob.requestId` column.
`batchId` means the existing batch idempotency key, not a new database identity.
The outbox reads both IDs from the authoritative job for every publication,
including scheduled recovery and retries. Old jobs use `jobId` as request ID;
old queue messages remain compatible.

The queue consumer creates an isolated asynchronous context per record. Provider
and S3 logs inherit its request, batch, job and SQS message IDs. IDs are log
fields, never metric dimensions. Do not put credentials or personal information
in correlation identifiers. The processing batch's existing idempotency key
should remain the browser-generated opaque identifier.

Important events: `http_request_completed`, `processing_job_reserved`,
`sqs_job_published`, `job_received`, `image_processing_started`,
`remove_bg_started`, `remove_bg_completed`, `remove_bg_failed`,
`provider_result_reused`, `s3_upload_completed`, `s3_upload_failed`,
`image_processing_completed`, `image_processing_failed`, `job_ignored`, and
`unexpected_exception`. JSON logs carry lowercase info/warn/error levels,
environment, status and durations where applicable. The existing
`image_processing_message` EMF event remains compatible.

API paths are route templates (`/api/uploads/[assetId]`), never URLs or query
strings. Logs and Sentry exclude request bodies, headers, cookies, image bytes,
S3 keys, signed URLs, emails and phone numbers. Error text is repository-owned;
raw external exception messages are replaced with a safe message. Machine error
classes/codes, bounded causal classes and sanitized V8 code locations remain
available for debugging. This deliberately sacrifices raw provider/database
message text that could contain credentials. The original exception stays the
cause when wrapped in `ApplicationError`.

In Vercel Runtime Logs, search the JSON `requestId` or `batchId`. Copy the same ID
into CloudWatch Logs Insights on the worker's log group:

```sql
fields @timestamp, event, eventName, requestId, batchId, jobId,
       correlation, statusCode, durationMs, errorCode, error
| filter requestId = 'REQUEST_UUID'
    or correlation.requestId = 'REQUEST_UUID'
| sort @timestamp asc
```

For a batch replace the filter with:

```sql
filter batchId = 'BATCH_KEY' or correlation.batchId = 'BATCH_KEY'
```

A partial-batch retry is acknowledged at the invocation level, so Lambda's
native `Errors` does **not** count those records. Watch the existing
`ProcessingRetryCount` and `ProcessingTerminalFailureCount` alongside provider
failure metrics and the DLQ. DLQ payloads include correlation but must never be
copied into application logs wholesale.

## Metrics and dashboard

Deploy `infrastructure/aws/observability.yml` after the existing queue and worker
stacks. Supply `WorkerFunctionName`, `QueueName`, `DeadLetterQueueName`, a unique
`DashboardName`, and optionally an existing confirmed SNS `AlarmTopicArn`.
Pass that topic to the worker and queue stacks too. Their outputs now expose the
names used by the dashboard. Use isolated production AWS accounts/regions for
these service aggregate metrics; do not export development traffic into the
production aggregate.

The dashboard has API, Lambda, SQS, and remove.bg sections. Lambda panels use
`AWS/Lambda` Invocations, Errors, Duration (average/p95/max), Throttles and
ConcurrentExecutions plus an error-rate expression. SQS panels use `AWS/SQS`
visible/in-flight depth, oldest age, sent/received/deleted counts and visible DLQ
messages. Native queue counts include delivery retries; `ImagesProcessed` shows
successful application work.

API custom metrics in `StudioCarAI/Operations`, dimension
`Service=nextjs-api`: `HttpRequests`, `Http2xx`, `Http401`, `Http403`, `Http4xx`,
`Http5xx`, and `HttpDuration` (milliseconds). These cover application route
executions. Cached/static responses and Vercel firewall/platform failures remain
in Vercel's native observability. Set `HTTP_CLOUDWATCH_METRICS_ENABLED=true` only
on the production Vercel deployment. Next's `after` lifecycle publishes them
with the AWS SDK after responding; publication uses one attempt and a one-second
abort deadline. Export failures emit `http_metrics_publish_failed` and never
alter the response. These best-effort metrics are operational signals, not
billing/audit authority.

Attach the stack's `HttpMetricPublisherPolicyArn` to the application's existing
AWS workload role. It allows only `cloudwatch:PutMetricData` in the operations
namespace. No log drain, collector, extra backend, or static AWS key is required.
The AWS SDK uses the existing default credential chain; configure the
application's approved Vercel/AWS workload identity credential bridge according
to its deployment setup. Existing `S3_*`/`SQS_*` adapter keys are not CloudWatch
credentials. The region must match the AWS dashboard.

remove.bg EMF metrics, dimension `Service=image-processing-worker`:

- `removebg.request.count`, `removebg.success.count`, `removebg.failure.count`
- `removebg.duration` (milliseconds, complete exchange including body read)
- `removebg.status.400`, `.401`, `.402`, `.403`, `.429`, `.500`
- `removebg.status.4xx`, `removebg.status.5xx` (all such HTTP responses)
- `removebg.credits.charged` (sum of valid provider-reported values, including zero
  and fractional credits)
- `removebg.success.unreported_credits.count` (successful requests with no valid
  credit header; an estimate of unreported processing volume, **not credits**)

The single `RemoveBgProvider` remains the only API caller. ORIGINAL processing
and staged-provider-result reuse do not emit provider request/credit metrics.
Successful HTTP responses can consume credits even if image validation later
fails, so reported charges are captured independently of final application
success. Timeout/network outcomes have no fabricated status. A process killed
mid-exchange may have an uncertain charge; metrics are not a replacement for
the provider's invoice. No account polling or remaining-credit estimate is
introduced. The official [remove.bg API](https://www.remove.bg/api) documents
`X-Credits-Charged`; `X-RateLimit-Remaining` is a rate limit, not a credit balance.

## Alarms

New alarms use two breaching periods out of three five-minute periods and
`TreatMissingData=notBreaching`:

| Alarm | Initial threshold | Configuration |
| --- | --- | --- |
| Lambda error rate | ≥5%, at least 20 invocations per period | `LambdaErrorRatePercent`, `MinimumLambdaInvocations` |
| Lambda throttles | ≥5 per period | `LambdaThrottleCount` |
| remove.bg 429 | ≥5 per period | `RemoveBgRateLimitCount` |
| remove.bg 5xx | ≥5 per period | `RemoveBgServerErrorCount` |
| remove.bg failure rate | ≥20%, at least 20 requests per period | `RemoveBgFailureRatePercent`, `MinimumRemoveBgRequests` |

Existing configurable worker alarms cover p95 duration (100 seconds, two
one-minute periods), terminal failures, retry spikes and end-to-end latency.
Existing queue alarms cover oldest-message age (300 seconds for two minutes),
queue depth, and any visible DLQ message. The old isolated-invocation error alarm
and duplicate provider rate-limit alarm are replaced by sustained alarms in the
observability stack. Review thresholds against actual volume and worker timeout.
SNS notification destinations belong to the deployment owner; an empty topic
still creates alarms/dashboard but sends no notifications. Confirm subscriptions
and test alarm actions before depending on paging.

## Sentry and deployment settings

Exception tracking is server-only, using one Node SDK in Next's instrumentation
hooks and in Lambda. It catches unexpected route/service/storage/queue
exceptions; validation and expected provider rejections remain logs. There is no
browser SDK, session replay, performance sampling, request capture, default PII
collection or automatic breadcrumb collection. `beforeSend` reconstructs an
allowlisted event containing safe exception locations and correlation tags only.
Invocation-end flushes are bounded to two seconds.

| Variable | Runtime | Purpose |
| --- | --- | --- |
| `APP_ENV` | Next + worker | Existing environment; required for external telemetry |
| `SENTRY_DSN` | Next + worker | Optional, server-side HTTPS DSN; separate projects recommended |
| `SENTRY_RELEASE` | Next + worker | Optional commit SHA/version matching deployed artifact |
| `HTTP_CLOUDWATCH_METRICS_ENABLED` | Next only | `true` enables API metric export; default `false` |
| `AWS_REGION` | Next + worker | Existing AWS region; required for API metric export |
| `REMOVEBG_API_KEY` | worker only | Existing repository spelling, unchanged |

The Next instrumentation hooks use the standard Node SDK; no Next build plugin,
Sentry auth token or public DSN is needed. Configure production Sentry projects,
retention/access and issue notifications. Use the same release for Vercel and the
worker when deploying the same commit. Deploy worker `SentryDsn` and
`SentryRelease` stack parameters. Lambda archives must include external
`@sentry/node` and `@aws-sdk/client-cloudwatch` dependencies alongside existing
external dependencies. No provider key reaches Vercel.

Deploy the additive database migration before publishing the new web/worker
artifacts. Existing job IDs and outbox retry/idempotency rules are unchanged.
Update queue/worker stacks and create the observability stack. No AWS or Vercel
resource is deployed automatically by this code change.

## Verification

Locally leave Sentry and HTTP metric export unset. Run `pnpm test` (uncached for
changed root tests), lint/typecheck/build, and database integration/E2E gates
against an isolated local PostgreSQL. The deterministic tests cover log/Sentry
scrubbing, interleaved contexts, HTTP status counts, credits, provider statuses,
and outbox correlation. Inspect logs while processing a Local batch: the response
ID appears on queue/provider/S3 logs, with the existing batch key. A live
remove.bg smoke consumes a provider request; mocked adapter tests require none.

In production:

1. Process one authorized image. Record the response header and batch key.
   Search both Vercel and CloudWatch for the complete lifecycle; check the final
   S3 upload and processing-completed events.
2. Repeat/replay delivery and confirm `provider_result_reused` does not increase
   remove.bg request or credit counts. Confirm tenant usage still charges once.
3. Make a controlled unauthenticated request (401) and cross-origin mutation
   (403). Confirm status logs and API counters; validation should create no
   Sentry issue. Check the dashboard after CloudWatch ingestion.
4. In a non-production deployment with a test Sentry project, inject an adapter
   exception through a controlled test harness. Confirm release, request/batch
   tags and stack locations, with no headers/payloads/secrets. Do not add a public
   crash endpoint.
5. Test sustained alarms using isolated test metrics/queues and AWS alarm-state
   testing; confirm SNS notifications. Do not intentionally exhaust production
   remove.bg credits or flood it to produce 429s. Verify `Errors` versus partial
   failures, native throttling, duration and queue-age panels independently.
