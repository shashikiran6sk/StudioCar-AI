# Baseline bug report

Target: `dd835cad364493038b6c28cd0dd0434c5ded2781`. Environment: isolated local Linux, PostgreSQL 17, mocked providers/storage, Chromium 151; source-only findings explicitly labelled. Nine findings: P0=2, P1=2, P2=5, P3=0. No fix phase or product-code edits. No cross-user takeover/admin bypass has been proven; unexecuted attacks remain BLOCKED.

## BUG-001 — FREE ORIGINAL processing delivers original-resolution output

Severity: **P0**. Canonical/additional IDs: PLAN-011, FREE-020, SEC-DISC-001.

Environment/commit: local certification / `dd835cad364493038b6c28cd0dd0434c5ded2781`. Tester: Codex.

Preconditions: Create a FREE/no-subscription job with background ORIGINAL, a 1920×1080 valid source and previewMaximumWidth=320.

Steps: Execute ProcessingJobExecutor; inspect output dimensions and provider calls.

Expected: FREE processed output is restricted to intended preview quality on every branch.

Actual: Output width 1920, provider calls 0. The ORIGINAL render→encoder branch never resolves quality tier. The test uses the existing preview width as a conservative cap, not a production agreed FREE dimension.

Source: workers/image-processing/src/execution/processing-job-executor.ts; render-original-photo.ts; encode-processed-image.ts

Evidence: evidence/adversarial-final.txt; evidence/security/adversarial-baseline.test.ts

API evidence: Local service/browser assertion where stated; no deployed API observation.

DB evidence: Real PostgreSQL for BUG-002/004; test transactions/counts in cited logs. Other findings use adapter/source/browser evidence.

AWS evidence: BLOCKED; no deployed mutation or effective-policy evidence.

Security/data/cost impact: FREE quality-boundary bypass. No provider spend for ORIGINAL, but paid image-quality differentiation can be bypassed.

Reproducibility/status: Runtime: reproduced twice. OPEN; no fix. Numeric FREE preview cap remains a product decision.

## BUG-002 — Cancelled paid subscription still receives historical HQ signatures

Severity: **P0**. Canonical/additional IDs: FREE-015, SEC-DISC-002.

Environment/commit: local certification / `dd835cad364493038b6c28cd0dd0434c5ded2781`. Tester: Codex.

Preconditions: Create PRO subscription, claim/complete one owned 1920×1080 output in real PostgreSQL, then set subscription CANCELLED.

Steps: Call the production PortfolioService + PrismaPortfolioRepository with a recording signer.

Expected: Under the supplied FREE-only-preview requirement, current FREE entitlement denies historical HQ signatures.

Actual: Two HQ signing calls (inline+download), width 1920. No entitlement query occurs in portfolio service/repository. This proves signing intent, not AWS object retrieval.

Source: apps/web/src/server/portfolio/portfolio-service.ts; portfolio-runtime.ts; db/repositories/portfolio-repository.ts

Evidence: evidence/adversarial-final.txt; evidence/security/adversarial-baseline.test.ts

API evidence: Local service/browser assertion where stated; no deployed API observation.

DB evidence: Real PostgreSQL for BUG-002/004; test transactions/counts in cited logs. Other findings use adapter/source/browser evidence.

AWS evidence: BLOCKED; no deployed mutation or effective-policy evidence.

Security/data/cost impact: Owned historical HQ entitlement bypass after downgrade/expiry. Existing design keeps downloads after limits: historical policy must be explicitly resolved before launch.

Reproducibility/status: Runtime: reproduced twice. OPEN; no fix. P0 against requested preview boundary; do not silently waive via older design docs.

## BUG-003 — Paid provider success before cutout staging can be charged again

Severity: **P1**. Canonical/additional IDs: ASYNC-010, LEONARDO-018, LEONARDO-DISC-001.

Environment/commit: local certification / `dd835cad364493038b6c28cd0dd0434c5ded2781`. Tester: Codex.

Preconditions: Use a valid studio source and a successful mocked provider. Fail the first private cutout PUT.

Steps: Execute attempt 1 (storage failure), clear injected fault, execute attempt 2.

Expected: Recover the provider success without repeating a successful paid call for the same logical job.

Actual: Two successful provider calls across two attempts; first cutout is not durable. Generation ID is not persisted for recovery before staging.

Source: workers/image-processing/src/execution/processing-job-executor.ts: obtainCutout; providers/leonardo-provider.ts

Evidence: evidence/adversarial-final.txt; evidence/security/adversarial-baseline.test.ts

