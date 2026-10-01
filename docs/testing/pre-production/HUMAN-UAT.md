# Product-owner human UAT

Human verification is **PENDING** for every item. Execute in an isolated development deployment, using provider-approved synthetic identities and test-only private storage. Do not enter credentials in this document. Local fake/adaptor PASS is narrower than real end-to-end verification. All P0/P1 items and agreed launch-scope product rules must be resolved before GO.

## HUMAN-UAT-001 — Google sign-in

Mapped canonical IDs: GOOGLE-001 GOOGLE-002 GOOGLE-003 GOOGLE-004. Priority: P1.

Prerequisites/setup: FREE-GOOGLE; isolated deployed Google callback and registered test account

Exact browser/operator steps: Open homepage → Log in → Continue with Google → choose test identity → return to Dashboard. Log out and repeat.

Expected UI: Same canonical account, correct FREE plan; no duplicate identity/user.

Expected backend: Preserve canonical identity, tenant ownership, job/output relationship and immutable usage; inspect sanitized API/DB/AWS evidence for these mapped IDs.

Agent result: BLOCKED: real Google provider unavailable; fake local sign-in and DB resolution tested.

Human verification: **PENDING**

- [ ] PASS
- [ ] FAIL

Notes/evidence/issue IDs: ____________________

## HUMAN-UAT-002 — Phone sign-in and account creation

Mapped canonical IDs: PHONE-003 PHONE-004 PHONE-CREATE-001 PHONE-CREATE-004 PHONE-CREATE-015. Priority: P1.

Prerequisites/setup: New safe provider-approved test number, FREE-PHONE; MSG91 origin allow-list

Exact browser/operator steps: Log in → enter phone → request OTP → enter wrong code once → enter valid delivered code → choose Create new account → enter name → Dashboard. Log out and repeat phone OTP.

Expected UI: Wrong code rejected; one named account; second login resolves same user.

Expected backend: Preserve canonical identity, tenant ownership, job/output relationship and immutable usage; inspect sanitized API/DB/AWS evidence for these mapped IDs.

Agent result: Local fake browser PASS; real MSG91 BLOCKED.

Human verification: **PENDING**

- [ ] PASS
- [ ] FAIL

Notes/evidence/issue IDs: ____________________

## HUMAN-UAT-003 — Google account links phone

Mapped canonical IDs: LINK-PHONE-003 LINK-PHONE-008 LINK-PHONE-009 IDENTITY-009. Priority: P0.

Prerequisites/setup: FREE-GOOGLE with inventory/history and unowned safe test phone

Exact browser/operator steps: Google sign-in → Profile → Connect phone → request code → verify → confirm Connected. Log out → phone OTP login → open same Inventory.

Expected UI: Same user, subscription, vehicles and job history; no duplicate account.

Expected backend: Preserve canonical identity, tenant ownership, job/output relationship and immutable usage; inspect sanitized API/DB/AWS evidence for these mapped IDs.

Agent result: Local fake linking and phone relogin PASS; real provider BLOCKED.

Human verification: **PENDING**

- [ ] PASS
- [ ] FAIL

Notes/evidence/issue IDs: ____________________

## HUMAN-UAT-004 — Phone account links Google

Mapped canonical IDs: LINK-GOOGLE-002 LINK-GOOGLE-004 LINK-GOOGLE-005 LINK-GOOGLE-016. Priority: P0.

Prerequisites/setup: FREE-PHONE with unowned Google test identity and one vehicle

Exact browser/operator steps: Phone login → Profile → Connect Google → consent → Profile shows Connected. Log out → Google login → Inventory → log out → phone login again.

Expected UI: Both methods return same account and data; subscription/history unchanged.

Expected backend: Preserve canonical identity, tenant ownership, job/output relationship and immutable usage; inspect sanitized API/DB/AWS evidence for these mapped IDs.

Agent result: DB integration and local fake-provider link verified where evidence captured; full real identity sequence BLOCKED.

Human verification: **PENDING**

- [ ] PASS
- [ ] FAIL

Notes/evidence/issue IDs: ____________________

## HUMAN-UAT-005 — Identity collision refusal

Mapped canonical IDs: IDENTITY-001 IDENTITY-002 IDENTITY-003 IDENTITY-004 IDENTITY-005 IDENTITY-006. Priority: P0.

Prerequisites/setup: ACCOUNT-A and ACCOUNT-B with separate Google/phone identities, subscription and distinct vehicles

Exact browser/operator steps: As A attempt to link Phone B. Repeat as phone A attempting Google B. Repeat from two tabs. Reopen both accounts and compare identity, plan, vehicles and history.

