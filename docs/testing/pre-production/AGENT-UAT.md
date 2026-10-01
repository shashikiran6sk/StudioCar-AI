# Agent exploratory UAT

This is automation-assisted **agent browser exploration**, distinct from the existing Playwright suite and from product-owner human sign-off. Human UAT remains PENDING. Screenshots were inspected by the agent, including mobile homepage, linked profile and collision failure.

| Interaction | Observed local outcome | Evidence |
|---|---|---|
| Resize/scroll homepage1440/768/390 | HTTP200; no document overflow | exploration1 JSON + desktop/tablet/mobile frames |
| Fake Google sign-in | Application challenge/callback/session path to Dashboard | google/local-fake-google-dashboard.png |
| Profile link phone, wrong then correct code | Wrong code visible refusal; linked identities Connected | exploration2 JSON + account-linking frame |
| Logout then phone login | Same canonical user, one account | exploration2 DB equality/count |
| New phone account tries owned Google | Recoverable auth error displayed; no silent merge | local-collision-refused.png; repository collision assertions |
| Link Google after explicit old synthetic fixture cleanup | Same phone-user ID; Google login shows expected name/phone | exploration3 JSON + local-phone-google-linked.png |
| Empty vehicle form / Escape / refresh | Required input prevented progress; dialog cancelled; reload Dashboard | exploration2 JSON |
| Direct normal-user Admin | Denied; local404 | exploration2 JSON + existing admin browser tests |
| Workflow vs Pricing | Free3 vs5 mismatch FAIL BUG-008 | inspected mobile screenshot + exploration3 |
| Invalid route | Generic Next404 FAIL BUG-009 | exploration3 JSON |
| Direct API attacker payloads | 27/27 safe scoped local checks passed | security/direct-api-attacks.json |

The first name observation used innerText, which excludes input values; the final check reads Display name input value and confirms the name. A streamed unavailable portfolio response can be HTTP200 with a not-found document; the direct attack verifies absence of the foreign vehicle name and confirms API404 denials instead of treating status alone as authorization proof. These are harness interpretations, not hidden product repairs.

Existing browser suite: desktop/mobile auth, profile/logout-all, Admin price/manual subscription/footer, inventory/portfolio/gallery/download using intercepted synthetic images, mobile drawer and public SEO. Baseline timeout preserved, focused retest and full serial regression passed unchanged. No suite result is described as human sign-off.

Blocked exploration: real S3 uploads and interrupted commits, complete20-image funded processing/download, real Google/MSG91 browser authentication/linking, production stale sessions, actual paid historical object attack, live DLQ recovery, Safari/Firefox/mobile keyboard/touch, exhaustive Back/Forward/new-tab/double-click schedules and full accessibility. Future browser work must carry each remaining canonical ID and sanitized evidence rather than infer PASS from shell/navigation screenshots.