API evidence: Local service/browser assertion where stated; no deployed API observation.

DB evidence: Real PostgreSQL for BUG-002/004; test transactions/counts in cited logs. Other findings use adapter/source/browser evidence.

AWS evidence: BLOCKED; no deployed mutation or effective-policy evidence.

Security/data/cost impact: Cost amplification: observed 2× successful mock calls, potentially up to the configured five attempt budget when staging repeatedly fails. Real monetary amounts are unknown. Process death/download uncertainty may have the same gap.

Reproducibility/status: Runtime: reproduced twice. OPEN; no fix. Bounded amplification is P1; uncontrolled live financial behavior is not proven.

## BUG-004 — Exhausted published job remains PROCESSING without another delivery

Severity: **P1**. Canonical/additional IDs: SQS-009, LAMBDA-020, ASYNC-DISC-002.

Environment/commit: local certification / `dd835cad364493038b6c28cd0dd0434c5ded2781`. Tester: Codex.

Preconditions: Create published job, set attempt count 4/5, claim final attempt then simulate crash and no remaining source-queue deliveries.

Steps: Advance clock 24 hours after lease; call the real ProcessingOutboxDispatcher on that job.

Expected: Recover or terminally fail exhausted abandoned job; user sees actionable failure, not indefinite processing.

Actual: Job attempt count 5, status PROCESSING; dispatcher claimed=0, failed=0, published=0. Only another worker delivery checks expired final lease.

Source: packages/database-runtime/src/repositories/processing-worker-repository.ts; apps/web/src/server/db/repositories/processing-outbox-repository.ts; packages/processing/src/processing-outbox-dispatcher.ts

Evidence: evidence/adversarial-final.txt; evidence/security/adversarial-baseline.test.ts

API evidence: Local service/browser assertion where stated; no deployed API observation.

DB evidence: Real PostgreSQL for BUG-002/004; test transactions/counts in cited logs. Other findings use adapter/source/browser evidence.

AWS evidence: BLOCKED; no deployed mutation or effective-policy evidence.

Security/data/cost impact: Stuck job / vehicle and reserved quota; DLQ/manual recovery operational dependency. Test simulates exhausted deliveries, not real AWS redrive.

Reproducibility/status: Runtime DB/dispatcher reproduction twice. OPEN; no fix; live DLQ behavior BLOCKED.

## BUG-005 — ORIGINAL floor option creates distinct versions of equivalent renderings

Severity: **P2**. Canonical/additional IDs: OPTIONS-005, STUDIO-018, DATA-DISC-001.

Environment/commit: local certification / `dd835cad364493038b6c28cd0dd0434c5ded2781`. Tester: Codex.

Preconditions: Run treatment matrix key tests with studio background disabled.

Steps: Compare unlabelled version keys for equivalent ORIGINAL renderings whose floor differs.

Expected: Two unique renderings yield two keys.

Actual: Four keys; floor remains in canonical options although original-photo renderer ignores it. Existing it.fails assertion expects two.

Source: tests/unit/processing/studio-treatment-matrix-keys.test.ts; packages/processing/src/canonical-processing-options.ts

Evidence: evidence/unit.txt; tests/unit/processing/studio-treatment-matrix-keys.test.ts

API evidence: Local service/browser assertion where stated; no deployed API observation.

DB evidence: Real PostgreSQL for BUG-002/004; test transactions/counts in cited logs. Other findings use adapter/source/browser evidence.

AWS evidence: BLOCKED; no deployed mutation or effective-policy evidence.

Security/data/cost impact: Duplicate version grouping; possible unnecessary reprocessing when options imply a false meaningful difference. Extra charge is not measured.

Reproducibility/status: Known expected failure reproduced by baseline suite. OPEN; suite exit 0 does not make behavior PASS.

## BUG-006 — Default SQS visibility is below AWS recommended retry margin

Severity: **P2**. Canonical/additional IDs: AWS-005, AWS-DISC-001.

Environment/commit: local certification / `dd835cad364493038b6c28cd0dd0434c5ded2781`. Tester: Codex.

Preconditions: Inspect queue visibility default 900 s and Lambda timeout default 180 s; batching window default 0.

Steps: Compare to AWS Lambda SQS guidance: visibility at least six times function timeout plus batch window.

Expected: Default visibility >=1080 s (plus configured batching window).

Actual: 900 <1080. Existing infrastructure test only verifies visibility >timeout. No deployed values known.

Source: infrastructure/aws/image-processing-queue.yml; infrastructure/aws/image-processing-worker.yml; tests/unit/server/infrastructure-worker-template.test.ts