Expected UI: Refusal without silent merge/transfer; both owners retain data and access.

Expected backend: Preserve canonical identity, tenant ownership, job/output relationship and immutable usage; inspect sanitized API/DB/AWS evidence for these mapped IDs.

Agent result: DB collisions PASS; local Google collision shown; full real two-tab campaign BLOCKED.

Human verification: **PENDING**

- [ ] PASS
- [ ] FAIL

Notes/evidence/issue IDs: ____________________

## HUMAN-UAT-006 — FREE output denial

Mapped canonical IDs: FREE-004 FREE-006 FREE-015 FREE-020 PLAN-011. Priority: P0.

Prerequisites/setup: FREE-LINKED, a high-resolution source, preview and historical paid output fixtures

Exact browser/operator steps: Process once with Studio enabled and once disabled. Inspect network/API and download controls. Request output/HQ through copied own IDs, altered client plan and direct API. Open historical output after downgrade.

Expected UI: Only intended preview quality returned; no HQ signing for FREE under approved policy.

Expected backend: Preserve canonical identity, tenant ownership, job/output relationship and immutable usage; inspect sanitized API/DB/AWS evidence for these mapped IDs.

Agent result: FAIL BUG-001/002. Numeric preview cap and historical policy require explicit resolution.

Human verification: **PENDING**

- [ ] PASS
- [ ] FAIL

Notes/evidence/issue IDs: ____________________

## HUMAN-UAT-007 — PRO HQ

Mapped canonical IDs: PRO-001 PRO-002 PLAN-012. Priority: P1.

Prerequisites/setup: PRO-GOOGLE assigned STUDIO_PRO by Admin; representative high-res source

Exact browser/operator steps: Sign in → Packs & Billing shows Studio Pro → upload → process → wait for completion → inspect/download output → compare image size/quality.

Expected UI: Intended HIGH/auto result, owned output and correct quota accounting.

Expected backend: Preserve canonical identity, tenant ownership, job/output relationship and immutable usage; inspect sanitized API/DB/AWS evidence for these mapped IDs.

Agent result: Worker tier unit/DB assertions PASS; live end-to-end BLOCKED.

Human verification: **PENDING**

- [ ] PASS
- [ ] FAIL

Notes/evidence/issue IDs: ____________________

## HUMAN-UAT-008 — PLUS HQ

Mapped canonical IDs: PLUS-001 PLUS-002 PLAN-013. Priority: P1.

Prerequisites/setup: PLUS-GOOGLE assigned STUDIO_PLUS and credits remaining

Exact browser/operator steps: Sign in → verify Studio Plus → upload/process → download → inspect dimensions/quality → verify remaining credits.

Expected UI: Intended HIGH/auto result and credit count, no PRO/PLUS naming confusion.

Expected backend: Preserve canonical identity, tenant ownership, job/output relationship and immutable usage; inspect sanitized API/DB/AWS evidence for these mapped IDs.

Agent result: Tier assertions PASS; live end-to-end BLOCKED.

Human verification: **PENDING**

- [ ] PASS
- [ ] FAIL

Notes/evidence/issue IDs: ____________________

## HUMAN-UAT-009 — Upload recovery

Mapped canonical IDs: UPLOAD-013 UPLOAD-014 UPLOAD-016 UPLOAD-020 UPLOAD-022. Priority: P1.

Prerequisites/setup: FREE-PHONE; isolated private bucket with test prefix; valid JPEG/PNG/WebP and corrupt file

Exact browser/operator steps: Upload Vehicle → details → photos → select valid and corrupt files → disconnect network during upload → reconnect/retry → refresh after uploaded bytes but before commit → retry commit.

Expected UI: Valid source committed once to owned vehicle; invalid file safe; stale pending objects follow cleanup; visible recovery.

Expected backend: Preserve canonical identity, tenant ownership, job/output relationship and immutable usage; inspect sanitized API/DB/AWS evidence for these mapped IDs.

Agent result: Commit/validation/DB assertions PASS; real bucket browser boundary BLOCKED.

Human verification: **PENDING**

- [ ] PASS
- [ ] FAIL

Notes/evidence/issue IDs: ____________________

## HUMAN-UAT-010 — Twenty-image batch

Mapped canonical IDs: UPLOAD-003 PROCESS-003 ASYNC-024 GOLDEN-008. Priority: P1.

Prerequisites/setup: PRO-LINKED; 20 synthetic licensed representative images; bounded funded provider budget

Exact browser/operator steps: Upload 20 → choose treatment → Process → navigate away/refresh → watch all jobs. Repeat with one missing source and provider 429 affecting a subset.

