# Performance investigation and measurements

## Scope and source evidence

Primary guide: *StudioCar AI: performance and AI search audit*, 27 September
2026. Read in full from the supplied audit. SEO/content work is excluded.
The reviewed commit `843b611` was still current main on 28 September.
No production provider requests or infrastructure changes were made for this baseline.

Draft PR #80 (`6b5b231`) is a sound foundation but incomplete and needs
additional race coverage before merge. Its single commit combines focused plan
reads, bulk reservation, and supported Next.js `after()` dispatch. It awaits the
reservation transaction before scheduling; no untracked promise is used. It
retains EventBridge recovery and the existing claim-token guarded publication
transaction. SQS is outside transactions, and jobs become QUEUED only after SQS
acknowledgement. Bulk results are explicitly sorted by display order. It does
not alter processing options or completion usage charging.

Findings to resolve before accepting its reservation changes:

- Existing reservation checks tenant-wide usage without serializing reservations
  across different vehicles. The vehicle conditional update only protects one
  vehicle. Add a deterministic concurrent quota regression and preserve the
  charged-plus-in-flight invariant, including completion during the read.
- Add deletion/reservation, rollback, duplicate and cross-tenant coverage for
  the bulk path. Existing happy-path 20-image coverage is insufficient alone.
- Immediate dispatch remains bounded by message count, but serial sends consume
  a shared claim lease. Add elapsed-time/lease protection with batch publication.
- Entitlement read semantics should be verified at subscription boundaries.

Other audit findings remain present: separate web feature Prisma pools; serial
outbox claims, SQS sends and acknowledgement transactions; unrestricted upload
starts; broad progress subscriptions; unchanged-payload store churn; overlapping
poll wakeups; per-completion refreshes; sequential worker records and template
visibility mismatch; dynamic homepage and repeated summary reads.

## Submission changes after the baseline

PR #80 now includes tenant-wide reservation serialization and a single snapshot
for charged plus in-flight usage. Real PostgreSQL regressions cover concurrent
quota consumption/completion, deletion, rollback, duplicate/foreign assets and
subscription boundaries. The shared web client is included from merged #82.
The benchmark now captures acceptance before running the scheduled callback:
zero SQS sends must have occurred when the handler returns. It then drains the
callback and records the last mock SQS acknowledgement separately.

The table below preserves the original baseline. Reproduce that version from
PR #81 (`6005458`); running the same command on current code measures its current
implementation. Post-response dispatch timings cannot appear in an HTTP log
already emitted at acceptance; use correlated publication logs and the local
benchmark for that later phase.

## Reproduce the baseline

Use a disposable PostgreSQL 17 database named `studiocar_perf` on localhost.
Apply existing migrations, then run from the repository root:

```sh
DATABASE_URL=<isolated-local-url> pnpm exec vitest run --config tests/performance/vitest.config.mts
```

The benchmark refuses nonlocal hosts and other database names. It creates and
removes only its own users and related fixtures. It executes the real session
lookup, rate limiter, billing/plan reads, reservation, outbox repository,
dispatcher and SQS adapter with a 10 ms mock send. No S3/provider request occurs.
It invokes the monitored route handler in process; HTTP transport, browser,
serverless cold starts, real network RTT and actual SQS delivery are excluded.
The local database is already warm from fixture setup. Five samples per size
are descriptive, not a reliable p95 or evidence of production throughput.

Baseline on main plus timings, Node 24.18, PostgreSQL 17, 28 September 2026:

| Median milliseconds (5 samples) | 1 image | 5 images | 20 images |
| --- | ---: | ---: | ---: |
| Acceptance / handler response | 55.75 | 166.22 | 529.98 |
| Last mock SQS acknowledgement from start | 48.44 | 161.14 | 524.68 |
| Authentication | 2.17 | 2.19 | 1.97 |
| Rate limit | 5.57 | 4.85 | 4.42 |
| Entitlements (full summary on main) | 7.26 | 5.79 | 3.92 |
| Reservation (including outbox) | 19.62 | 24.58 | 74.08 |
| Outbox creation (nested in reservation) | 1.42 | 5.26 | 21.88 |
| Dispatch (including stages below) | 22.02 | 113.82 | 439.47 |
| Outbox claim | 4.73 | 21.98 | 89.26 |
| Mock SQS publication | 11.17 | 57.48 | 224.01 |
| Publication bookkeeping | 5.71 | 33.20 | 111.24 |
| SQS sends / outbox inserts / acknowledgements | 1 / 1 / 1 | 5 / 5 / 5 | 20 / 20 / 20 |

Nested stage durations overlap; do not sum all rows. The baseline demonstrates
linear dispatch work, not a production latency claim. Reservation transaction
has an additional explicit timing field for subsequent captures.

## Batched queue publication measurement

Measured independently on main after #81/#82 plus the batch-dispatch branch;
#80 is not included in these numbers, so this handler still awaits dispatch.
Same local PostgreSQL fixture and five samples with 10 ms mock queue requests:

