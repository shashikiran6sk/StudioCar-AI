# Failure recovery

Outbox rows preserve dispatch intent across request/queue failures. Failed publication releases a claimed row with exponential bounded retry; worker retries commit a fresh due outbox before acknowledging delivery. After a cutout is durable, executor retries reuse it and deterministic output keys. Final usage and output commit together, and terminal deliveries are ignored.

Recovery gaps are demonstrated in BUG-003 and BUG-004. A successful paid call before durable cutout can be paid twice on retry. A published PROCESSING job whose last invocation crashes is not terminally reconciled by scheduled dispatch without another source-queue delivery. Existing README manual `aws sqs` recovery is an operator procedure, not an automatic DB→DLQ state transition. The reproduction simulates no remaining deliveries and invokes the real DB dispatcher after 24 hours; live SQS parking was not performed.

Before launch, define unknown-provider-outcome policy, durable reconciliation, DLQ→job state handling and a monitored recovery schedule. Do not redrive a funded provider job repeatedly without cost bounds. This baseline proposes no code patch and leaves original failures intact.
