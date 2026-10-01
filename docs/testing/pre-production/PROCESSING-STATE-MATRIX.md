# Processing state matrix

Actual job states: CREATED, QUEUED, PROCESSING, RETRYING, COMPLETED, FAILED, CANCELLED. Image states: PENDING_UPLOAD, UPLOADED, INVALID, DELETED. Vehicle states: DRAFT, UPLOADING, PROCESSING, READY, PARTIALLY_FAILED, ARCHIVED.

| From | Trigger | To | Guard / durable effect | Evidence |
|---|---|---|---|---|
| none | Reserve batch | CREATED | Tenant/asset/quota/idempotency; jobs + outbox + batch usage transaction | integration processing-job-repository |
| CREATED/RETRYING | Outbox SQS ACK recorded | QUEUED | Current claim token; publication + queued state atomically | processing-outbox-repository |
| QUEUED | Conditional worker claim | PROCESSING | Increment attempt; lease + worker token; attempt record | processing-worker-repository |
| PROCESSING | Expired claim and later delivery | PROCESSING | Conditional reacquire; previous attempt fails | worker repository; no independent sweep |
| PROCESSING | Successful output | COMPLETED | Matching worker/attempt; ProcessedAsset + usage event atomic | duplicate completion integration |
| PROCESSING | Retryable failure with budget | RETRYING | Persist due time and new outbox intent before ACK | worker lifecycle integration |
| PROCESSING | Permanent failure / exhausted on later delivery | FAILED | Error sanitized; invalid/non-car source may become INVALID | lifecycle/worker integration |
| COMPLETED/FAILED/CANCELLED | Redelivery | unchanged | Terminal claim ignored; no new provider call or usage | integration + 20-job adversarial |
| Published PROCESSING | Lease expired, no more deliveries | **stuck PROCESSING** | Dispatcher scans pending outbox only | BUG-004 |

CANCELLED is represented in schema/contracts but there is no public cancellation operation. A complete attempted-illegal-transition enumeration was not executed; JOB-007/008 stay BLOCKED. Concurrent final completions use the vehicle advisory lock to derive READY/PARTIALLY_FAILED once. The 20-job synthetic fixture derived PARTIALLY_FAILED with 18 outputs and two failures; it does not certify SQS delivery or image quality.
