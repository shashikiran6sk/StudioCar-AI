# Test coverage matrix

Counts are local/scoped observations, not deployed production claims. Every scenario remains in the canonical registry, including two unsupported unlink operations. Missing/unclassified=0.

| Category | Total | PASS | FAIL | BLOCKED | N/A |
|---|---:|---:|---:|---:|---:|
| PUBLIC APPLICATION | 15 | 7 | 2 | 6 | 0 |
| GOOGLE AUTHENTICATION | 18 | 6 | 0 | 12 | 0 |
| PHONE OTP AUTHENTICATION | 22 | 10 | 0 | 12 | 0 |
| PHONE-FIRST ACCOUNT CREATION | 15 | 9 | 0 | 6 | 0 |
| GOOGLE-FIRST PHONE LINKING | 18 | 12 | 0 | 6 | 0 |
| PHONE-FIRST GOOGLE LINKING | 18 | 11 | 0 | 7 | 0 |
| IDENTITY COLLISION / ACCOUNT LINKING | 18 | 5 | 0 | 11 | 2 |
| PROFILE | 12 | 7 | 0 | 5 | 0 |
| PLANS / ENTITLEMENTS | 24 | 2 | 1 | 21 | 0 |
| ADMIN SUBSCRIPTION MANAGEMENT | 14 | 1 | 0 | 13 | 0 |
| VEHICLE / INVENTORY | 20 | 0 | 0 | 20 | 0 |
| UPLOAD | 30 | 3 | 0 | 27 | 0 |
| PROCESSING DIALOG / OPTIONS | 18 | 0 | 0 | 18 | 0 |
| PROCESS REQUEST | 28 | 6 | 0 | 22 | 0 |
| OUTBOX / DISPATCH | 20 | 7 | 0 | 13 | 0 |
| SQS | 18 | 0 | 0 | 18 | 0 |
| LAMBDA WORKER | 30 | 1 | 0 | 29 | 0 |
| LEONARDO PROVIDER | 24 | 0 | 0 | 24 | 0 |
| OUTPUT S3 | 20 | 0 | 0 | 20 | 0 |
| JOB STATE / DATABASE | 22 | 5 | 0 | 17 | 0 |
| FRONTEND PROCESSING UPDATE | 20 | 0 | 0 | 20 | 0 |
| FREE PLAN OUTPUT SECURITY | 20 | 0 | 2 | 18 | 0 |
| PRO PLAN | 14 | 0 | 0 | 14 | 0 |
| PLUS PLAN | 14 | 0 | 0 | 14 | 0 |
| STUDIO IMAGE FROM EXISTING PROCESSED IMAGE | 24 | 0 | 0 | 24 | 0 |
| DELETE / CLEANUP | 22 | 0 | 0 | 22 | 0 |
| ADMIN | 18 | 3 | 0 | 15 | 0 |
| CROSS-USER SECURITY | 20 | 6 | 0 | 14 | 0 |
| MASS ASSIGNMENT / API SECURITY | 22 | 14 | 0 | 8 | 0 |
| ASYNC FAILURE MATRIX | 26 | 3 | 1 | 22 | 0 |
| CONCURRENCY | 18 | 3 | 0 | 15 | 0 |
| DATA INTEGRITY | 20 | 3 | 0 | 17 | 0 |
| PRODUCTION CONFIGURATION | 20 | 0 | 0 | 20 | 0 |
| AWS INFRASTRUCTURE | 22 | 0 | 0 | 22 | 0 |
| OBSERVABILITY | 18 | 0 | 0 | 18 | 0 |
| PERFORMANCE | 16 | 0 | 0 | 16 | 0 |
| BROWSER / RESPONSIVE | 18 | 1 | 0 | 17 | 0 |
| ACCESSIBILITY / UX | 16 | 0 | 0 | 16 | 0 |
| SEO / PUBLIC | 10 | 5 | 1 | 4 | 0 |
| GOLDEN PATHS | 14 | 0 | 0 | 14 | 0 |

Blocked boundaries include real external Google/MSG91, signed S3 enforcement, AWS effective configuration/queue/Lambda/DLQ, funded Leonardo/model output and cost/crash behavior, production configuration/observability/load, multi-engine/device accessibility and complete golden paths. Exact local scenarios without complete evidence also remain blocked; adjacent tests are not substitute evidence.

Additional cases are listed in TEST-RESULTS and additional-results.json. Suite assertion count exceeds the canonical count because one canonical scenario can require multiple checks and one fixture can exercise several invariants. No readiness percentage is given.