Evidence: PRE-EXECUTION-AUDIT.md; AWS-INFRA-QA.md

API evidence: Local service/browser assertion where stated; no deployed API observation.

DB evidence: Real PostgreSQL for BUG-002/004; test transactions/counts in cited logs. Other findings use adapter/source/browser evidence.

AWS evidence: BLOCKED; no deployed mutation or effective-policy evidence.

Security/data/cost impact: Greater redelivery/throttle/exhaustion risk under load. Conditional DB claim guards reduce duplicate execution; a live incident is not established.

Reproducibility/status: Source parameter comparison, not live AWS failure. OPEN; no template change.

## BUG-007 — Broad inventory browser test is sensitive to default 30-second budget

Severity: **P2**. Canonical/additional IDs: BROWSER-011, UI-DISC-001.

Environment/commit: local certification / `dd835cad364493038b6c28cd0dd0434c5ded2781`. Tester: Codex.

Preconditions: Run baseline browser suite with two workers while unit load is running, system Chromium and isolated local PostgreSQL.

Steps: Run inventory.spec.ts full scenario; navigate to mobile portfolio near end.

Expected: Complete within default test budget or isolate meaningful subflows so regression remains reliable.

Actual: Initial 30 s timeout at page.goto mobile portfolio; unchanged isolated retest 18.9 s; full serial regression 12.2 s for this test and 15/15 suite.

Source: tests/e2e/inventory.spec.ts:570; apps/web/playwright.config.ts

Evidence: evidence/e2e-first.txt; evidence/e2e-inventory-retest.txt; evidence/e2e-regression.txt

API evidence: Local service/browser assertion where stated; no deployed API observation.

DB evidence: Real PostgreSQL for BUG-002/004; test transactions/counts in cited logs. Other findings use adapter/source/browser evidence.

AWS evidence: BLOCKED; no deployed mutation or effective-policy evidence.

Security/data/cost impact: Test reliability/timing sensitivity. No deterministic application workflow defect is proven; investigate CI contention rather than repair product silently.

Reproducibility/status: Baseline FAIL retained. Retests PASS without source changes. OPEN test-reliability finding.

## BUG-008 — Homepage workflow advertises obsolete FREE batch limit

Severity: **P2**. Canonical/additional IDs: PUBLIC-005, UI-DISC-003.

Environment/commit: local certification / `dd835cad364493038b6c28cd0dd0434c5ded2781`. Tester: Codex.

Preconditions: Open homepage with default plan catalog in desktop/tablet/mobile.

Steps: Compare workflow Upload photos note with pricing Free card and backend FREE plan.

Expected: Public limit copy agrees with the configured backend and pricing.

Actual: Workflow says Free: 3 images; pricing/backend say maximum 5 images per batch. Screenshot and source show static legacy text.

Source: apps/web/src/features/marketing/marketing.constants.ts:123; apps/web/src/server/plans/default-plan-configurations.ts

Evidence: evidence/mobile/exploratory-home.png; evidence/studiocar-exploration-3.json

API evidence: Local service/browser assertion where stated; no deployed API observation.

DB evidence: Real PostgreSQL for BUG-002/004; test transactions/counts in cited logs. Other findings use adapter/source/browser evidence.

AWS evidence: BLOCKED; no deployed mutation or effective-policy evidence.

Security/data/cost impact: Misleading public product limit; hard-coded second source conflicts with authoritative PlanConfig.

Reproducibility/status: Visual/source/browser reproduction. OPEN; no baseline repair.

## BUG-009 — Invalid routes use generic Next.js 404

Severity: **P2**. Canonical/additional IDs: PUBLIC-006, SEO-010, UI-DISC-004.

Environment/commit: anonymous local Chromium / `dd835cad364493038b6c28cd0dd0434c5ded2781`. Tester: Codex.

Preconditions: Open the built application anonymously.

Steps: Navigate to `/no-such-certification-route`; inspect response and rendered body; search App Router for not-found implementation.

Expected: StudioCar branded custom 404 with useful recovery navigation.

Actual: HTTP 404 with only `404 / This page could not be found.` No custom not-found file is present.

Evidence: `evidence/studiocar-exploration-3.json`; App Router file audit. API evidence: local HTTP 404. DB/AWS evidence: not applicable to this public route check.

Security/data/cost impact: Missing expected public error experience and recovery navigation; no authentication bypass or private-data exposure demonstrated.

Reproducibility/status: Repeated browser navigation and source audit. OPEN; no baseline repair.
