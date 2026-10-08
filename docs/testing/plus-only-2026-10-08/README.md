# Plus-only billing verification — 8 October 2026

Tested source: [`b179a02886ebf44dd63713608082083d341182de`](https://github.com/shashikiran6sk/StudioCar-AI/commit/b179a02886ebf44dd63713608082083d341182de), [implementation PR #73](https://github.com/shashikiran6sk/StudioCar-AI/pull/73). [Machine-readable summary](summary.json). This evidence records the existing verification; creating the archive did not rerun these tests or perform a payment.

| Check | Recorded result | Evidence |
| --- | --- | --- |
| Lint / strict types / source mapping | PASS | [lint](logs/studiocar-plus-lint-final.txt), [types](logs/studiocar-plus-typecheck-final.txt), [mapping](logs/studiocar-plus-mapping-final.txt) |
| Unit/component suites | 2,130 passes plus one existing expected-failure test | [initial forced root run](logs/studiocar-plus-unit.txt), [root retest](logs/studiocar-plus-unit-final.txt), [final web suite](logs/studiocar-plus-unit-web-final.txt) |
| Real PostgreSQL integration | 165 passes | [final integration](logs/studiocar-plus-integration-final.txt) |
| Prisma validation / migration chain | PASS; 29 migrations | [validation](logs/studiocar-plus-schema.txt), [deploy](logs/studiocar-plus-migrate.txt), [status](logs/studiocar-plus-migration-status.txt) |
| Expanded legacy-schema compatibility | 12 integration passes before contraction | [expansion](logs/studiocar-plus-expand-deploy.txt), [compatibility](logs/studiocar-plus-expanded-compatibility.txt) |
| Staged contraction with existing synthetic Free user | PASS | [contraction](logs/studiocar-plus-contract-deploy.txt), [final status](logs/studiocar-plus-rollout-status.txt), [staging regression](logs/studiocar-plus-expand-test.txt) |
| Production web build | PASS, normal Turbopack | [final build](logs/studiocar-plus-build-final.txt) |
| Complete browser suite | 16/16; one worker, no retries, original timeout | [final browser log](logs/studiocar-plus-e2e-final.txt), [sanitized configuration](playwright-run-config.txt), [screenshots](screenshots/) |
| Worker Lambda packaging | PASS | [package log](logs/studiocar-plus-worker-package.txt) |
| Production dependency audit | No known vulnerabilities at verification time | [audit retest](logs/studiocar-plus-audit-retry.txt) |
| Remote source CI | Required jobs and Vercel passed; main-only publishing skipped | [watch log](logs/studiocar-plus-ci-watch.txt), [Actions run](https://github.com/shashikiran6sk/StudioCar-AI/actions/runs/37741815840) |

Repeated logs are separate runs and must not be summed. The root retest precedes the final migration-staging regression: web increases from 1,225 to 1,226 in the final web suite, producing the stated aggregate 2,130. Initial failures and intermediate runs remain under [logs](logs/) for context.

The initial browser run inherited private Development queue settings. A later parallel run reproduced the existing inventory-search timeout under resource contention. The final complete run explicitly used Local SQS settings and one worker, without retrying or extending test timeouts. The [optional schema-drift comparison](logs/studiocar-plus-schema-drift.txt) records three pre-existing non-billing UUID-default differences; it is not a clean-drift claim.

The screenshots contain synthetic test accounts and mocked Razorpay Checkout callbacks. The paid lifecycle checks include [reservation/settlement coverage](logs/studiocar-plus-paid-lifecycle.txt); capture and replay cases are part of the real PostgreSQL suite with mocked Razorpay events. No Test/Live merchant payment or production-data migration was performed. Follow the [implementation runbook](https://github.com/shashikiran6sk/StudioCar-AI/blob/feat/razorpay-billing/docs/razorpay-billing.md) for merchant testing and deployment.

[Back to the archive index](../README.md). **Evidence-only draft; DO NOT MERGE.**
