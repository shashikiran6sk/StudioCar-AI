# Archived pre-refactor evidence

This directory records the earlier PR #73 implementation and its baseline comparison. Subscription references are historical evidence, not current setup instructions. Current Plus-only setup and testing live in [the billing runbook](../../razorpay-billing.md).

# Razorpay PR #73 integration and baseline comparison

PR: [Implement Razorpay billing, subscriptions, credits, and receipts](https://github.com/shashikiran6sk/StudioCar-AI/pull/73). Tested code: `07f5fed`. Main: `dd835cad364493038b6c28cd0dd0434c5ded2781`; original PR: `ed26b28e52ba515dc25f495cfb92712dc2143bfa`. Date/counts/full tested SHA: [summary](evidence/summary.json), Asia/Calcutta.

**Branch integration and local repository gates pass. Production launch remains NO GO:** all four critical baseline reproductions remain FAIL, and real payments/deployed verification remain unverified. This comparison does not rerun or reclassify all 776 canonical scenarios. The original certification remains on `docs/production-certification-dd835cad`.

## Integration

Resolved seven conflicts in environment examples, instrumentation, processing/usage repositories, source-test mapping and environment tests. Preserved billing validation alongside monitoring, current Leonardo settings, tenant serialization, snapshot-safe FREE allowance accounting, bulk ordered job/outbox inserts and request IDs. Paid allocations/debits remain transactional and Pro-first; replay is verified not to debit or allocate again. Retained the PR's ₹1,999 Plus and ₹5,499/400-image Pro catalog.

Moved the startup test into active discovery. Reconciled the stale Pro limit and two provider-plan expectations with the PR catalog and main's shared plan resolver; manual mutations still refuse provider-owned subscriptions. Passed billing settings through Turborepo. No skips, compiler relaxations or timeout increases were introduced.

A new browser regression reproduced two integration failures: main's CSP blocked Checkout, and Next's shared script loading left Pro disabled because only the first loader received `onReady`. Exact Razorpay script/connect/frame origins and `onLoad` readiness repair these paths. Production eval and embedding restrictions remain asserted. Both Plus and Pro now open a synthetic hosted frame, submit the intended product/plan, verify a synthetic callback and show synthetic confirmation. **These financial browser responses are mocked**; real signature verification, payment/receipt effects and credit grants are covered separately by unit/PostgreSQL tests with mocked provider responses/events. No real payment is claimed.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Frozen dependency install | PASS, unchanged lockfile | Initial restricted-network attempt retried with network access |
| Forced repository unit/component + mapping | 2,188 PASS plus one existing expected failure | [Unit log](evidence/razorpay-unit.txt) |
| Real PostgreSQL integration | 192 PASS: 25 database-runtime +167 web, 42 files | [Final integration](evidence/razorpay-integration-retest.txt) |
| Final complete browser suite | 16/16 PASS, zero skipped/retried/flaky outcomes | [Log](evidence/razorpay-e2e-final.txt), [JSON](evidence/e2e-final-results.json) |
| Startup/security focus | 24/24 PASS | [Focused log](evidence/razorpay-security-startup.txt) |
| Lint / strict types / evidence types | PASS | [Lint](evidence/razorpay-final-lint.txt), [types](evidence/razorpay-final-types.txt), [evidence](evidence/razorpay-evidence-types.txt) |
| Final Checkout component checks | PASS after onLoad fix | [Unit](evidence/razorpay-checkout-unit.txt), [lint](evidence/razorpay-checkout-lint.txt) |
| Schema / fresh migration / status | PASS; 24 migrations | [Deploy](evidence/razorpay-migrate.txt), [status](evidence/razorpay-migration-status.txt) |
| Final production build | PASS | [Build](evidence/razorpay-build-checkout.txt) |
| Production dependency audit | PASS at configured threshold | [Audit](evidence/razorpay-audit.txt) |
| Lambda archive construction | PASS | [Package](evidence/razorpay-package.txt) |
| Prior critical defect suite | Four FAIL, one PASS | [Log](evidence/razorpay-prior-failures.txt), [JSON](evidence/prior-failures-results.json) |
| Real Razorpay / deployed AWS / identity / Leonardo | Unverified | No isolated deployed/merchant configuration or chargeable calls |
| Remote CI / arm64 runtime | See publication status when available | Local packaging does not establish deployed runtime readiness |

The final browser run invoked `pnpm e2e` through Turborepo, using system Chromium, one worker, no retries and the original 30-second budget. Its temporary config changes executable/report/output paths; assertions are preserved and extended. The original 15/16 full run failed on Pro's disabled button, and the earlier CSP reproduction failed before opening Plus. Both failures remain recorded. Initial integration had two stale provider-plan expectations; the full corrected rerun passed. Initial focused startup mocking was corrected to resolve the actual module path. A public inspection initially reached a stopped Playwright server, then succeeded on an explicitly started server. Final browser execution used a completed stable build; a follow-up build was initiated during the earlier failing run. These harness details do not create additional product failures.

## Earlier findings

| Finding | Updated branch | Observation and limitation |
|---|---|---|
| BUG-001 FREE ORIGINAL resolution | **Still FAIL** | Executor delivers 1920px from a 1920px source with configured preview320. Exact production FREE cap remains a decision. |
| BUG-002 cancelled subscription historical HQ | **Still FAIL under requested FREE boundary** | Real DB + portfolio: two HQ signing requests. Historical ownership conflicts with the older retained-download policy; actual S3 retrieval untested. |
| BUG-003 provider success before staging failure | **Still FAIL** | Injected first cutout PUT failure yields two successful mock calls across two attempts; no actual monetary charge measured. |
| BUG-004 exhausted abandoned published job | **Still FAIL** | Real DB/dispatcher: attempt5/5, after 24 simulated hours still PROCESSING; claims/publications zero. No real AWS redrive fault injected. |
| BUG-005 equivalent ORIGINAL keys | **Still semantic FAIL** | Existing `it.fails`: four keys for two expected renderings. Suite exit zero does not waive the defect. |
| BUG-006 visibility margin | **Same source risk** | Defaults unchanged: 900 seconds versus 6×180=1,080 guidance; effective AWS values unknown. |
| BUG-007 inventory timing | **Not reproduced in these runs** | Same test passed in 15.0s initially and 9.624s finally. Timing sensitivity is not proven fixed. |
| BUG-008 homepage FREE limit copy | **Still FAIL** | Anonymous browser: workflow3 versus pricing5; [inspection](evidence/public-inspection.json), [image](evidence/homepage.png). |
| BUG-009 missing custom 404 | **Still FAIL** | Anonymous browser: HTTP404 and generic Next text; [inspection](evidence/public-inspection.json), [image](evidence/not-found.png). |

The five-test comparator preserves the original fixtures and assertions, changing only its suite label/discovery path; [provenance](evidence/reproduction-provenance.json) records hashes. The four critical modules were unchanged by later Checkout fixes. The passing control produces 18 outputs/usage records from 20 jobs with two invalid sources and ignores all repeated terminal deliveries. Seven original canonical FAIL IDs concern five defects: PLAN-011/FREE-020, FREE-015, ASYNC-010, PUBLIC-005, PUBLIC-006/SEO-010. The stranded-job and other additional findings are tracked separately; complete live canonical coverage is still unavailable.

## Reproduction and boundaries

Use Node24, pnpm12.3.4, `APP_ENV=local`, synthetic Test billing settings and a **fresh disposable migrated database**. Reproduce the unresolved critical findings with:

```sh
pnpm exec vitest run --config docs/testing/razorpay-pr73/baseline.vitest.config.mts
```

Expected result: four failed assertions and one pass. This destructive fixture suite deletes only its own users; never run it against shared data. It remains outside existing production discovery to preserve unfixed baseline evidence without changing production assertions. Normal repository gates, browser config, public-inspection source and per-command timestamps/exit codes are recorded in [gates](evidence/gates.json).

The [billing overview](evidence/billing-overview.png) was compared with the Usage & Billing reference under `docs/screens/`: current catalog and added credit/history sections reflect this PR. [Synthetic Checkout confirmation](evidence/synthetic-checkout-confirmed.png) demonstrates controlled UI responses, not a real credited account.

Evidence excludes cookies, storage state, traces and Lambda ZIPs. Text trailing whitespace is normalized; fixture database passwords are redacted. No baseline defect fixes, real payments, production resets, queue purges, object deletions or chargeable image-provider calls were performed. Human, merchant and deployed verification remain outstanding.
