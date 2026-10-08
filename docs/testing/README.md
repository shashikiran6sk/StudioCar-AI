# Testing evidence archive — DO NOT MERGE

This is the permanent reference index for `testing_branch`. Its pull request is **draft, evidence-only and must never be merged**. Do not mark it ready for review, merge it, or deploy it. Application code inherited from `main` is only the branch baseline; it is not the code certified by these artifacts.

The production implementation remains [PR #73](https://github.com/shashikiran6sk/StudioCar-AI/pull/73). Active automated tests, deployment instructions and the [Plus-only billing runbook](https://github.com/shashikiran6sk/StudioCar-AI/blob/feat/razorpay-billing/docs/razorpay-billing.md) remain with that implementation. This branch archives all evidence added by the billing PR and the available local Plus-only verification artifacts. Existing design references and unrelated image-processing evidence already on `main` retain their original locations.

## Evidence sets

| Set | Tested source | What it establishes |
| --- | --- | --- |
| [Plus-only refactor, 8 October 2026](plus-only-2026-10-08/README.md) | [`b179a02886ebf44dd63713608082083d341182de`](https://github.com/shashikiran6sk/StudioCar-AI/commit/b179a02886ebf44dd63713608082083d341182de) | Local quality gates, transactional billing coverage, staged migration rehearsal and synthetic browser flows |
| [Historical PR #73 comparison, 2 October 2026](razorpay-pr73/README.md) | `07f5fedafe2e00b9edd03b515b4d98229a2098dd` | Earlier Plus/Pro implementation, original failures and corrected retests; superseded by the Plus-only refactor |

[The SHA-256 manifest](manifest.json) covers 122 artifacts: 46 original historical files preserved byte for byte, 37 Plus-only command logs, 37 browser screenshots, a sanitized browser-run configuration and the new summary. The index/README files added for navigation are not counted as execution evidence. Earlier failures remain available alongside final passing runs.

## Interpretation and reproduction

- Checkout browser screenshots use synthetic API/provider responses. They do not prove that a real Razorpay payment was captured or that a live account received credits.
- PostgreSQL integration checks use disposable local databases and mocked external adapters. They exercise real database transactions, uniqueness, reservations and replay behavior.
- Source CI passed for `b179a02`: [GitHub Actions run](https://github.com/shashikiran6sk/StudioCar-AI/actions/runs/37741815840). CI on this archive branch checks its inherited `main` baseline, not the billing source commit. Do not substitute it for source verification.
- Historical Pro/subscription references describe an obsolete tested version. The historical README's relative billing-runbook link refers to its original implementation checkout; use the current runbook linked above.
- To reproduce an archived run, use a separate checkout of its exact tested source commit with Node 24, pnpm 12.3.4 and a fresh disposable database. Historical diagnostic fixtures must be copied to their original path in that checkout before using the archived configuration. Never run fixtures against shared or production data.
- Real merchant Test/Live payments, deployed AWS checks and the recorded unrelated processing findings remain unverified or unresolved as stated in their source reports. Passing repository gates do not waive these limits.

## Publication boundaries

Logs have local repository paths normalized, credential-bearing URL passwords redacted and terminal color escapes removed. The browser configuration redacts synthetic provider and queue fixture values. Historical artifacts retain their previous sanitization. Environment files, cookies, browser storage state, traces, private credentials, application build outputs and Lambda ZIPs are excluded.

This PR is a reference document and archive. **DO NOT MERGE.**