Expected UI: 20 owned jobs; successes retained, failures actionable; no duplicate provider costs; measured timings.

Expected backend: Preserve canonical identity, tenant ownership, job/output relationship and immutable usage; inspect sanitized API/DB/AWS evidence for these mapped IDs.

Agent result: 20-job reservation and 18/2 synthetic partial failure PASS; real 20-image pipeline BLOCKED.

Human verification: **PENDING**

- [ ] PASS
- [ ] FAIL

Notes/evidence/issue IDs: ____________________

## HUMAN-UAT-011 — Processing options and result correctness

Mapped canonical IDs: OPTIONS-004 OPTIONS-005 OPTIONS-008 OPTIONS-011 LAMBDA-009 LAMBDA-010. Priority: P1.

Prerequisites/setup: PLUS-LINKED; visibly distinguishable sources; backgrounds/floors matrix

Exact browser/operator steps: For each background/floor toggle enhancement and composition → Review → Process → compare downloaded output to source and selected treatment.

Expected UI: Correct car/options/version/owner; no fabricated provider progress or ignored advertised toggle.

Expected backend: Preserve canonical identity, tenant ownership, job/output relationship and immutable usage; inspect sanitized API/DB/AWS evidence for these mapped IDs.

Agent result: Treatment adapter/integration tests PASS; live visual matrix BLOCKED; known equivalent floor versions BUG-005.

Human verification: **PENDING**

- [ ] PASS
- [ ] FAIL

Notes/evidence/issue IDs: ____________________

## HUMAN-UAT-012 — Studio generation

Mapped canonical IDs: STUDIO-001 STUDIO-002 STUDIO-005 STUDIO-021 GOLDEN-010. Priority: P1.

Prerequisites/setup: Completed owned image and clear product decision whether source is original or prior processed bytes

Exact browser/operator steps: Open Portfolio → new Studio version → choose image/background/floor → process → compare versions → inspect original and derivative → test deletion only if supported.

Expected UI: Explicit source semantics; original retained; new version relationship/output access correct.

Expected backend: Preserve canonical identity, tenant ownership, job/output relationship and immutable usage; inspect sanitized API/DB/AWS evidence for these mapped IDs.

Agent result: Current code versions original ImageAsset; processed-byte derivative scope needs decision; full UAT BLOCKED.

Human verification: **PENDING**

- [ ] PASS
- [ ] FAIL

Notes/evidence/issue IDs: ____________________

## HUMAN-UAT-013 — Failure and DLQ recovery

Mapped canonical IDs: ASYNC-008 ASYNC-010 ASYNC-011 LAMBDA-020 SQS-009 GOLDEN-011. Priority: P1.

Prerequisites/setup: Isolated funded dev queue/worker with hard limit and ability to inspect logs/DB; approved fault window

Exact browser/operator steps: Run job → inject staging failure after provider success → retry → inspect provider calls. In separate controlled job stop last worker and park delivery → invoke recovery → reopen Inventory.

Expected UI: No unintended paid repetition; job reaches actionable terminal or safely recovered state.

Expected backend: Preserve canonical identity, tenant ownership, job/output relationship and immutable usage; inspect sanitized API/DB/AWS evidence for these mapped IDs.

Agent result: FAIL BUG-003/004 local reproductions; real Lambda/DLQ destructive injection BLOCKED.

Human verification: **PENDING**

- [ ] PASS
- [ ] FAIL

Notes/evidence/issue IDs: ____________________

## HUMAN-UAT-014 — Logout during processing

Mapped canonical IDs: UI-PROCESS-010 UI-PROCESS-012 GOLDEN-013. Priority: P1.

Prerequisites/setup: PRO-PHONE with active batch and another browser tab

Exact browser/operator steps: Process → log out immediately → close tab → wait → sign in again via alternate linked method → Inventory/Portfolio.

Expected UI: Server processing continues; account/result rediscovered accurately without transient client store.

Expected backend: Preserve canonical identity, tenant ownership, job/output relationship and immutable usage; inspect sanitized API/DB/AWS evidence for these mapped IDs.

Agent result: Full active pipeline logout/login BLOCKED.

Human verification: **PENDING**

- [ ] PASS
- [ ] FAIL

Notes/evidence/issue IDs: ____________________

## HUMAN-UAT-015 — Cross-user access

Mapped canonical IDs: USER-SEC-001 USER-SEC-004 USER-SEC-005 USER-SEC-007 GOLDEN-014. Priority: P0.

