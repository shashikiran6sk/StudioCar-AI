# Storage security

Private object keys are persisted, not permanent URLs. Browser uploads use short-lived signed PUT including checksum/type/metadata. Commit validates expected metadata and bounded headers; the worker fully decodes and verifies size/checksum before provider execution. Inventory signs preview keys; portfolio signs original/full-output/preview/download after tenant repository lookup. Keys are deterministic per job for cutout, output and preview.

CloudFormation declares block-public-access, bucket owner enforcement, encryption and deny-insecure-transport. Those declarations do not prove effective deployed policy, CORS, ACLs, IAM or account/region. AWS storage checks are BLOCKED. Browser image reads are intercepted; adapter storage in fault tests is in memory. No S3 objects were written/deleted during certification.

BUG-001 bypasses output quality restriction in ORIGINAL processing. BUG-002 signs historical HQ without current entitlement. Signed S3 URLs are bearer access and remain reusable by anyone who obtains them until expiry; the canonical FREE reuse-PRO-URL attack needs a product decision and live test. Entitlement changes do not revoke existing signatures, and expiration does not prove immediate revocation. Never commit signatures; no browser traces/storageState containing session tokens are included.
