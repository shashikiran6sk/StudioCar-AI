# API security

Authentication is rechecked in protected handlers; same-origin checks guard cookie-authenticated mutations. Canonical Zod schemas reject invalid commands; routes call services, tenant queries and rate-limit repositories. Profile writes displayName only; subscription/admin role writes require fresh database admin authorization. Identity subject ownership is supplied by provider/server proof, not editable profile fields.

Executed: direct normal-user admin browser denial; unit processing/upload cross-origin and unauthenticated refusal; phone-account forged fields/proof-cookie refusal; link ownership collisions; protected dispatch/storage-cleanup tokens; tenant job-status refusal; real DB foreign-asset reservation refusal. Per-assertion evidence is indexed in `assertion-mapping.json`.

Remaining: comprehensive mass assignment on every handler, oversized bodies, bad content types, all malformed UUID/enums/pagination variants, response-existence leaks, revoked-session races, production request rate limits and every direct output route. Same-origin defenses are not a replacement for signed-URL entitlement. BUG-002 demonstrates signing HQ on an owned historical output after cancellation. No cross-user takeover or admin bypass was established by this run; untested attacks remain BLOCKED.
