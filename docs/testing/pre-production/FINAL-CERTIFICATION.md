# StudioCar-AI Production Certification

**Launch Gate: NO GO**

Release SHA: `dd835cad364493038b6c28cd0dd0434c5ded2781` (fetched main, unchanged application source).
Environment: isolated local certification, not a production/Vercel deployment.
Date: 2026-10-01T23:34:07.265944+05:30 — Asia/Calcutta. Machine evidence timestamps remain UTC.
Tester: Codex. Human verification: PENDING.

| Canonical accounting | Count |
|---|---:|
| Expected / parsed | 776 / 776 |
| Accounted | 776 |
| Missing / duplicates / unclassified | 0 / 0 / 0 |
| PASS | 130 |
| FAIL | 7 |
| BLOCKED | 637 |
| NOT_APPLICABLE | 2 |

Programmatic proof: `canonical-validation.json`; run `python3 docs/testing/pre-production/validate-registry.py`. Complete accounting does not mean complete execution or production verification.

Additional discovered: **18**; PASS5, FAIL9, BLOCKED4. Twelve architecture/security/async risks, six exploratory/API cases; all retained in `additional-results.json`. There are 794 classified scenario records overall, with 151 PASS/FAIL assessments (including source-only assessments and overlapping invariants), 641 BLOCKED and two N/A. This is not a claim that 794 scenarios executed successfully.

| Verification | Baseline / final evidence |
|---|---|
| Unit/component | 2,147 passed in 547 files plus one known expected failure (BUG-005) |
| Real PostgreSQL integration | 187 passed in 39 files |
| Browser | Baseline14/15; unchanged focused retest1/1; unchanged serial regression15/15 |
| Additional adversarial suite | Four FAIL, one PASS; valid ORIGINAL processing contract |
| Direct HTTP attacks | 27/27 scoped checks pass; no real provider/storage traffic |
| Quality gates | Lint/types/schema/migrations/status/build/dependency audit/package passed locally |
| Remote CI / deployed runtime | Unverified; GitHub API Forbidden and no isolated production configuration |

Binary subsystem gates below mean **release verification gates**, including incomplete/blocked verification. They do not claim an observed identity/admin exploit where none was found. Local passes and observed defects are stated separately.

| Gate | Status | Evidence / limitation |
|---|---|---|
| IDENTITY | FAIL | Real Google/MSG91 deployment unverified; local DB/browser linking/collision assertions pass. |
| ACCOUNT LINKING | FAIL | Full external collision/two-tab matrix unverified; no takeover established. |
| FREE ENTITLEMENT | FAIL | BUG-001/002: ORIGINAL resolution and historical HQ signatures. |
| PRO ENTITLEMENT | FAIL | HIGH tier requests verified locally; live image/output enforcement unverified. |
| PLUS ENTITLEMENT | FAIL | HIGH tier locally; live credit/quality workflow unverified. |
| UPLOAD | FAIL | Commit/validation assertions pass; real private upload/browser boundary blocked. |
| PROCESS SUBMISSION | FAIL | 20-image DB reservation passes; complete deployed workflow blocked. |
| DISPATCH | FAIL | Local outbox tests pass; deployed trusted scheduler/transport unverified. |
| SQS | FAIL | Live delivery/redrive/IAM blocked; stranded published job BUG-004. |
| LAMBDA | FAIL | Packaging passes; deployed invocation and runtime smoke unverified. |
| LEONARDO | FAIL | Adapter assertions pass; pre-staging duplicate calls BUG-003; live provider blocked. |
| S3 | FAIL | Template/design audit only; effective private bucket/signature enforcement unverified. |
| ASYNC FAILURE RECOVERY | FAIL | BUG-003/004 remain open; exact deployed faults blocked. |
| STUDIO GENERATION | FAIL | Original-source versions exist; processed-byte derivative scope unresolved; BUG-005. |
| ADMIN | FAIL | Local denial/manual-assignment browser tests pass; full deployed matrix unverified. |
| CROSS-USER SECURITY | FAIL | 27 local API attacks pass; complete output/signed-URL boundary remains blocked. |
| DATA INTEGRITY | FAIL | 187 real PostgreSQL tests pass; deployed reconciliation and retention unverified. |
| AWS INFRA | FAIL | BUG-006 source default margin; deployed resources/config/IAM unverified. |
| PRODUCTION CONFIG | FAIL | No production deployment/account/regions/versions supplied. |
| PERFORMANCE | FAIL | Local smoke only; no deployment/load/latency SLO verification. |
| AGENT UAT | FAIL | Local explorations and browser regressions done; complete funded workflow unavailable. |
| HUMAN UAT | PENDING | Owner checklist supplied; no human result assumed. |

Open P0: **2** — BUG-001 (FREE ORIGINAL full resolution), BUG-002 (cancelled paid historical HQ signing under requested FREE preview-only boundary). Open P1: **2** — BUG-003 (duplicate successful provider calls before staging), BUG-004 (published exhausted job remains PROCESSING without further delivery). Open P2: **5** — equivalent rendering version keys, queue visibility recommendation, browser timing sensitivity, marketing quota mismatch, generic 404. Open P3: **0**.

Outstanding product decisions: exact FREE output resolution/quality across all branches; historical HQ ownership versus current subscription; signed bearer URL reuse/revocation expectations; unknown provider outcome and allowed paid retry cost; DLQ reconciliation/operations; originals/processed/staged/orphan retention; original-source Studio versions versus processed-byte derivatives; manual subscription/credit expiration; public billing scope (checkout currently absent). Existing design promises retained downloads after limits, so the historical policy conflict is explicit and cannot be silently waived.

Production identity/callback/MSG91 origin settings, real S3/SQS/Lambda/Leonardo, effective IAM/account/region isolation, telemetry/alarm routing, load/device/accessibility and golden paths require an isolated deployed environment and a bounded funded test campaign. No destructive or chargeable live test was inferred safe from source configuration. No percentage, GO, or production certification is recommended.

All original failures and browser retests remain recorded. No code fixes, deployments, production resets, S3 deletes or queue purges were performed. Baseline stops here; any fix phase requires separate explicit user approval.
