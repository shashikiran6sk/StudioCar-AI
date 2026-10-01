# Test results

Baseline SHA: `dd835cad364493038b6c28cd0dd0434c5ded2781`. Environment: isolated local Linux, PostgreSQL17, system Chromium151; external providers/storage mocked where stated. Every full record is preserved in `results.json` and `additional-results.json`; `assertion-mapping.json` cites successful suite assertions, while exploratory/API entries cite direct evidence.

Canonical: 776; PASS130, FAIL7, BLOCKED637, NOT_APPLICABLE2. Additional:18; PASS5, FAIL9, BLOCKED4. Human status: PENDING throughout. PASS is scoped to the record's execution type/environment; FAIL is observed behavior; BLOCKED is not an executed test; N/A needs an explicit scope explanation.

| ID | Result | Priority | Expected scenario | Bug | Evidence |
|---|---|---|---|---|---|
| PUBLIC-001 | PASS | P2 | Homepage loads without authentication. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| PUBLIC-002 | PASS | P2 | Public navigation works. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| PUBLIC-003 | BLOCKED | P2 | Sign-in entry points work. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PUBLIC-004 | BLOCKED | P2 | Pricing/plans display current correct information. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PUBLIC-005 | FAIL | P2 | Public plan descriptions match actual backend entitlements. | BUG-008 | [evidence/studiocar-exploration-3.json](evidence/studiocar-exploration-3.json), [evidence/mobile/exploratory-home.png](evidence/mobile/exploratory-home.png) |
| PUBLIC-006 | FAIL | P2 | Invalid route uses StudioCar custom 404. | BUG-009 | [evidence/studiocar-exploration-3.json](evidence/studiocar-exploration-3.json), [evidence/mobile/exploratory-home.png](evidence/mobile/exploratory-home.png) |
| PUBLIC-007 | BLOCKED | P2 | Backend failure uses intended error experience. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PUBLIC-008 | BLOCKED | P2 | Public pages expose no authenticated-user data. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PUBLIC-009 | BLOCKED | P2 | Public pages expose no environment secrets. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PUBLIC-010 | PASS | P2 | Homepage works desktop. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| PUBLIC-011 | PASS | P2 | Homepage works tablet. | — | [evidence/studiocar-exploration-1.json](evidence/studiocar-exploration-1.json) |
| PUBLIC-012 | PASS | P2 | Homepage works mobile. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| PUBLIC-013 | PASS | P2 | Public metadata is correct. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| PUBLIC-014 | PASS | P2 | Favicon/social metadata work. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| PUBLIC-015 | BLOCKED | P2 | Public navigation does not accidentally expose Admin routes. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOOGLE-001 | BLOCKED | P1 | New user signs in through Google successfully. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOOGLE-002 | BLOCKED | P1 | Existing Google user signs in successfully. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOOGLE-003 | PASS | P1 | Google identity maps to correct existing user. | — | [evidence/integration.txt](evidence/integration.txt) |
| GOOGLE-004 | PASS | P1 | Repeated Google login does not create duplicate user. | — | [evidence/integration.txt](evidence/integration.txt) |
| GOOGLE-005 | PASS | P1 | OAuth state validation works. | — | [evidence/unit.txt](evidence/unit.txt) |
| GOOGLE-006 | BLOCKED | P1 | OIDC nonce/state protections work where implemented. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOOGLE-007 | PASS | P1 | Invalid callback rejected. | — | [evidence/unit.txt](evidence/unit.txt) |
| GOOGLE-008 | BLOCKED | P1 | Expired callback/code handled safely. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOOGLE-009 | BLOCKED | P1 | User cancelling Google auth returns recoverable UX. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOOGLE-010 | BLOCKED | P1 | Google provider error handled gracefully. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOOGLE-011 | BLOCKED | P1 | Google email verification requirements enforced where intended. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOOGLE-012 | BLOCKED | P1 | Google account cannot access another user's data. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOOGLE-013 | BLOCKED | P1 | Google login creates intended session. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOOGLE-014 | PASS | P1 | Logout invalidates session. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| GOOGLE-015 | PASS | P1 | Logout-all behavior works if supported. | — | [evidence/integration.txt](evidence/integration.txt) |
| GOOGLE-016 | BLOCKED | P1 | Expired session handled safely. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOOGLE-017 | BLOCKED | P1 | Multiple browser tabs use consistent identity. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOOGLE-018 | BLOCKED | P1 | Google OAuth production callback configuration correct. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PHONE-001 | BLOCKED | P1 | New phone number starts OTP flow. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PHONE-002 | BLOCKED | P1 | Existing phone user starts OTP flow. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PHONE-003 | PASS | P1 | Valid OTP authenticates existing user. | — | [evidence/integration.txt](evidence/integration.txt) |
| PHONE-004 | PASS | P1 | Invalid OTP rejected. | — | [evidence/unit.txt](evidence/unit.txt) |
| PHONE-005 | PASS | P1 | Expired OTP rejected. | — | [evidence/unit.txt](evidence/unit.txt) |
| PHONE-006 | PASS | P1 | Used OTP cannot replay. | — | [evidence/unit.txt](evidence/unit.txt) |
| PHONE-007 | PASS | P1 | OTP attempt limit enforced. | — | [evidence/unit.txt](evidence/unit.txt) |
| PHONE-008 | BLOCKED | P1 | OTP resend limit enforced. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PHONE-009 | PASS | P1 | Rate limiting protects OTP endpoint. | — | [evidence/integration.txt](evidence/integration.txt) |
| PHONE-010 | PASS | P1 | OTP provider failure gives recoverable UX. | — | [evidence/unit.txt](evidence/unit.txt) |
| PHONE-011 | BLOCKED | P1 | OTP timeout does not create partial login. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PHONE-012 | BLOCKED | P1 | Refresh during OTP remains safe. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PHONE-013 | BLOCKED | P1 | Browser Back during OTP remains safe. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PHONE-014 | BLOCKED | P1 | Multiple OTP requests cannot authenticate wrong challenge. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PHONE-015 | BLOCKED | P1 | Concurrent OTP verification remains safe. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PHONE-016 | PASS | P1 | Verified phone maps to correct user. | — | [evidence/integration.txt](evidence/integration.txt) |
| PHONE-017 | PASS | P1 | Phone login does not create duplicate existing user. | — | [evidence/integration.txt](evidence/integration.txt) |
| PHONE-018 | PASS | P1 | Session created correctly. | — | [evidence/integration.txt](evidence/integration.txt) |
| PHONE-019 | BLOCKED | P1 | Logout invalidates phone-auth session. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PHONE-020 | BLOCKED | P1 | Production OTP configuration uses intended provider/channel. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PHONE-021 | BLOCKED | P1 | Local bypass cannot operate accidentally in production. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PHONE-022 | BLOCKED | P1 | Phone identity cannot access another user's resources. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PHONE-CREATE-001 | PASS | P1 | New verified phone user is shown intended post-verification choices. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| PHONE-CREATE-002 | BLOCKED | P1 | User can choose Link Google. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PHONE-CREATE-003 | PASS | P1 | User can choose Create Account. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| PHONE-CREATE-004 | PASS | P1 | Create Account requires intended name fields only. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| PHONE-CREATE-005 | BLOCKED | P1 | Verified phone remains associated with created account. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PHONE-CREATE-006 | BLOCKED | P1 | Account creation does not request OTP again unnecessarily. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PHONE-CREATE-007 | BLOCKED | P1 | Refresh during account creation is safe. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PHONE-CREATE-008 | PASS | P1 | Duplicate submission does not create duplicate users. | — | [evidence/integration.txt](evidence/integration.txt) |
| PHONE-CREATE-009 | PASS | P1 | Invalid name/input rejected. | — | [evidence/unit.txt](evidence/unit.txt) |
| PHONE-CREATE-010 | PASS | P1 | Direct API cannot create account without valid phone verification. | — | [evidence/integration.txt](evidence/integration.txt) |
| PHONE-CREATE-011 | PASS | P1 | Verification token/challenge cannot be reused for another phone. | — | [evidence/integration.txt](evidence/integration.txt) |
| PHONE-CREATE-012 | BLOCKED | P1 | Created account receives FREE/default plan correctly. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PHONE-CREATE-013 | PASS | P1 | Created account can access dashboard/inventory. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| PHONE-CREATE-014 | BLOCKED | P1 | Created account can later link Google. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PHONE-CREATE-015 | PASS | P1 | Logout/login through phone returns same account. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| LINK-PHONE-001 | PASS | P0 | Google-created user opens Profile. | — | [evidence/studiocar-exploration-2.json](evidence/studiocar-exploration-2.json) |
| LINK-PHONE-002 | BLOCKED | P0 | User starts phone-linking flow. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LINK-PHONE-003 | PASS | P0 | Valid OTP links phone. | — | [evidence/integration.txt](evidence/integration.txt) |
| LINK-PHONE-004 | PASS | P0 | Invalid OTP rejected. | — | [evidence/studiocar-exploration-2.json](evidence/studiocar-exploration-2.json) |
| LINK-PHONE-005 | BLOCKED | P0 | Expired OTP rejected. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LINK-PHONE-006 | BLOCKED | P0 | Phone is not linked before verification succeeds. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LINK-PHONE-007 | PASS | P0 | Linked phone appears correctly in Profile. | — | [evidence/studiocar-exploration-2.json](evidence/studiocar-exploration-2.json) |
| LINK-PHONE-008 | PASS | P0 | User can later sign in through linked phone. | — | [evidence/studiocar-exploration-2.json](evidence/studiocar-exploration-2.json) |
| LINK-PHONE-009 | PASS | P0 | Phone login resolves same user as Google. | — | [evidence/studiocar-exploration-2.json](evidence/studiocar-exploration-2.json) |
| LINK-PHONE-010 | PASS | P0 | Linking does not create duplicate account. | — | [evidence/studiocar-exploration-2.json](evidence/studiocar-exploration-2.json) |
| LINK-PHONE-011 | PASS | P0 | Linking phone already owned by same user behaves safely. | — | [evidence/unit.txt](evidence/unit.txt) |
| LINK-PHONE-012 | PASS | P0 | Linking phone owned by another account is prevented or follows explicitly designed merge policy. | — | [evidence/integration.txt](evidence/integration.txt) |
| LINK-PHONE-013 | PASS | P0 | User cannot steal another account's phone through direct API. | — | [evidence/unit.txt](evidence/unit.txt) |
| LINK-PHONE-014 | PASS | P0 | Concurrent linking attempts remain safe. | — | [evidence/integration.txt](evidence/integration.txt) |
| LINK-PHONE-015 | BLOCKED | P0 | Refresh during linking does not create partial link. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LINK-PHONE-016 | BLOCKED | P0 | OTP replay cannot link phone again to another account. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LINK-PHONE-017 | PASS | P0 | Account's subscription/inventory/jobs remain unchanged after linking. | — | [evidence/integration.txt](evidence/integration.txt) |
| LINK-PHONE-018 | BLOCKED | P0 | Audit/security records capture important identity linking where implemented. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LINK-GOOGLE-001 | BLOCKED | P0 | Phone-created user can initiate Google linking. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LINK-GOOGLE-002 | PASS | P0 | Correct Google account links successfully. | — | [evidence/integration.txt](evidence/integration.txt) |
| LINK-GOOGLE-003 | PASS | P0 | Linked Google appears in Profile. | — | [evidence/studiocar-exploration-3.json](evidence/studiocar-exploration-3.json) |
| LINK-GOOGLE-004 | PASS | P0 | User can later login through Google. | — | [evidence/studiocar-exploration-3.json](evidence/studiocar-exploration-3.json) |
| LINK-GOOGLE-005 | PASS | P0 | Google login resolves same user as phone. | — | [evidence/studiocar-exploration-3.json](evidence/studiocar-exploration-3.json) |
| LINK-GOOGLE-006 | BLOCKED | P0 | Linking does not create duplicate user. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LINK-GOOGLE-007 | PASS | P0 | Google identity already linked to same account handled safely. | — | [evidence/unit.txt](evidence/unit.txt) |
| LINK-GOOGLE-008 | PASS | P0 | Google identity belonging to another account is prevented or follows explicit merge policy. | — | [evidence/integration.txt](evidence/integration.txt) |
| LINK-GOOGLE-009 | PASS | P0 | User cannot take over another account through Google linking. | — | [evidence/unit.txt](evidence/unit.txt) |
| LINK-GOOGLE-010 | PASS | P0 | OAuth state protections apply to linking. | — | [evidence/unit.txt](evidence/unit.txt) |
| LINK-GOOGLE-011 | BLOCKED | P0 | Cancelling Google linking leaves account intact. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LINK-GOOGLE-012 | BLOCKED | P0 | Google provider failure leaves account intact. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LINK-GOOGLE-013 | BLOCKED | P0 | Refresh during linking remains safe. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LINK-GOOGLE-014 | BLOCKED | P0 | Concurrent linking requests remain safe. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LINK-GOOGLE-015 | PASS | P0 | Subscription remains attached to same user. | — | [evidence/integration.txt](evidence/integration.txt) |
| LINK-GOOGLE-016 | PASS | P0 | Vehicles remain attached to same user. | — | [evidence/integration.txt](evidence/integration.txt) |
| LINK-GOOGLE-017 | PASS | P0 | Processing history remains attached to same user. | — | [evidence/integration.txt](evidence/integration.txt) |
| LINK-GOOGLE-018 | BLOCKED | P0 | Phone login continues working after Google linking. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| IDENTITY-001 | PASS | P0 | Google Account A cannot link Phone B belonging to Account B without explicit safe merge behavior. | — | [evidence/integration.txt](evidence/integration.txt) |
| IDENTITY-002 | PASS | P0 | Phone Account A cannot link Google B belonging to Account B without explicit safe merge behavior. | — | [evidence/integration.txt](evidence/integration.txt) |
| IDENTITY-003 | PASS | P0 | Linking never silently overwrites identity ownership. | — | [evidence/integration.txt](evidence/integration.txt) |
| IDENTITY-004 | BLOCKED | P0 | Linking never silently moves subscription between users. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| IDENTITY-005 | BLOCKED | P0 | Linking never silently moves vehicles between users. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| IDENTITY-006 | BLOCKED | P0 | Linking never silently moves processing jobs between users. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| IDENTITY-007 | BLOCKED | P0 | Linking never silently loses account data. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| IDENTITY-008 | BLOCKED | P0 | Simultaneous linking from two sessions remains safe. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| IDENTITY-009 | BLOCKED | P0 | Logout/login through either linked identity resolves same canonical user. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| IDENTITY-010 | NOT_APPLICABLE | P0 | Unlinking behavior, if supported, never leaves account inaccessible. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| IDENTITY-011 | NOT_APPLICABLE | P0 | Last authentication method cannot be removed if that would orphan account. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| IDENTITY-012 | BLOCKED | P0 | Direct API cannot manipulate provider subject IDs. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| IDENTITY-013 | BLOCKED | P0 | Direct API cannot manipulate verified phone ownership. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| IDENTITY-014 | PASS | P0 | Duplicate provider identities prevented at DB level. | — | [evidence/integration.txt](evidence/integration.txt) |
| IDENTITY-015 | BLOCKED | P0 | Duplicate verified-phone ownership prevented at DB level where required. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| IDENTITY-016 | BLOCKED | P0 | Session identity remains canonical after linking. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| IDENTITY-017 | BLOCKED | P0 | Existing processing session survives safe linking appropriately. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| IDENTITY-018 | PASS | P0 | Identity-linking failure is observable without leaking secrets. | — | [evidence/unit.txt](evidence/unit.txt) |
| PROFILE-001 | PASS | P1 | User can open Profile. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| PROFILE-002 | BLOCKED | P1 | Correct name displayed. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROFILE-003 | PASS | P1 | Correct email displayed where available. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| PROFILE-004 | PASS | P1 | Correct phone displayed where available. | — | [evidence/studiocar-exploration-2.json](evidence/studiocar-exploration-2.json) |
| PROFILE-005 | PASS | P1 | Linked-auth state displayed correctly. | — | [evidence/account-linking/local-google-phone-linked.png](evidence/account-linking/local-google-phone-linked.png) |
| PROFILE-006 | PASS | P1 | User updates permitted profile fields. | — | [evidence/unit.txt](evidence/unit.txt) |
| PROFILE-007 | PASS | P1 | Invalid profile data rejected. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| PROFILE-008 | BLOCKED | P1 | User cannot modify subscription directly through profile API. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROFILE-009 | BLOCKED | P1 | User cannot modify another user's profile. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROFILE-010 | PASS | P1 | Direct payload cannot change user ID/auth provider ownership. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| PROFILE-011 | BLOCKED | P1 | Profile works mobile. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROFILE-012 | BLOCKED | P1 | Profile changes survive logout/login. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-001 | BLOCKED | P1 | New user receives correct default FREE plan. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-002 | BLOCKED | P1 | FREE plan UI correctly identified. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-003 | PASS | P1 | PRO plan UI correctly identified. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| PLAN-004 | BLOCKED | P1 | PLUS plan UI correctly identified. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-005 | BLOCKED | P1 | Backend entitlement matches FREE UI. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-006 | BLOCKED | P1 | Backend entitlement matches PRO UI. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-007 | BLOCKED | P1 | Backend entitlement matches PLUS UI. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-008 | PASS | P1 | FREE processing follows current limits. | — | [evidence/integration.txt](evidence/integration.txt) |
| PLAN-009 | BLOCKED | P1 | PRO processing follows current limits. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-010 | BLOCKED | P1 | PLUS processing follows current limits. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-011 | FAIL | P0 | FREE receives only permitted preview-quality access. | BUG-001 | [evidence/adversarial-final.txt](evidence/adversarial-final.txt), [evidence/security/adversarial-baseline.test.ts](evidence/security/adversarial-baseline.test.ts) |
| PLAN-012 | BLOCKED | P1 | PRO receives intended high-quality access. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-013 | BLOCKED | P1 | PLUS receives intended high-quality access. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-014 | BLOCKED | P1 | FREE cannot manipulate API to request PRO/PLUS entitlement. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-015 | BLOCKED | P1 | FREE cannot manipulate frontend state to unlock HQ. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-016 | BLOCKED | P1 | FREE cannot obtain HQ object through predictable S3 URL. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-017 | BLOCKED | P1 | FREE cannot access HQ object through another endpoint. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-018 | BLOCKED | P1 | User cannot modify own plan through API. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-019 | BLOCKED | P1 | Subscription changes propagate correctly to entitlement checks. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-020 | BLOCKED | P1 | Downgrade behavior follows explicit policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-021 | BLOCKED | P1 | Upgrade behavior follows explicit policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-022 | BLOCKED | P1 | Expired subscription behavior follows explicit policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-023 | BLOCKED | P1 | Plan change does not destroy historical processed images unexpectedly. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLAN-024 | BLOCKED | P1 | Plan entitlement is enforced server-side, not only UI. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-PLAN-001 | BLOCKED | P1 | Admin can access subscription-management functionality. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-PLAN-002 | BLOCKED | P1 | Normal user cannot access it. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-PLAN-003 | PASS | P1 | FREE user cannot access it. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| ADMIN-PLAN-004 | BLOCKED | P1 | PRO user cannot access Admin functionality merely because subscribed. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-PLAN-005 | BLOCKED | P1 | PLUS user cannot access Admin functionality. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-PLAN-006 | BLOCKED | P1 | Admin can assign intended PRO subscription. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-PLAN-007 | BLOCKED | P1 | Admin can assign intended PLUS subscription. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-PLAN-008 | BLOCKED | P1 | Assignment updates user's entitlement. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-PLAN-009 | BLOCKED | P1 | Repeated assignment does not create invalid duplicate subscription state. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-PLAN-010 | BLOCKED | P1 | Invalid plan assignment rejected. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-PLAN-011 | BLOCKED | P1 | Non-admin direct API assignment rejected. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-PLAN-012 | BLOCKED | P1 | Subscription changes audit logged where implemented. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-PLAN-013 | BLOCKED | P1 | User processing behavior reflects changed plan. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-PLAN-014 | BLOCKED | P1 | Subscription change does not corrupt user history. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-001 | BLOCKED | P1 | User creates vehicle/inventory record through intended flow. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-002 | BLOCKED | P1 | Vehicle belongs to correct user. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-003 | BLOCKED | P1 | User sees own vehicles. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-004 | BLOCKED | P1 | User cannot see another user's private vehicles. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-005 | BLOCKED | P1 | Vehicle search works. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-006 | BLOCKED | P1 | Inventory pagination works where applicable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-007 | BLOCKED | P1 | Vehicle metadata saves correctly. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-008 | BLOCKED | P1 | Invalid metadata rejected. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-009 | BLOCKED | P1 | Duplicate operations do not create unintended duplicate vehicle. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-010 | BLOCKED | P1 | User can update permitted vehicle fields. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-011 | BLOCKED | P1 | User cannot reassign vehicle to another user. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-012 | BLOCKED | P1 | User removes vehicle according to current lifecycle. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-013 | BLOCKED | P1 | Vehicle removal handles associated uploads correctly. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-014 | BLOCKED | P1 | Vehicle removal handles processed outputs correctly. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-015 | BLOCKED | P1 | Vehicle removal handles processing history according to policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-016 | BLOCKED | P1 | Vehicle deletion during active processing follows defined policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-017 | BLOCKED | P1 | Direct URL/API to another user's vehicle denied. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-018 | BLOCKED | P1 | Inventory empty state works. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-019 | BLOCKED | P1 | Inventory works mobile. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| VEHICLE-020 | BLOCKED | P1 | Inventory survives logout/login. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-001 | BLOCKED | P1 | User selects valid image. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-002 | BLOCKED | P1 | Multiple valid images selected. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-003 | BLOCKED | P1 | Intended 20-image batch supported. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-004 | BLOCKED | P1 | File-count limit enforced. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-005 | BLOCKED | P1 | Supported MIME types accepted. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-006 | BLOCKED | P1 | Unsupported MIME type rejected. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-007 | BLOCKED | P1 | Oversized image rejected according to limits. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-008 | BLOCKED | P1 | Zero-byte/corrupt image handled safely. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-009 | BLOCKED | P1 | Non-image masquerading as image rejected where validation supports it. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-010 | PASS | P1 | Presign endpoint requires authentication. | — | [evidence/unit.txt](evidence/unit.txt) |
| UPLOAD-011 | BLOCKED | P1 | Presigned URL belongs to correct user/resource. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-012 | BLOCKED | P1 | User cannot request presign for another user's resource. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-013 | BLOCKED | P1 | Upload to S3 succeeds. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-014 | BLOCKED | P1 | Commit after upload succeeds. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-015 | BLOCKED | P1 | DB record correctly references uploaded object. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-016 | BLOCKED | P1 | Upload success + commit failure remains recoverable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-017 | BLOCKED | P1 | Presign success + no upload leaves cleanup path. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-018 | BLOCKED | P1 | Upload succeeds + user closes dialog follows cleanup policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-019 | BLOCKED | P1 | Upload succeeds + browser refresh remains recoverable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-020 | BLOCKED | P1 | Network interruption during upload handled. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-021 | BLOCKED | P1 | Retrying upload does not create unintended duplicates. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-022 | PASS | P1 | Duplicate commit handled safely. | — | [evidence/unit.txt](evidence/unit.txt) |
| UPLOAD-023 | BLOCKED | P1 | Upload ordering preserved where required. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-024 | BLOCKED | P1 | Image preview corresponds to correct upload. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-025 | BLOCKED | P1 | S3 key cannot be manipulated to overwrite another user's object. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-026 | BLOCKED | P1 | Private upload object cannot be fetched by another user. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-027 | BLOCKED | P1 | Expired presigned URL rejected. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-028 | BLOCKED | P1 | Presigned URL permissions are appropriately scoped. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UPLOAD-029 | PASS | P1 | Upload metadata cannot mass-assign another user/vehicle. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| UPLOAD-030 | BLOCKED | P1 | Batch partial upload failure clearly represented. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OPTIONS-001 | BLOCKED | P1 | Processing dialog opens for eligible images. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OPTIONS-002 | BLOCKED | P1 | Available studio backgrounds load. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OPTIONS-003 | BLOCKED | P1 | Available floors load. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OPTIONS-004 | BLOCKED | P1 | Background selection persists for submitted job. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OPTIONS-005 | BLOCKED | P1 | Floor selection persists for submitted job. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OPTIONS-006 | BLOCKED | P1 | Correct background/floor IDs reach worker. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OPTIONS-007 | BLOCKED | P1 | Image enhancement toggle follows current implementation. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OPTIONS-008 | BLOCKED | P1 | Image enhancement OFF produces intended behavior. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OPTIONS-009 | BLOCKED | P1 | Image enhancement ON produces intended behavior. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OPTIONS-010 | BLOCKED | P1 | Maintain composition OFF follows intended behavior. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OPTIONS-011 | BLOCKED | P1 | Maintain composition ON follows intended behavior. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OPTIONS-012 | BLOCKED | P1 | Removed/unsupported options are absent. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OPTIONS-013 | BLOCKED | P1 | Invalid background ID rejected. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OPTIONS-014 | BLOCKED | P1 | Invalid floor ID rejected. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OPTIONS-015 | BLOCKED | P1 | User cannot inject arbitrary S3 asset belonging to another user. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OPTIONS-016 | BLOCKED | P1 | Closing dialog before processing does not create job. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OPTIONS-017 | BLOCKED | P1 | Reopening dialog maintains intended selection behavior. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OPTIONS-018 | BLOCKED | P1 | Dialog works mobile. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-001 | BLOCKED | P1 | Single eligible image can be processed. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-002 | BLOCKED | P1 | Multiple eligible images can be processed. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-003 | PASS | P1 | 20-image batch can be submitted. | — | [evidence/integration.txt](evidence/integration.txt) |
| PROCESS-004 | PASS | P1 | Clicking Process creates intended DB records. | — | [evidence/integration.txt](evidence/integration.txt) |
| PROCESS-005 | BLOCKED | P1 | Job records belong to correct user. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-006 | BLOCKED | P1 | Job records reference correct source image. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-007 | BLOCKED | P1 | Job records contain correct processing options. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-008 | BLOCKED | P1 | Process request returns within acceptable submission latency. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-009 | BLOCKED | P1 | User is navigated/updated according to current UX. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-010 | BLOCKED | P1 | Double-click Process does not create unintended duplicate processing. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-011 | PASS | P1 | Network retry does not duplicate job unexpectedly. | — | [evidence/integration.txt](evidence/integration.txt) |
| PROCESS-012 | BLOCKED | P1 | Browser Back does not resubmit processing. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-013 | BLOCKED | P1 | Refresh after submission does not duplicate processing. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-014 | BLOCKED | P1 | Same request from two tabs remains safe. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-015 | PASS | P1 | User cannot process another user's source image. | — | [evidence/integration.txt](evidence/integration.txt) |
| PROCESS-016 | PASS | P1 | FREE entitlement enforced at submission. | — | [evidence/integration.txt](evidence/integration.txt) |
| PROCESS-017 | BLOCKED | P1 | PRO entitlement enforced at submission. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-018 | BLOCKED | P1 | PLUS entitlement enforced at submission. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-019 | BLOCKED | P1 | Invalid source object rejected. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-020 | BLOCKED | P1 | Missing source object handled. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-021 | BLOCKED | P1 | Invalid processing options rejected. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-022 | BLOCKED | P1 | DB failure during job creation gives no false success. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-023 | BLOCKED | P1 | Queue/dispatch failure after DB creation remains recoverable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-024 | PASS | P1 | Partial batch job-creation failure follows defined atomicity policy. | — | [evidence/integration.txt](evidence/integration.txt) |
| PROCESS-025 | BLOCKED | P1 | Processing submission emits useful request/job IDs. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-026 | BLOCKED | P1 | No provider/API secret returned to client. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-027 | BLOCKED | P1 | Submission API does not wait unnecessarily for Leonardo completion. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROCESS-028 | BLOCKED | P1 | Processing batch submission remains responsive under expected batch size. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DISPATCH-001 | PASS | P1 | Newly created process job becomes dispatchable. | — | [evidence/unit.txt](evidence/unit.txt) |
| DISPATCH-002 | PASS | P1 | Outbox/event record correctly references job. | — | [evidence/unit.txt](evidence/unit.txt) |
| DISPATCH-003 | BLOCKED | P1 | Dispatcher sends intended SQS message. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DISPATCH-004 | PASS | P1 | SQS message references correct job. | — | [evidence/unit.txt](evidence/unit.txt) |
| DISPATCH-005 | BLOCKED | P1 | Duplicate dispatcher invocation does not create unsafe duplicate processing. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DISPATCH-006 | PASS | P1 | Dispatch retry is safe. | — | [evidence/unit.txt](evidence/unit.txt) |
| DISPATCH-007 | PASS | P1 | DB success + SQS failure leaves recoverable dispatch state. | — | [evidence/unit.txt](evidence/unit.txt) |
| DISPATCH-008 | BLOCKED | P1 | SQS success + dispatcher response failure remains safe. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DISPATCH-009 | BLOCKED | P1 | Dispatcher cannot dispatch another user's fabricated job. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DISPATCH-010 | BLOCKED | P1 | Invalid outbox record handled. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DISPATCH-011 | BLOCKED | P1 | Already-dispatched record not incorrectly reprocessed by dispatcher logic. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DISPATCH-012 | PASS | P1 | Concurrent dispatcher instances remain safe. | — | [evidence/integration.txt](evidence/integration.txt) |
| DISPATCH-013 | BLOCKED | P1 | EventBridge/internal trigger authentication works where applicable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DISPATCH-014 | BLOCKED | P1 | Internal dispatch endpoint cannot be publicly abused. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DISPATCH-015 | BLOCKED | P1 | Dispatch metrics/logging emitted. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DISPATCH-016 | BLOCKED | P1 | Failed dispatch observable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DISPATCH-017 | BLOCKED | P1 | Stuck outbox records can be identified. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DISPATCH-018 | BLOCKED | P1 | Batch dispatch behaves correctly. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DISPATCH-019 | BLOCKED | P1 | Dispatcher failure does not mark image successfully processed. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DISPATCH-020 | PASS | P1 | Dispatch preserves correlation/request/job IDs. | — | [evidence/unit.txt](evidence/unit.txt) |
| SQS-001 | BLOCKED | P1 | Correct message reaches intended queue. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SQS-002 | BLOCKED | P1 | Message body validates. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SQS-003 | BLOCKED | P1 | Invalid message rejected safely. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SQS-004 | BLOCKED | P1 | Duplicate message delivery remains idempotent. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SQS-005 | BLOCKED | P1 | Message retry behaves correctly. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SQS-006 | BLOCKED | P1 | Visibility timeout supports expected processing duration. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SQS-007 | BLOCKED | P1 | Lambda concurrency does not cause duplicate ownership. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SQS-008 | BLOCKED | P1 | Poison message does not retry forever without visibility. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SQS-009 | BLOCKED | P1 | DLQ behavior works if configured. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SQS-010 | BLOCKED | P1 | Failed messages can be diagnosed. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SQS-011 | BLOCKED | P1 | Queue permissions restrict unauthorized producers. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SQS-012 | BLOCKED | P1 | Queue permissions restrict unauthorized consumers. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SQS-013 | BLOCKED | P1 | Message contains no secrets. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SQS-014 | BLOCKED | P1 | Message contains only necessary identifiers/options. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SQS-015 | BLOCKED | P1 | 20-image batch creates expected queue behavior. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SQS-016 | BLOCKED | P1 | SQS redelivery after Lambda timeout remains safe. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SQS-017 | BLOCKED | P1 | SQS redelivery after partial processing remains safe. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SQS-018 | BLOCKED | P1 | Queue metrics expose backlog/failures. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-001 | BLOCKED | P1 | Worker receives valid job. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-002 | BLOCKED | P1 | Worker loads correct DB job. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-003 | BLOCKED | P1 | Worker loads correct source object. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-004 | BLOCKED | P1 | Worker loads correct processing configuration. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-005 | BLOCKED | P1 | Worker handles FREE job correctly. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-006 | BLOCKED | P1 | Worker handles PRO job correctly. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-007 | BLOCKED | P1 | Worker handles PLUS job correctly. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-008 | BLOCKED | P1 | Worker invokes Leonardo with correct source. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-009 | BLOCKED | P1 | Worker applies correct studio background. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-010 | BLOCKED | P1 | Worker applies correct floor. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-011 | BLOCKED | P1 | Worker applies supported processing toggles correctly. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-012 | BLOCKED | P1 | Worker rejects invalid/non-car input according to current provider/product policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-013 | BLOCKED | P1 | Worker handles missing source object. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-014 | BLOCKED | P1 | Worker handles invalid DB job. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-015 | BLOCKED | P1 | Worker cannot process another user's manipulated object reference. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-016 | BLOCKED | P1 | Worker writes correct output. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-017 | BLOCKED | P1 | Output belongs to correct user/job. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-018 | BLOCKED | P1 | DB status updates correctly. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-019 | PASS | P1 | Worker failure updates/retries according to policy. | — | [evidence/integration.txt](evidence/integration.txt) |
| LAMBDA-020 | BLOCKED | P1 | Lambda timeout remains recoverable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-021 | BLOCKED | P1 | Lambda crash before provider call remains safe. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-022 | BLOCKED | P1 | Lambda crash after provider call remains safe. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-023 | BLOCKED | P1 | Lambda crash after S3 write but before DB update remains recoverable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-024 | BLOCKED | P1 | Lambda crash after DB update remains idempotent. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-025 | BLOCKED | P1 | Duplicate Lambda invocation does not produce uncontrolled duplicate output/cost. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-026 | BLOCKED | P1 | Worker temporary files cleaned. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-027 | BLOCKED | P1 | Worker memory use remains acceptable for max batch/image. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-028 | BLOCKED | P1 | Worker package contains only required production dependencies. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-029 | BLOCKED | P1 | Logs contain correlation/job identifiers. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LAMBDA-030 | BLOCKED | P1 | Logs contain no Leonardo/AWS/DB secrets. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-001 | BLOCKED | P1 | Valid image successfully processes through Leonardo. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-002 | BLOCKED | P1 | Leonardo authentication works. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-003 | BLOCKED | P1 | Invalid Leonardo credentials fail safely. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-004 | BLOCKED | P1 | Provider timeout handled. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-005 | BLOCKED | P1 | Provider 4xx handled. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-006 | BLOCKED | P1 | Provider 5xx handled. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-007 | BLOCKED | P1 | Rate-limit response handled. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-008 | BLOCKED | P1 | Provider malformed response handled. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-009 | BLOCKED | P1 | Missing output URL handled. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-010 | BLOCKED | P1 | Expired temporary Leonardo output URL handled safely. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-011 | BLOCKED | P1 | Output downloaded before temporary URL expiry. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-012 | BLOCKED | P1 | Content type validated. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-013 | BLOCKED | P1 | Unexpected output type rejected. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-014 | BLOCKED | P1 | Provider cost information not exposed unnecessarily to user. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-015 | BLOCKED | P1 | Leonardo request does not leak user secrets. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-016 | BLOCKED | P1 | Provider abstraction remains intact. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-017 | BLOCKED | P1 | Removed providers cannot accidentally execute in production. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-018 | BLOCKED | P1 | Retry does not cause uncontrolled duplicate provider charges. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-019 | BLOCKED | P1 | Same SQS job redelivery does not repeatedly call Leonardo when completed output already exists. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-020 | BLOCKED | P1 | Provider success + downstream S3 failure remains recoverable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-021 | BLOCKED | P1 | Provider success + DB failure remains recoverable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-022 | BLOCKED | P1 | 20-image processing does not violate provider handling assumptions. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-023 | BLOCKED | P1 | Generated output visually corresponds to correct source car. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| LEONARDO-024 | BLOCKED | P1 | Provider errors map to understandable job failure state. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-001 | BLOCKED | P1 | Processed output stored in intended production bucket/path. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-002 | BLOCKED | P1 | Output associated with correct user. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-003 | BLOCKED | P1 | Output associated with correct vehicle/image/job. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-004 | BLOCKED | P1 | Output content type correct. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-005 | BLOCKED | P1 | Output metadata correct where applicable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-006 | BLOCKED | P1 | Output object cannot overwrite another user's object. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-007 | BLOCKED | P1 | User cannot access another user's output. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-008 | BLOCKED | P1 | FREE preview access works. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-009 | BLOCKED | P1 | PRO HQ access works. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-010 | BLOCKED | P1 | PLUS HQ access works. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-011 | BLOCKED | P1 | FREE cannot access HQ object directly. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-012 | BLOCKED | P1 | Guessing HQ S3 key does not bypass entitlement. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-013 | BLOCKED | P1 | Presigned/read URLs expire appropriately. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-014 | BLOCKED | P1 | Private bucket configuration correct. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-015 | BLOCKED | P1 | Missing output object handled gracefully. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-016 | BLOCKED | P1 | S3 write failure does not falsely mark job successful. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-017 | BLOCKED | P1 | Duplicate worker invocation does not corrupt output. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-018 | BLOCKED | P1 | Removed vehicle/image follows output cleanup policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-019 | BLOCKED | P1 | Raw upload and processed output permissions remain separated appropriately. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OUTPUT-020 | BLOCKED | P1 | S3 URLs do not expose secrets. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| JOB-001 | BLOCKED | P1 | New job begins correct initial state. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| JOB-002 | BLOCKED | P1 | Dispatch state correct. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| JOB-003 | BLOCKED | P1 | Processing state correct. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| JOB-004 | BLOCKED | P1 | Success state correct. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| JOB-005 | PASS | P1 | Failure state correct. | — | [evidence/integration.txt](evidence/integration.txt) |
| JOB-006 | PASS | P1 | Retry state correct if supported. | — | [evidence/integration.txt](evidence/integration.txt) |
| JOB-007 | BLOCKED | P1 | Job state transitions follow allowed state machine. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| JOB-008 | BLOCKED | P1 | Invalid transition rejected. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| JOB-009 | PASS | P1 | Completed job cannot accidentally return to processing. | — | [evidence/unit.txt](evidence/unit.txt) |
| JOB-010 | PASS | P1 | Duplicate completion remains idempotent. | — | [evidence/unit.txt](evidence/unit.txt) |
| JOB-011 | BLOCKED | P1 | Job belongs to correct user. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| JOB-012 | BLOCKED | P1 | Job references correct vehicle/source. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| JOB-013 | BLOCKED | P1 | Job references correct output. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| JOB-014 | BLOCKED | P1 | Request ID preserved where designed. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| JOB-015 | BLOCKED | P1 | Failure reason stored safely. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| JOB-016 | BLOCKED | P1 | Failure reason does not contain secrets. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| JOB-017 | PASS | P1 | User cannot query another user's job. | — | [evidence/unit.txt](evidence/unit.txt) |
| JOB-018 | BLOCKED | P1 | Admin access follows intended authorization. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| JOB-019 | BLOCKED | P1 | Old job history remains after logout/login. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| JOB-020 | BLOCKED | P1 | Vehicle deletion interaction follows defined policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| JOB-021 | BLOCKED | P1 | Source deletion during job follows defined policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| JOB-022 | BLOCKED | P1 | DB indexes support job-status polling/query patterns. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-001 | BLOCKED | P1 | Submitted job appears promptly in UI. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-002 | BLOCKED | P1 | Processing state represented correctly. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-003 | BLOCKED | P1 | Completed image appears without requiring inappropriate manual recovery. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-004 | BLOCKED | P1 | Current polling/refresh architecture works as implemented. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-005 | BLOCKED | P1 | UI does not create excessive polling/network traffic. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-006 | BLOCKED | P1 | Multiple simultaneous jobs update independently. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-007 | BLOCKED | P1 | 20-image batch updates correctly. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-008 | BLOCKED | P1 | One failed image does not incorrectly mark entire successful batch failed unless defined. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-009 | BLOCKED | P1 | Partial batch completion represented correctly. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-010 | BLOCKED | P1 | Refresh during processing recovers job state. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-011 | BLOCKED | P1 | Logout/login during processing recovers state. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-012 | BLOCKED | P1 | New browser tab sees authoritative job state. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-013 | BLOCKED | P1 | UI never shows success before backend completion. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-014 | BLOCKED | P1 | UI never exposes HQ to FREE through client state. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-015 | BLOCKED | P1 | Failed job displays useful error/retry state. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-016 | BLOCKED | P1 | Stuck job does not spin forever without useful state. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-017 | BLOCKED | P1 | Completed output maps to correct thumbnail/source. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-018 | BLOCKED | P1 | Out-of-order completions do not mismatch images. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-019 | BLOCKED | P1 | UI works mobile while jobs process. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UI-PROCESS-020 | BLOCKED | P1 | Slow processing does not freeze unrelated navigation. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| FREE-001 | BLOCKED | P0 | FREE user can process eligible image. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| FREE-002 | BLOCKED | P0 | FREE sees intended preview. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| FREE-003 | BLOCKED | P0 | FREE preview corresponds to processed output. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| FREE-004 | BLOCKED | P0 | FREE cannot access HQ through UI. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| FREE-005 | BLOCKED | P0 | FREE cannot reveal HQ by modifying client state. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| FREE-006 | BLOCKED | P0 | FREE cannot reveal HQ by changing API request. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| FREE-007 | BLOCKED | P0 | FREE cannot access HQ job endpoint. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| FREE-008 | BLOCKED | P0 | FREE cannot access HQ S3 key. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| FREE-009 | BLOCKED | P0 | FREE cannot reuse PRO user's HQ URL. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| FREE-010 | BLOCKED | P0 | FREE cannot change user ID to fetch HQ. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| FREE-011 | BLOCKED | P0 | FREE cannot change plan field in request. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| FREE-012 | BLOCKED | P0 | FREE cannot manipulate local storage/state to unlock HQ. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| FREE-013 | BLOCKED | P0 | FREE output remains correctly restricted after refresh. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| FREE-014 | BLOCKED | P0 | FREE restriction persists after logout/login. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| FREE-015 | FAIL | P0 | FREE restriction applies to historical processed images. | BUG-002 | [evidence/adversarial-final.txt](evidence/adversarial-final.txt), [evidence/security/adversarial-baseline.test.ts](evidence/security/adversarial-baseline.test.ts) |
| FREE-016 | BLOCKED | P0 | FREE restriction applies to Studio-generated derivative. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| FREE-017 | BLOCKED | P0 | Upgrade to PRO changes future/current access according to policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| FREE-018 | BLOCKED | P0 | Downgrade back to FREE follows policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| FREE-019 | BLOCKED | P0 | Subscription expiry follows policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| FREE-020 | FAIL | P0 | Server remains authoritative for HQ entitlement. | BUG-001 | [evidence/adversarial-final.txt](evidence/adversarial-final.txt), [evidence/security/adversarial-baseline.test.ts](evidence/security/adversarial-baseline.test.ts) |
| PRO-001 | BLOCKED | P1 | PRO processes eligible image. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PRO-002 | BLOCKED | P1 | PRO receives intended HQ output. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PRO-003 | BLOCKED | P1 | PRO HQ survives refresh. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PRO-004 | BLOCKED | P1 | PRO HQ survives logout/login. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PRO-005 | BLOCKED | P1 | PRO cannot access another user's HQ. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PRO-006 | BLOCKED | P1 | PRO processing limits enforced. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PRO-007 | BLOCKED | P1 | PRO entitlement enforced server-side. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PRO-008 | BLOCKED | P1 | PRO Studio-generation entitlement follows current policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PRO-009 | BLOCKED | P1 | PRO downgrade follows policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PRO-010 | BLOCKED | P1 | PRO expiration follows policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PRO-011 | BLOCKED | P1 | PRO history remains intact after plan change. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PRO-012 | BLOCKED | P1 | PRO plan cannot self-upgrade to PLUS through API. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PRO-013 | BLOCKED | P1 | PRO UI accurately reflects plan. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PRO-014 | BLOCKED | P1 | PRO 20-image batch follows intended limits. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLUS-001 | BLOCKED | P1 | PLUS processes eligible image. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLUS-002 | BLOCKED | P1 | PLUS receives intended HQ output. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLUS-003 | BLOCKED | P1 | PLUS HQ survives refresh. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLUS-004 | BLOCKED | P1 | PLUS HQ survives logout/login. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLUS-005 | BLOCKED | P1 | PLUS cannot access another user's HQ. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLUS-006 | BLOCKED | P1 | PLUS limits enforced. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLUS-007 | BLOCKED | P1 | PLUS entitlement server-side. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLUS-008 | BLOCKED | P1 | PLUS Studio-generation entitlement correct. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLUS-009 | BLOCKED | P1 | PLUS downgrade follows policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLUS-010 | BLOCKED | P1 | PLUS expiration follows policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLUS-011 | BLOCKED | P1 | PLUS history remains intact. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLUS-012 | BLOCKED | P1 | PLUS cannot manipulate Admin subscription APIs. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLUS-013 | BLOCKED | P1 | PLUS UI accurately reflects plan. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PLUS-014 | BLOCKED | P1 | PLUS 20-image batch follows intended limits. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-001 | BLOCKED | P1 | Eligible processed image can start Studio generation. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-002 | BLOCKED | P1 | Correct source processed image selected. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-003 | BLOCKED | P1 | User selects studio background. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-004 | BLOCKED | P1 | User selects floor. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-005 | BLOCKED | P1 | Studio job records correct source/options. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-006 | BLOCKED | P1 | Studio job dispatched correctly. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-007 | BLOCKED | P1 | Lambda receives correct derivative job. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-008 | BLOCKED | P1 | Leonardo receives intended source. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-009 | BLOCKED | P1 | Generated Studio output stored correctly. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-010 | BLOCKED | P1 | Studio output appears in UI. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-011 | BLOCKED | P1 | FREE Studio behavior follows entitlement policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-012 | BLOCKED | P1 | PRO Studio behavior follows entitlement policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-013 | BLOCKED | P1 | PLUS Studio behavior follows entitlement policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-014 | BLOCKED | P1 | User cannot create Studio image from another user's processed image. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-015 | BLOCKED | P1 | User cannot inject another user's source object. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-016 | BLOCKED | P1 | Invalid source rejected. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-017 | BLOCKED | P1 | Missing source handled. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-018 | BLOCKED | P1 | Duplicate Studio submission remains safe. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-019 | BLOCKED | P1 | SQS redelivery remains idempotent. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-020 | BLOCKED | P1 | Provider retry remains safe. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-021 | BLOCKED | P1 | Studio failure does not corrupt original processed image. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-022 | BLOCKED | P1 | Deleting derivative does not delete original unless explicitly designed. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-023 | BLOCKED | P1 | Original deletion interaction follows defined derivative policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| STUDIO-024 | BLOCKED | P1 | Studio output access obeys plan quality entitlement. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-001 | BLOCKED | P1 | Uncommitted uploads cleaned according to policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-002 | BLOCKED | P1 | Upload removed from UI triggers intended storage cleanup. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-003 | BLOCKED | P1 | Deleted vehicle cleanup follows policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-004 | BLOCKED | P1 | Deleted source image cleanup follows policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-005 | BLOCKED | P1 | Processed output cleanup follows policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-006 | BLOCKED | P1 | Studio derivative cleanup follows policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-007 | BLOCKED | P1 | Cleanup never deletes another user's object. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-008 | BLOCKED | P1 | Cleanup validates ownership. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-009 | BLOCKED | P1 | Internal cleanup endpoint protected. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-010 | BLOCKED | P1 | Cleanup token/auth works. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-011 | BLOCKED | P1 | Unauthorized cleanup invocation denied. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-012 | BLOCKED | P1 | Repeated cleanup is idempotent. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-013 | BLOCKED | P1 | Missing object cleanup safe. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-014 | BLOCKED | P1 | DB record + missing S3 object safe. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-015 | BLOCKED | P1 | S3 object + missing DB record handled according to orphan policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-016 | BLOCKED | P1 | Cleanup during active processing follows defined policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-017 | BLOCKED | P1 | Cleanup after failed processing works. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-018 | BLOCKED | P1 | Cleanup after successful processing follows retention policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-019 | BLOCKED | P1 | Scheduled cleanup observable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-020 | BLOCKED | P1 | Cleanup failures observable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-021 | BLOCKED | P1 | Cleanup logs contain no secrets. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CLEANUP-022 | BLOCKED | P1 | Cleanup does not accidentally remove shared static studio assets. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-001 | BLOCKED | P1 | Admin authentication works. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-002 | PASS | P1 | Normal user denied Admin UI. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| ADMIN-003 | PASS | P1 | Normal user denied Admin APIs. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| ADMIN-004 | PASS | P1 | FREE/PRO/PLUS do not imply Admin. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| ADMIN-005 | BLOCKED | P1 | Bootstrap Admin behavior secure. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-006 | BLOCKED | P1 | Admin can view intended user management. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-007 | BLOCKED | P1 | Admin can add Admin according to current feature. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-008 | BLOCKED | P1 | Unauthorized user cannot add Admin. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-009 | BLOCKED | P1 | Admin can assign PRO where supported. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-010 | BLOCKED | P1 | Admin can assign PLUS where supported. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-011 | BLOCKED | P1 | Invalid subscription assignment rejected. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-012 | BLOCKED | P1 | Admin actions audit logged where implemented. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-013 | BLOCKED | P1 | Admin cannot accidentally expose auth secrets. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-014 | BLOCKED | P1 | Admin user search/list works. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-015 | BLOCKED | P1 | Admin responsive layout works. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-016 | BLOCKED | P1 | Admin session expiry handled. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-017 | BLOCKED | P1 | Admin logout handled. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ADMIN-018 | BLOCKED | P1 | Direct Admin endpoints enforce authorization. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| USER-SEC-001 | PASS | P0 | User A cannot view User B vehicles. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| USER-SEC-002 | PASS | P0 | User A cannot modify User B vehicles. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| USER-SEC-003 | PASS | P0 | User A cannot upload to User B vehicle. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| USER-SEC-004 | PASS | P0 | User A cannot process User B image. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| USER-SEC-005 | PASS | P0 | User A cannot query User B job. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| USER-SEC-006 | BLOCKED | P0 | User A cannot access User B raw upload. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| USER-SEC-007 | BLOCKED | P0 | User A cannot access User B processed output. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| USER-SEC-008 | BLOCKED | P0 | User A cannot access User B HQ output. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| USER-SEC-009 | BLOCKED | P0 | User A cannot access User B Studio derivative. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| USER-SEC-010 | PASS | P0 | User A cannot delete User B object. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| USER-SEC-011 | BLOCKED | P0 | User A cannot alter User B profile. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| USER-SEC-012 | BLOCKED | P0 | User A cannot alter User B subscription. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| USER-SEC-013 | BLOCKED | P0 | User A cannot link identity to User B account improperly. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| USER-SEC-014 | BLOCKED | P0 | UUID manipulation does not bypass ownership. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| USER-SEC-015 | BLOCKED | P0 | Query manipulation does not bypass ownership. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| USER-SEC-016 | BLOCKED | P0 | Request-body manipulation does not bypass ownership. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| USER-SEC-017 | BLOCKED | P0 | Presigned URLs do not allow cross-user write. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| USER-SEC-018 | BLOCKED | P0 | Historical URLs expire/remain protected as designed. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| USER-SEC-019 | BLOCKED | P0 | Error responses do not leak private resource existence unnecessarily. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| USER-SEC-020 | BLOCKED | P0 | Cross-user authorization remains enforced after plan changes. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| API-SEC-001 | PASS | P0 | Unauthenticated protected requests denied. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| API-SEC-002 | PASS | P0 | Expired session denied. | — | [evidence/integration.txt](evidence/integration.txt) |
| API-SEC-003 | BLOCKED | P0 | Malformed session denied. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| API-SEC-004 | PASS | P0 | User cannot set own plan. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| API-SEC-005 | PASS | P0 | User cannot set own Admin flag. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| API-SEC-006 | PASS | P0 | User cannot change `userId` ownership. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| API-SEC-007 | PASS | P0 | User cannot change provider subject. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| API-SEC-008 | PASS | P0 | User cannot mark phone verified directly. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| API-SEC-009 | PASS | P0 | User cannot mark job SUCCESS directly. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| API-SEC-010 | PASS | P0 | User cannot inject arbitrary output S3 key. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| API-SEC-011 | BLOCKED | P0 | User cannot change another vehicle ID into job. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| API-SEC-012 | PASS | P0 | User cannot invoke internal dispatch endpoint without authorization. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| API-SEC-013 | PASS | P0 | User cannot invoke cleanup endpoint without authorization. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| API-SEC-014 | BLOCKED | P0 | Unexpected privileged fields rejected/ignored safely. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| API-SEC-015 | PASS | P0 | Invalid enums rejected. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| API-SEC-016 | PASS | P0 | Malformed UUID/ID rejected safely. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| API-SEC-017 | BLOCKED | P0 | Oversized request handled. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| API-SEC-018 | BLOCKED | P0 | Invalid content type handled. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| API-SEC-019 | BLOCKED | P0 | Pagination validated. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| API-SEC-020 | BLOCKED | P0 | Server errors leak no stack/SQL/secrets. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| API-SEC-021 | BLOCKED | P0 | Rate limits function on sensitive endpoints. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| API-SEC-022 | PASS | P0 | CSRF/session protections follow architecture where applicable. | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
| ASYNC-001 | BLOCKED | P1 | DB job created + dispatch succeeds. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-002 | BLOCKED | P1 | DB job created + dispatch fails. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-003 | BLOCKED | P1 | Dispatch succeeds + response times out. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-004 | BLOCKED | P1 | SQS message delivered once. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-005 | PASS | P1 | SQS message delivered twice. | — | [evidence/integration.txt](evidence/integration.txt) |
| ASYNC-006 | BLOCKED | P1 | Lambda starts + crashes before Leonardo. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-007 | BLOCKED | P1 | Lambda calls Leonardo + Leonardo fails. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-008 | BLOCKED | P1 | Leonardo succeeds + Lambda crashes before download. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-009 | BLOCKED | P1 | Leonardo succeeds + output download fails. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-010 | FAIL | P1 | Leonardo succeeds + S3 write fails. | BUG-003 | [evidence/adversarial-final.txt](evidence/adversarial-final.txt), [evidence/security/adversarial-baseline.test.ts](evidence/security/adversarial-baseline.test.ts) |
| ASYNC-011 | BLOCKED | P1 | S3 write succeeds + DB update fails. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-012 | PASS | P1 | DB completion succeeds + Lambda retries. | — | [evidence/unit.txt](evidence/unit.txt) |
| ASYNC-013 | BLOCKED | P1 | Lambda timeout causes SQS redelivery. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-014 | PASS | P1 | Worker receives already-completed job. | — | [evidence/unit.txt](evidence/unit.txt) |
| ASYNC-015 | BLOCKED | P1 | Worker receives nonexistent job. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-016 | BLOCKED | P1 | Worker receives malformed message. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-017 | BLOCKED | P1 | Source S3 object disappears before processing. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-018 | BLOCKED | P1 | User deletes source while queued. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-019 | BLOCKED | P1 | User deletes vehicle while queued. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-020 | BLOCKED | P1 | User deletes source while Lambda running. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-021 | BLOCKED | P1 | Subscription changes while queued. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-022 | BLOCKED | P1 | Subscription expires while queued. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-023 | BLOCKED | P1 | Subscription changes while processing. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-024 | BLOCKED | P1 | 20-image batch partially fails. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-025 | BLOCKED | P1 | Queue backlog delays processing. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| ASYNC-026 | BLOCKED | P1 | Provider rate limit affects subset of batch. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CONCURRENCY-001 | BLOCKED | P1 | Double Process click. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CONCURRENCY-002 | BLOCKED | P1 | Same batch submitted from two tabs. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CONCURRENCY-003 | PASS | P1 | Same source processed simultaneously. | — | [evidence/integration.txt](evidence/integration.txt) |
| CONCURRENCY-004 | PASS | P1 | Process + delete source concurrently. | — | [evidence/integration.txt](evidence/integration.txt) |
| CONCURRENCY-005 | BLOCKED | P1 | Process + delete vehicle concurrently. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CONCURRENCY-006 | BLOCKED | P1 | Studio generation + original deletion concurrently. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CONCURRENCY-007 | BLOCKED | P1 | Phone linking in two tabs. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CONCURRENCY-008 | BLOCKED | P1 | Google linking in two tabs. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CONCURRENCY-009 | BLOCKED | P1 | Phone linked while another session logs in. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CONCURRENCY-010 | BLOCKED | P1 | Admin plan change while user submits process. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CONCURRENCY-011 | BLOCKED | P1 | Plan downgrade while job queued. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CONCURRENCY-012 | BLOCKED | P1 | Plan downgrade while output completes. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CONCURRENCY-013 | PASS | P1 | Two Lambda invocations same job. | — | [evidence/integration.txt](evidence/integration.txt) |
| CONCURRENCY-014 | BLOCKED | P1 | Two cleanup invocations same object. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CONCURRENCY-015 | BLOCKED | P1 | User refresh while batch submission in flight. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CONCURRENCY-016 | BLOCKED | P1 | Logout while processing submission in flight. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CONCURRENCY-017 | BLOCKED | P1 | Two Admin subscription changes concurrently. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| CONCURRENCY-018 | BLOCKED | P1 | User update profile while identity link completes. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DATA-001 | BLOCKED | P1 | User uniqueness constraints correct. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DATA-002 | PASS | P1 | Google provider identity uniqueness correct. | — | [evidence/integration.txt](evidence/integration.txt) |
| DATA-003 | BLOCKED | P1 | Verified phone uniqueness correct. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DATA-004 | BLOCKED | P1 | Vehicle belongs to one intended user. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DATA-005 | BLOCKED | P1 | Upload belongs to intended vehicle/user. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DATA-006 | BLOCKED | P1 | Job belongs to intended user/source. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DATA-007 | BLOCKED | P1 | Output belongs to intended job. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DATA-008 | BLOCKED | P1 | Studio derivative references intended source. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DATA-009 | BLOCKED | P1 | Subscription belongs to intended user. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DATA-010 | PASS | P1 | Identity linking preserves same canonical user. | — | [evidence/integration.txt](evidence/integration.txt) |
| DATA-011 | BLOCKED | P1 | Failed processing preserves source. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DATA-012 | BLOCKED | P1 | Failed Studio generation preserves original. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DATA-013 | BLOCKED | P1 | Deleting derivative does not corrupt source. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DATA-014 | PASS | P1 | Retry does not create uncontrolled duplicate output records. | — | [evidence/integration.txt](evidence/integration.txt) |
| DATA-015 | BLOCKED | P1 | Job status and output state remain consistent. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DATA-016 | BLOCKED | P1 | S3/DB references remain consistent. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DATA-017 | BLOCKED | P1 | Cleanup does not break unrelated records. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DATA-018 | BLOCKED | P1 | Historical jobs remain queryable according to policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DATA-019 | BLOCKED | P1 | Migration preserves identity/subscription/vehicle/job relationships. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| DATA-020 | BLOCKED | P1 | Audit records remain valid after user state changes. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-001 | BLOCKED | P1 | Production does not use local auth bypass. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-002 | BLOCKED | P1 | Production does not use dummy OTP. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-003 | BLOCKED | P1 | Production does not use MinIO. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-004 | BLOCKED | P1 | Production does not use Mailpit. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-005 | BLOCKED | P1 | Production does not use local queue consumer. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-006 | BLOCKED | P1 | Production uses intended S3 bucket. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-007 | BLOCKED | P1 | Production uses intended SQS queue. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-008 | BLOCKED | P1 | Production uses intended Lambda. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-009 | BLOCKED | P1 | Production uses intended AWS region. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-010 | BLOCKED | P1 | Production uses intended DB. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-011 | BLOCKED | P1 | Production Google OAuth callbacks correct. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-012 | BLOCKED | P1 | Production MSG91 configuration correct. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-013 | BLOCKED | P1 | Leonardo production key configured securely. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-014 | BLOCKED | P1 | AWS credentials not exposed to browser. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-015 | BLOCKED | P1 | DB credentials not exposed. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-016 | BLOCKED | P1 | Internal cleanup token not exposed. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-017 | BLOCKED | P1 | Internal dispatcher authorization not exposed. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-018 | BLOCKED | P1 | Debug/internal endpoints follow production policy. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-019 | BLOCKED | P1 | Environment validation fails safely for critical missing configuration. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PROD-020 | BLOCKED | P1 | Client bundle contains no server-only secrets. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-001 | BLOCKED | P1 | S3 bucket region correct. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-002 | BLOCKED | P1 | S3 public-access policy correct. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-003 | BLOCKED | P1 | S3 encryption configured. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-004 | BLOCKED | P1 | SQS queue region correct. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-005 | BLOCKED | P1 | SQS visibility timeout appropriate. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-006 | BLOCKED | P1 | SQS retention appropriate. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-007 | BLOCKED | P1 | DLQ configured/behavior documented. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-008 | BLOCKED | P1 | Lambda region correct. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-009 | BLOCKED | P1 | Lambda architecture/runtime correct. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-010 | BLOCKED | P1 | Lambda memory appropriate. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-011 | BLOCKED | P1 | Lambda timeout appropriate. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-012 | BLOCKED | P1 | Lambda concurrency appropriate. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-013 | BLOCKED | P1 | Lambda IAM follows least privilege. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-014 | BLOCKED | P1 | Lambda can read required S3 inputs. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-015 | BLOCKED | P1 | Lambda can write required S3 outputs. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-016 | BLOCKED | P1 | Lambda can consume intended SQS. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-017 | BLOCKED | P1 | Lambda cannot unnecessarily access unrelated resources. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-018 | BLOCKED | P1 | Worker artifact/package deployable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-019 | BLOCKED | P1 | CloudWatch logs available. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-020 | BLOCKED | P1 | CloudWatch metrics available. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-021 | BLOCKED | P1 | EventBridge/dispatcher trigger correct where used. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| AWS-022 | BLOCKED | P1 | Infrastructure resource names/environments do not cross dev/prod. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OBS-001 | BLOCKED | P2 | Web request receives request/correlation ID. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OBS-002 | BLOCKED | P2 | Processing job has useful job ID. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OBS-003 | BLOCKED | P2 | Request/job correlation preserved into worker where designed. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OBS-004 | BLOCKED | P2 | SQS processing traceable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OBS-005 | BLOCKED | P2 | Lambda invocation traceable to job. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OBS-006 | BLOCKED | P2 | Leonardo failure traceable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OBS-007 | BLOCKED | P2 | S3 failure traceable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OBS-008 | BLOCKED | P2 | DB failure traceable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OBS-009 | BLOCKED | P2 | Dispatch failure traceable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OBS-010 | BLOCKED | P2 | Failed job diagnosable end-to-end. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OBS-011 | BLOCKED | P2 | 5xx errors captured. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OBS-012 | BLOCKED | P2 | Structured logs valid. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OBS-013 | BLOCKED | P2 | Logs contain no OTP. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OBS-014 | BLOCKED | P2 | Logs contain no session token. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OBS-015 | BLOCKED | P2 | Logs contain no Google OAuth secret. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OBS-016 | BLOCKED | P2 | Logs contain no Leonardo key. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OBS-017 | BLOCKED | P2 | Logs contain no AWS credentials. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| OBS-018 | BLOCKED | P2 | CloudWatch metrics reflect processing failures/success where implemented. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PERF-001 | BLOCKED | P2 | Homepage performance reasonable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PERF-002 | BLOCKED | P2 | Dashboard load measured. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PERF-003 | BLOCKED | P2 | Inventory load measured. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PERF-004 | BLOCKED | P2 | Vehicle search measured. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PERF-005 | BLOCKED | P2 | Upload presign latency measured. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PERF-006 | BLOCKED | P2 | Upload commit latency measured. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PERF-007 | BLOCKED | P2 | Single-image Process submission latency measured. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PERF-008 | BLOCKED | P2 | 20-image Process submission latency measured. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PERF-009 | BLOCKED | P2 | Process submission does not synchronously wait for Leonardo. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PERF-010 | BLOCKED | P2 | Job-status update mechanism does not create excessive requests. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PERF-011 | BLOCKED | P2 | Inventory does not exhibit obvious N+1 behavior. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PERF-012 | BLOCKED | P2 | 20-image UI remains responsive. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PERF-013 | BLOCKED | P2 | Lambda cold start measured where possible. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PERF-014 | BLOCKED | P2 | Worker memory usage observed. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PERF-015 | BLOCKED | P2 | DB connection usage inspected for obvious exhaustion risk. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| PERF-016 | BLOCKED | P2 | Production architecture avoids known connection-pool exhaustion under expected serverless patterns. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| BROWSER-001 | BLOCKED | P2 | Chrome desktop critical flow. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| BROWSER-002 | BLOCKED | P2 | Safari/WebKit critical flow. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| BROWSER-003 | BLOCKED | P2 | Firefox critical flow. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| BROWSER-004 | BLOCKED | P2 | Edge/Chromium critical flow. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| BROWSER-005 | BLOCKED | P2 | Mobile Chrome critical flow. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| BROWSER-006 | BLOCKED | P2 | Mobile Safari/WebKit critical flow. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| BROWSER-007 | BLOCKED | P2 | Tablet critical flow. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| BROWSER-008 | BLOCKED | P2 | Homepage responsive. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| BROWSER-009 | PASS | P2 | Auth responsive. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| BROWSER-010 | BLOCKED | P2 | Dashboard responsive. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| BROWSER-011 | BLOCKED | P2 | Inventory responsive. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| BROWSER-012 | BLOCKED | P2 | Upload UI responsive. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| BROWSER-013 | BLOCKED | P2 | Processing dialog responsive. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| BROWSER-014 | BLOCKED | P2 | Profile responsive. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| BROWSER-015 | BLOCKED | P2 | Admin responsive. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| BROWSER-016 | BLOCKED | P2 | No horizontal overflow. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| BROWSER-017 | BLOCKED | P2 | Mobile keyboard does not hide required controls. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| BROWSER-018 | BLOCKED | P2 | Navigation remains usable on mobile. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UX-001 | BLOCKED | P2 | Sign-in keyboard accessible. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UX-002 | BLOCKED | P2 | OTP form keyboard accessible. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UX-003 | BLOCKED | P2 | Upload flow keyboard accessible. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UX-004 | BLOCKED | P2 | Processing dialog keyboard accessible. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UX-005 | BLOCKED | P2 | Profile keyboard accessible. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UX-006 | BLOCKED | P2 | Fields labeled. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UX-007 | BLOCKED | P2 | Validation understandable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UX-008 | BLOCKED | P2 | Dialog focus correct. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UX-009 | BLOCKED | P2 | Buttons have accessible names. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UX-010 | BLOCKED | P2 | Loading state clear. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UX-011 | BLOCKED | P2 | Processing state clear. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UX-012 | BLOCKED | P2 | Failed state clear. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UX-013 | BLOCKED | P2 | Empty inventory state useful. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UX-014 | BLOCKED | P2 | Destructive actions confirmed where appropriate. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UX-015 | BLOCKED | P2 | Disabled actions understandable. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| UX-016 | BLOCKED | P2 | Long processing does not appear as frozen application. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SEO-001 | PASS | P2 | Homepage title correct. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| SEO-002 | PASS | P2 | Homepage description correct. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| SEO-003 | PASS | P2 | Canonical correct. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| SEO-004 | BLOCKED | P2 | robots.txt correct. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SEO-005 | BLOCKED | P2 | sitemap correct. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SEO-006 | PASS | P2 | favicon correct. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| SEO-007 | PASS | P2 | social metadata correct. | — | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| SEO-008 | BLOCKED | P2 | production Search Console verification remains configured where intended. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SEO-009 | BLOCKED | P2 | authenticated/private pages not unintentionally indexed. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SEO-010 | FAIL | P2 | invalid URLs use custom 404. | BUG-009 | [evidence/studiocar-exploration-3.json](evidence/studiocar-exploration-3.json), [evidence/mobile/exploratory-home.png](evidence/mobile/exploratory-home.png) |
| GOLDEN-001 | BLOCKED | P1 | New Google user → login → upload → process → FREE preview. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOLDEN-002 | BLOCKED | P1 | New phone user → OTP → Create Account → upload → process → FREE preview. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOLDEN-003 | BLOCKED | P1 | New phone user → OTP → Link Google → same account → process. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOLDEN-004 | BLOCKED | P1 | Google user → Profile → link phone → logout → phone login → same account/data. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOLDEN-005 | BLOCKED | P1 | Phone user → Profile/link Google → logout → Google login → same account/data. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOLDEN-006 | BLOCKED | P1 | FREE → process → preview only → attempted HQ bypass denied. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOLDEN-007 | BLOCKED | P1 | Admin upgrades FREE → PRO → user receives correct PRO entitlement. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOLDEN-008 | BLOCKED | P1 | PRO → upload 20 images → Process → queue → Lambda → Leonardo → outputs → UI. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOLDEN-009 | BLOCKED | P1 | PLUS → upload/process → HQ outputs. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOLDEN-010 | BLOCKED | P1 | Processed image → Studio generation → new Studio output. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOLDEN-011 | BLOCKED | P1 | Processing job → Lambda failure → retry/recovery → valid final state. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOLDEN-012 | BLOCKED | P1 | Duplicate SQS delivery → exactly one logical successful job/output. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOLDEN-013 | BLOCKED | P1 | User logs out while processing → logs back in → correct processing/result state. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| GOLDEN-014 | BLOCKED | P1 | Cross-user attack across vehicle/upload/job/output → all denied. | — | [PRE-EXECUTION-AUDIT.md](PRE-EXECUTION-AUDIT.md) |
| SEC-DISC-001 | FAIL | P0 | FREE ORIGINAL resolution restriction | BUG-001 | [evidence/adversarial-final.txt](evidence/adversarial-final.txt), [evidence/security/adversarial-baseline.test.ts](evidence/security/adversarial-baseline.test.ts) |
| SEC-DISC-002 | FAIL | P0 | Current FREE historical HQ signing | BUG-002 | [evidence/adversarial-final.txt](evidence/adversarial-final.txt), [evidence/security/adversarial-baseline.test.ts](evidence/security/adversarial-baseline.test.ts) |
| LEONARDO-DISC-001 | FAIL | P1 | Successful provider call before durable staging | BUG-003 | [evidence/adversarial-final.txt](evidence/adversarial-final.txt), [evidence/security/adversarial-baseline.test.ts](evidence/security/adversarial-baseline.test.ts) |
| ASYNC-DISC-001 | PASS | P1 | Twenty mixed terminal jobs plus redelivery | — | [evidence/adversarial-final.txt](evidence/adversarial-final.txt) |
| ASYNC-DISC-002 | FAIL | P1 | Final exhausted published job with no remaining delivery | BUG-004 | [evidence/adversarial-final.txt](evidence/adversarial-final.txt), [evidence/security/adversarial-baseline.test.ts](evidence/security/adversarial-baseline.test.ts) |
| DATA-DISC-001 | FAIL | P2 | Equivalent ORIGINAL floor renderings split version keys | BUG-005 | [evidence/unit.txt](evidence/unit.txt) |
| AWS-DISC-001 | FAIL | P2 | Default visibility meets sixfold timeout recommendation | BUG-006 | [AWS-INFRA-QA.md](AWS-INFRA-QA.md) |
| UI-DISC-001 | FAIL | P2 | Inventory browser timing sensitivity | BUG-007 | [evidence/e2e-first.txt](evidence/e2e-first.txt) |
| SEC-DISC-003 | BLOCKED | P2 | Provider result arbitrary HTTPS destination/SSRF policy | — | [LEONARDO-QA.md](LEONARDO-QA.md) |
| ASYNC-DISC-003 | BLOCKED | P0 | Staged paid cutout reused across plan downgrade | — | [PLAN-ENTITLEMENT-MATRIX.md](PLAN-ENTITLEMENT-MATRIX.md) |
| DATA-DISC-002 | BLOCKED | P1 | Processed/staged/orphan retention reconciliation | — | [FAILURE-RECOVERY.md](FAILURE-RECOVERY.md) |
| AWS-DISC-002 | BLOCKED | P1 | Production trusted recovery scheduler deployed and monitored | — | [PRODUCTION-CONFIG-QA.md](PRODUCTION-CONFIG-QA.md) |
| UI-DISC-002 | PASS | P2 | Homepage desktop/tablet/mobile overflow and smoke | — | [evidence/studiocar-exploration-1.json](evidence/studiocar-exploration-1.json) |
| AUTH-DISC-001 | PASS | P0 | Local Google→phone link and canonical relogin | — | [evidence/studiocar-exploration-2.json](evidence/studiocar-exploration-2.json) |
| AUTH-DISC-002 | PASS | P0 | Local phone→Google link and canonical relogin | — | [evidence/studiocar-exploration-3.json](evidence/studiocar-exploration-3.json) |
| UI-DISC-003 | FAIL | P2 | Public workflow limit matches plan catalog | BUG-008 | [evidence/studiocar-exploration-3.json](evidence/studiocar-exploration-3.json) |
| UI-DISC-004 | FAIL | P2 | Custom StudioCar invalid-route experience | BUG-009 | [evidence/studiocar-exploration-3.json](evidence/studiocar-exploration-3.json) |
| SEC-DISC-004 | PASS | P0 | Direct HTTP authorization and privileged-field attack matrix | — | [evidence/security/direct-api-attacks.json](evidence/security/direct-api-attacks.json) |
