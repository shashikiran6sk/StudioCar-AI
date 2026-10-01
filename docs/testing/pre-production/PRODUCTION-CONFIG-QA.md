# Production configuration QA

APP_ENV is mandatory and independent of NODE_ENV. Profiles permit fake Google/OTP, MinIO, ElasticMQ and local worker only in local; development uses real providers/storage/queue with local dispatcher/worker; production rejects local adapters. Focused Zod parsers validate secret ownership, local credential/endpoint isolation, names and HTTPS Google callback. The production worker references DATABASE_URL and Leonardo key via Secrets Manager.

Local environment selected APP_ENV=local with no Leonardo key, no external Google/MSG91/AWS credentials. Browser build ran NODE_ENV=production under the local infrastructure profile. That is **not** a Vercel production deployment. No production hostname/project/environment, DB provider/region, AWS account/region, queue/bucket/Lambda version or effective secrets were available. All deployed PROD checks remain BLOCKED.

Source audit does not prove environment account isolation: similarly named resources can exist in wrong accounts/regions, validators cannot prove ownership, and templates accept independently supplied ARNs/URLs. Production trusted scheduler and alert subscription remain external deployment requirements. Existing context states production has not been deployed; this run independently lacks deploy evidence and does not assume that sentence proves current AWS state.
