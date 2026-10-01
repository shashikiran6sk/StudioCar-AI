# Async failure matrix

| Fault boundary | Durable state | Recovery | Observed result / duplicate risk |
|---|---|---|---|
| Before job commit | No new batch | User retries with same idempotency key | Transaction late-insert rollback PASS in integration |
| After DB, before queue | CREATED + unpublished outbox | Claimed dispatcher backoff | Adapter/DB retry assertions PASS; live SQS blocked |
| After SQS ACK, before DB publication | Message exists, outbox claim may expire | Republish; worker retains early delivery | Publication-race integration PASS |
| Duplicate delivery / concurrent claim | One conditional claim | Busy delivery retried; terminal ignored | DB completion and 20-job duplicate assertions PASS |
| Provider refuses / 402 | Classified terminal failure | ACK after durable failure | Lifecycle integration PASS, no repeated mock charge |
| Provider 429 | RETRYING + due outbox | Honor bounded Retry-After | Lifecycle integration PASS |
| Provider succeeds, cutout staging fails | No durable cutout | Retry invokes provider again | **FAIL BUG-003: two successful calls over two attempts** |
| Provider succeeds, download/crash before staging | Outcome may be unknown/non-durable | No persisted generation reconciliation | Live exact crash/download boundary BLOCKED; duplicate-cost risk |
| Durable cutout, composition/output write fails | Cutout remains at deterministic key | Reuse staged cutout | Executor reuse/write-failure tests PASS at adapter boundary |
| Output saved, DB completion lost | Deterministic keys and staged cutout | Later leased attempt recomposes/completes | Exact injected DB failure after output BLOCKED |
| Completion committed, redelivery | COMPLETED + one output/usage | Ignore terminal | DB/unit assertions PASS |
| Final lease expires and queue stops delivery | PROCESSING + published outbox | Dispatcher has no pending row | **FAIL BUG-004: still PROCESSING after simulated 24 hours** |
| 20 jobs, two invalid | 18 COMPLETED + two FAILED | Successful outputs retained | Additional fixture PASS, 18 usage, 20 duplicates ignored |
| Plan expires before claim | Current subscription falls back FREE | Preview request from worker | Claim resolution integration; historical output access FAIL BUG-002 |
| Source removal races reservation | Removal/source locks | Reserved original cannot be deleted | Repository concurrency assertion PASS |

All PASS observations are local and scoped to the stated boundaries. Hard-killing Lambda, actual DLQ redrive, provider timeout billing, queue backlog, transport faults and full 20-image browser processing remain blocked. No fault was injected into production.
