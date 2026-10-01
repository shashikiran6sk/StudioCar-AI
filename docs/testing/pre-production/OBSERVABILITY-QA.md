# Observability QA

Request monitoring emits request ID, HTTP status/duration and stage timings; job/outbox preserves request/batch/job correlation. Worker handler supplies queue message, attempt and provider context. Failure codes separate provider/network/storage/source/composition reasons. CloudWatch operational event tests and schema/log sanitizer tests run locally; Sentry is optional and Next instrumentation captures unexpected errors.

The lifecycle integration validates sanitized telemetry and absence of synthetic provider key/signature/result token in persisted/logged data. Evidence contains only synthetic job/user IDs. Unit test runner assertion names are not application production logs. No real signed URLs, opaque sessions, OAuth codes, raw OTPs or secrets are committed. Browser traces and storageState are kept out of repository evidence.

Live AWS metrics, log retention/access, deployed request→provider→S3 correlation, Sentry 5xx delivery and actual SNS/page notifications are BLOCKED. BUG-004's user-visible stale PROCESSING state is not resolved by an alarm alone. A functioning dashboard template does not establish operational readiness or an on-call response path.
