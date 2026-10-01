# AWS infrastructure QA

| Resource | Repository defaults | Verification |
|---|---|---|
| S3 | Private, encryption, public access blocked, TLS enforced, browser CORS parameters | Template audit only; deployed account/region/IAM/CORS BLOCKED |
| SQS | Standard, SSE enabled, visibility 900 s, retention 14 d, DLQ receive count 5 | Template/adapter tests; live delivery/redrive BLOCKED |
| Lambda | Node 24, arm64, 2048 MB, 180 s, batch 1, partial failure response | Build and packaging PASS; deployed invocation BLOCKED |
| Throughput | Mapping max concurrency 10; optional reserved concurrency | Parameter audit only; load/DB pooling unverified |
| Artifact | Immutable S3 key, arm64 Sharp plus six backgrounds | 18,124,390-byte ZIP, 35,074,700 uncompressed, 120 files; manifest in evidence |
| Observability | Queue depth/age/DLQ alarms; worker duration/failure alarms; optional SNS target | Live CloudWatch/alert routing BLOCKED |
| Dispatch schedule | Trusted HTTP internal endpoint at least once/minute | No EventBridge/trusted HTTP scheduler resource provisioned in shipped templates |

BUG-006: default visibility 900 seconds exceeds 180-second timeout but is below AWS's recommended sixfold bound of 1080 seconds (plus batch window). Infrastructure unit tests assert only visibility > timeout. Parameter combinations can reduce this margin further; no deployed misconfiguration is claimed. Lease defaults equal timeout, and provider deadline defaults 90 seconds; multi-record changes must account for sequential work/decode/storage/DB.

AWS IAM scopes are parameter-selected bucket/queue resources and logging/metrics rights. Effective roles/account/resource identity were unavailable, so no least-privilege PASS is claimed. Queue names default to a base without automatic environment suffix; deployment must supply isolated names. arm64 runtime smoke needs QEMU/Lambda image; archive construction alone is not runtime execution.
