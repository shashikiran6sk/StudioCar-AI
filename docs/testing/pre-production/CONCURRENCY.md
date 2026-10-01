# Concurrency

Executed against real DB: concurrent duplicate worker claims/completion, final-vehicle completion advisory lock, same link race, phone-account replay, quota reservation across multiple vehicles, differently keyed batch race, and upload removal vs reservation. The 20-job concurrent fixture plus duplicate deliveries ended at 18 successful output/usage records, two failures and PARTIALLY_FAILED.

The actual controls are conditional worker updates and attempt/worker fencing, phone and user/vehicle advisory locks, unique idempotency keys, transaction rollback and outbox claims/TTL. Adapter calls happen outside the job transaction; provider billing is not atomically fenced with DB (BUG-003). No heartbeat extends a worker lease during the provider exchange.

Exact multi-tab linking/login, admin change vs reservation, upgrade/downgrade at completion, profile mutation during linking, vehicle deletion races, and production contention remain BLOCKED. A database assertion for concurrent calls is not evidence of every two-tab browser schedule. Configured Lambda timeout and lease both default 180 seconds; unusual parameter changes require overlap/cost testing.
