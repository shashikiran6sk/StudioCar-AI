# Data integrity

Real PostgreSQL ran all committed migrations and 187 integration assertions: provider identity uniqueness, sessions/challenge consumption, OTP send/attempt limits, account/link collision refusal, user-scoped vehicle/image/jobs, batch reservations/quota, terminal output/usage transactions, tenant inventories/portfolio and migration/read-index behavior. Evidence: `evidence/integration.txt`, `evidence/migrate.txt`, `evidence/migration-status.txt`.

Batch late-insert failure rolled back job/outbox/vehicle/usage together. Duplicate deliveries complete once with a unique job output and immutable usage event. The additional 20-job fixture produced 18 outputs and 18 completion usage records with no duplicate charges on 20 redeliveries. Linking left subscriptions, vehicles and history with the same canonical user in repository tests.

The schema has independent user/vehicle/image foreign keys rather than composite tenant constraints; service/repository scoping therefore remains a critical invariant. Live corrupted-data/orphan-object reconciliation and production migration from a backed-up real dataset are not certified. BUG-004 leaves persisted job state nonterminal when transport has stopped retrying. Account/session fixture cleanup was confined to the disposable database.
