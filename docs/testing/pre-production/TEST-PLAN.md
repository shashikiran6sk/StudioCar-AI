# Baseline test plan

Certification target: exact main SHA `dd835cad364493038b6c28cd0dd0434c5ded2781`. Read `PRE-EXECUTION-AUDIT.md` for the pre-execution 36-point report. No application fixes are included.

| Stage | Method | Safety boundary |
|---|---|---|
| Architecture, identity, plans, storage, worker, infrastructure | Trace routes→services→repositories→adapters; inspect schema, migrations and templates | Source read only |
| Canonical inventory | Parse 40 ranges and 776 scenario numbers; assign stable IDs | Preserve every scenario including obsolete ones |
| Quality gates | pnpm 12.3.4, schema/mapping/lint/types/unit/build/package/security audit | No secrets or paid calls |
| Database integration | New PostgreSQL 17 database on loopback port 55432; committed migrations | Dedicated disposable database only |
| Async adversity | Inject provider-success/staging failure, downgrade, FREE ORIGINAL; expired final claim; 20 mixed terminal jobs | Real PostgreSQL; synthetic adapter outputs and in-memory private storage |
| Browser baseline | Existing nine Playwright files using system Chromium 151 | Fake local OTP, synthetic sessions, intercepted image reads |
| Exploratory browser | Resize/scroll/navigation/fake sign-in/link/invalid inputs/cancel/refresh; inspect screenshots | Same disposable DB, APP_ENV=local |
| Production dependencies | Google/MSG91/AWS/Leonardo, Vercel and region/resource isolation | BLOCKED; deployment/credentials/cost budget unavailable |
| Reports | Results per canonical ID, matrices, defects, retest, owner checklist, gate | Human verification remains PENDING |

Run tests against a migrated **disposable** `DATABASE_URL` with `APP_ENV=local`. Do not reuse a developer/shared/production database: existing integration and browser fixtures intentionally delete synthetic rows and temporarily edit shared PlanConfig. External provider traffic is mocked at adapter boundaries. Restore browser test configuration after the run; the temporary Chromium harness does not alter application code.

Retests address the inventory timeout and validate the added recovery reproduction. Original failing evidence is retained. No fix phase, production mutations, queue purges or chargeable provider tests were undertaken.
