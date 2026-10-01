# Identity matrix

`User.id` is canonical. `AuthIdentity(provider, providerSubject)` is globally unique; Google email and primary profile contacts cannot silently merge accounts. Both primary contacts are unique nullable columns. Linking refuses identity/contact ownership conflicts, retaining subscription/vehicle/job ownership. OTP proof is browser-bound, expiring, consumed once; raw OTP is not sent to the server in the real MSG91 flow.

| Initial identity | Operation | Implementation | Evidence / remaining boundary |
|---|---|---|---|
| Google only | Link unowned verified phone | Phone advisory lock + challenge transaction; preserve User.id | DB integration + local exploratory browser; real MSG91 blocked |
| Phone only | Link unowned Google subject | Protected linkUserId; callback requires same current session | DB integration and service tests; real Google blocked |
| New verified phone | Google existing identity | Attach phone to canonical existing Google user transactionally | verified-phone-google-repository integration |
| New verified phone | Create name+phone account | Consume browser proof, create identity/user/session atomically | phone-account-repository concurrent replay + local browser |
| A Google | B owned phone | IdentityTaken/ContactTaken refusal | auth-identity-link-repository integration |
| A phone | B owned Google | Refuse; no merge or transfer | same integration and local browser collision observation where captured |
| Same user | Same identity again | AlreadyLinked success | repository/service assertions |
| Two callers | Same link concurrently | One identity; uniqueness/advisory locking | repository concurrent assertion; exact two-tab races still blocked |
| Any | Unlink last method | No unlink operation exists | IDENTITY-010/011 NOT_APPLICABLE |

Personas use synthetic identities only. FREE-GOOGLE, FREE-PHONE, FREE-LINKED, PRO-GOOGLE, PRO-PHONE, PRO-LINKED, PLUS-GOOGLE, PLUS-PHONE, PLUS-LINKED, ADMIN, ACCOUNT-A and ACCOUNT-B are named in the fixture manifest and owner UAT. Database-seeded identities are not proof of successful external provider authentication.