| Median milliseconds | 1 image | 5 images | 20 images |
| --- | ---: | ---: | ---: |
| Handler response | 32.42 | 28.71 | 64.85 |
| Last mock SQS acknowledgement from start | 29.59 | 26.23 | 61.08 |
| Dispatch | 16.58 | 15.84 | 32.67 |
| Claim | 2.68 | 2.31 | 2.91 |
| Mock SQS publication | 11.11 | 11.10 | 22.33 |
| Publication bookkeeping | 2.58 | 2.52 | 7.10 |
| Queue requests / acknowledgement transactions | 1 / 1 | 1 / 1 | 2 / 2 |

The deterministic improvement is bounded queue/database round trips: twenty
messages use two queue requests and two acknowledgement transactions, with
one claim transaction. Local wall times vary with host/database conditions;
these samples do not establish production percentiles or throughput. Partial
failures keep the existing per-item backoff/recovery path. Claims remain
lease/token guarded, cancelled jobs cannot be resurrected, and queue calls
hold no database transaction. A timeout can leave an ambiguous successful send;
redelivery remains safe through the existing worker idempotency protocol.

After integrating #80 (`f8bb6c8`), the same five-sample fixture measures:

| Median milliseconds | 1 image | 5 images | 20 images |
| --- | ---: | ---: | ---: |
| Durable acceptance / handler response | 10.81 | 11.48 | 18.63 |
| Last mock SQS acknowledgement from start | 24.58 | 25.46 | 48.03 |
| Queue requests after acceptance | 1 | 1 | 2 |

The fixture explicitly drains the captured post-response callback after timing
the handler; it excludes Next.js lifecycle scheduling delay and real HTTP/SQS
transport. All fifteen requests assert zero queue sends before acceptance.

## Correlation and lifecycle interpretation

`http_request_completed` retains the request ID, route, method, status and total
duration. It now includes request start epoch milliseconds and a bounded
`timings` object with duration/count totals, including failed operations. Stage
aggregation uses the existing AsyncLocalStorage request context. It does not
log SQL, request bodies, filenames, cookies, tokens or signed URLs, and does
not emit a new per-image timing log.

Existing lifecycle records provide `processing_job_reserved`, `sqs_job_published`,
`job_received`, provider start/finish, S3 output persistence and terminal worker
outcome, correlated by request/batch/job ID. Database `createdAt`, `queuedAt`,
outbox `publishedAt`, attempts and terminal dates remain authoritative.
`WorkerMessage.enqueuedAt` is outbox creation, **not** actual SQS publication.
Use `sqs_job_published.timestamp` for successful send acknowledgement and
outbox `publishedAt` for subsequent durable bookkeeping. Neither is a claim
that a worker has already received the message. Browser-visible completion and
composition-specific timings require the later UI/worker slices.

## Deployment evidence and pending verification

- AWS CLI default session expired during read-only inspection. Actual queue,
  Lambda, S3 settings/regions and current 429s are not yet verified.
- No source-controlled Vercel region setting or linked project was found.
  Reported `bom1` is not deployment evidence; inspect the live function settings.
- Neon endpoint/pool/region is not verified. Never print connection strings.
- Before this slice, source templates defaulted to batch 5, timeout 120 s,
  memory 2048 MiB, maximum concurrency 10, worker lease 120 s and queue
  visibility 180 s. These were configuration risks, not assertions about AWS
  production.

The worker template now defaults the event source to one SQS record with no
batching window. The handler still retains partial-batch failure reporting for
explicitly configured larger batches. The queue template default visibility is
900 seconds, leaving a safety margin above the 120-second worker timeout and
the 120-second application claim lease. These are source-controlled defaults;
the deployed values and regions remain unverified until read-only AWS access is
restored. No concurrency increase was made: the existing maximum remains ten.

This choice is based on the audit's expensive independent image workload and
the worker's sequential record loop. A live A/B benchmark of event-source
batch size 1/window 0 versus the deployed setting is still required before
changing production parameters. Provider 429 telemetry and queue age alarms
remain the authority for tuning maximum concurrency.

## Public and shared-layout reads

The marketing page remains dynamically rendered for its personalized session
header, but its public plan catalog and enabled footer links now come from
dedicated tagged data-cache readers. Administrator edits invalidate those tags
after the database transaction succeeds with immediate Server Action tag
expiration, so public content stays current without querying the same two small tables on every request. The uncached
catalog reader remains the only reader used by billing and allowance logic.

The authenticated layout still authenticates first and redirects unauthenticated
requests exactly as before. After that check, its plan catalog, usage summary
and administrator authorization read are independent and run concurrently;
React request memoization continues to deduplicate the catalog read when the
usage service requests it too. No user-specific or authorization data is placed
in the cross-request cache.

Follow-up PRs: shared web client; rework #80 with race tests and after-response
measurements; batch outbox/SQS; upload concurrency/rendering; polling and local
UI reconciliation; worker throughput/lease alignment; public/summary reads.
Every slice requires its focused regressions and repository gates before merge.