Prerequisites/setup: ACCOUNT-A/B with distinct vehicle/image/job/output IDs and isolated data

Exact browser/operator steps: As A paste B vehicle URL → request B image upload/process/job/download endpoints → alter user/resource IDs → repeat after plan change.

Expected UI: Every boundary denies access; no private data/key/secret leaks or state changes.

Expected backend: Preserve canonical identity, tenant ownership, job/output relationship and immutable usage; inspect sanitized API/DB/AWS evidence for these mapped IDs.

Agent result: Selected tenant repository/handler assertions PASS; complete attack campaign BLOCKED.

Human verification: **PENDING**

- [ ] PASS
- [ ] FAIL

Notes/evidence/issue IDs: ____________________

## HUMAN-UAT-016 — Admin subscription assignment

Mapped canonical IDs: ADMIN-002 ADMIN-PLAN-003 ADMIN-PLAN-004 PLAN-019. Priority: P0.

Prerequisites/setup: ADMIN and verified FREE-GOOGLE lookup identity; no payment-owned subscription mutation

Exact browser/operator steps: Normal user opens /admin and tries action → expect denial. Admin → Subscriptions → find verified user → assign PRO then PLUS → user refreshes billing/process. Try invalid assignment and payment-owned row.

Expected UI: Role checked server-side; audited valid assignments; invalid/provider-owned writes refused; future entitlement updated.

Expected backend: Preserve canonical identity, tenant ownership, job/output relationship and immutable usage; inspect sanitized API/DB/AWS evidence for these mapped IDs.

Agent result: Normal-user denial and manual PRO browser assignment PASS; full Plus/deployed checks BLOCKED.

Human verification: **PENDING**

- [ ] PASS
- [ ] FAIL

Notes/evidence/issue IDs: ____________________

## HUMAN-UAT-017 — Mobile and keyboard

Mapped canonical IDs: BROWSER-009 BROWSER-011 BROWSER-013 BROWSER-014 UX-001 UX-004 UX-009. Priority: P1.

Prerequisites/setup: iOS Safari, Android Chrome and desktop keyboard; FREE/PRO fixtures

Exact browser/operator steps: 390px mobile → open drawer → auth/profile/upload → rotate → open keyboard → Tab/Shift-Tab/Enter/Escape on desktop → cancel and reopen dialog.

Expected UI: Reachable named controls, visible focus and errors; no horizontal page overflow or obscured action.

Expected backend: Preserve canonical identity, tenant ownership, job/output relationship and immutable usage; inspect sanitized API/DB/AWS evidence for these mapped IDs.

Agent result: Local Chromium responsive checks PASS where captured; real devices/accessibility campaign BLOCKED.

Human verification: **PENDING**

- [ ] PASS
- [ ] FAIL

Notes/evidence/issue IDs: ____________________

## HUMAN-UAT-018 — Subscription expiry and signed URLs

Mapped canonical IDs: PLAN-020 PLAN-022 FREE-009 FREE-018 FREE-019. Priority: P0.

Prerequisites/setup: PRO and FREE accounts; explicit historical/bearer-URL policy; isolated output

Exact browser/operator steps: Mint PRO output URL → cancel/expire subscription while queued and again after complete → refresh/download as FREE → reuse copied URL in other account and after TTL.

Expected UI: Approved entitlement and expiry policy enforced at API/storage; bearer behavior documented and tested.

Expected backend: Preserve canonical identity, tenant ownership, job/output relationship and immutable usage; inspect sanitized API/DB/AWS evidence for these mapped IDs.

Agent result: FAIL historical signer BUG-002; signed bearer reuse/expiry enforcement live BLOCKED.

Human verification: **PENDING**

- [ ] PASS
- [ ] FAIL

Notes/evidence/issue IDs: ____________________

## HUMAN-UAT-019 — Public copy and invalid route

Mapped canonical IDs: PUBLIC-005 PUBLIC-006 SEO-010. Priority: P2.

Prerequisites/setup: Anonymous desktop/mobile browser; default or edited PlanConfig

Exact browser/operator steps: Open homepage → compare Workflow and Pricing caps → navigate to nonexistent URL → use return/home controls.

Expected UI: Public limits match configured backend; StudioCar branded recoverable 404.

Expected backend: Preserve canonical identity, tenant ownership, job/output relationship and immutable usage; inspect sanitized API/DB/AWS evidence for these mapped IDs.

Agent result: Workflow three vs pricing five FAIL BUG-008; custom 404 outcome in exploratory evidence.

Human verification: **PENDING**

- [ ] PASS
- [ ] FAIL

Notes/evidence/issue IDs: ____________________
