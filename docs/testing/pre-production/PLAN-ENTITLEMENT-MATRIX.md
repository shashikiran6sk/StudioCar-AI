# Plan entitlement matrix

Actual keys are FREE / STUDIO_PRO / STUDIO_PLUS, not PRO / PLUS. Defaults below come from `apps/web/src/server/plans/default-plan-configurations.ts`. Deployed database `PlanConfig` rows can override them; no production catalog was provided. Historical monthly STUDIO_PLUS subscriptions are explicitly retired by migration before the former STUDIO_PACK adopts this key.

| Capability | FREE | STUDIO_PRO | STUDIO_PLUS |
|---|---|---|---|
| Default price | ₹0 | ₹3,999/month | ₹1,499 one-time |
| Image allowance | 15 lifetime | 500 / billing period | 100 lifetime |
| Batch cap | 5 | 20 | 20 |
| Storage display default | 3 GB | null/no configured cap | null/no configured cap |
| Upload / process | Allowed within server quota | Allowed within server quota | Allowed within server quota |
| Studio provider size | preview (STANDARD) | auto (HIGH) | auto (HIGH) |
| Inventory preview | Signed owned preview | Signed owned preview | Signed owned preview |
| Full output signer | Signs owned object regardless of current plan | Same | Same |
| ORIGINAL background | Original dimensions, no tier resize (BUG-001) | Original dimensions | Original dimensions |
| Historical paid HQ after expiry/downgrade | Still signed (BUG-002) | Still signed | Still signed |
| Studio versions / reprocessing | Same original, new jobs/quota | Same | Same |
| Checkout | Unavailable | Unavailable | Unavailable |
| Admin assignment | Fallback when none active | Manual supported | Manual supported |

Submission quota reservation is serialized per user and counts unfinished jobs as reserved capacity. Worker resolution uses the subscription **at claim time**, not request time. Completion stores a generic ProcessedAsset with dimensions/keys, without an output quality tier. Portfolio access checks ownership but does not query entitlement. Staged cutouts are reused without recording/revalidating tier, so a downgrade across retries needs additional testing.

Preview provider selection alone is insufficient to enforce the user's FREE-only-preview requirement on all output branches and historical downloads. Existing design guidance says to retain downloads after limits; historical entitlement policy must be resolved explicitly. No decision was inferred from old documentation or used to turn a failure into PASS. Storage byte allowance enforcement and paid credit expiry rules also need product/deployed verification.
