# Leonardo background-removal adapter

The existing `BackgroundRemovalProvider.process` boundary accepts validated
source bytes and returns image bytes or the worker's classified failure. The
executor validates the original, stages `provider-result.webp` in private S3,
renders the studio output, derives its preview locally, and completes the job.
This boundary and the durable queue retry policy remain in place.

Leonardo uses the additive `sourceObjectKey` input. The composition root injects
an S3 GET signer into the adapter; after source validation the adapter resolves
that private key to a five-minute HTTPS URL. No URL reaches the database,
queue, product UI, logs, or final provider result. Local MinIO URLs cannot be
fetched by Leonardo: use the Development AWS bucket for real provider tests.

| Existing contract | Leonardo mapping |
| --- | --- |
| Validated source / private original key | `parameters.guidances.image_reference[0].image`, `type=URL` |
| Provider credentials | Worker-only `LEONARDO_API_KEY`, Bearer header |
| Transparent automotive cutout | `model=remove-bg`, `type=car`, `format=webp`, `channels=rgba`, `semitransparency=true` |
| Shadow treatment | Provider always sends `shadow_type=none`; final local treatment remains the renderer's responsibility |
| Production resolution | `size=full`; development experiment also tests `preview` and `50MP` |
| Response bytes | Validate JSON, immediately download temporary URL, fully decode, return WebP bytes |
| Request identity | Response `id` becomes `providerRequestId` and S3 metadata |
| Reported cost/dimensions | Sanitized `leonardo_generated` structured log, including failed subsequent downloads |
| Job retry | Existing worker policy; no adapter retry loops |

`public=false` and `ephemeral=true` are explicit. Download requests carry no
Authorization header. Both exchanges reject redirects; JSON and image streams
have hard byte ceilings. Result content type, decoded format, alpha channel,
dimensions (when supplied), frame count, and pixel limit are validated before
S3 persistence. Supported PNG responses are losslessly converted to WebP so
the existing artifact extension remains accurate.

401/403 and payment refusal are terminal; other invalid requests, malformed
responses, missing/empty results, missing URLs, unsupported types, and invalid
downloaded images are terminal validation failures. 429, 5xx, timeout, network
and failed temporary downloads use the existing transient taxonomy. S3 failures
remain executor failures; a previously staged cutout is reused on retry.

## Selection and deployment

Production still defaults to `removebg`. Select Leonardo by setting
`BACKGROUND_REMOVAL_PROVIDER=leonardo` consistently in the control plane and
worker, and configure `LEONARDO_API_KEY` only in the worker. Optional
`LEONARDO_TIMEOUT_MS` defaults to 60000 and accepts 1000–120000. The existing
`REMOVEBG_API_KEY` name is retained for rollback (not `REMOVE_BG_API_KEY`).

Apply migration `20260927100000_add_leonardo_provider` before selecting it;
it adds a PostgreSQL enum value without changing existing rows. Deploy the
worker archive with its production dependencies, including
`@aws-sdk/s3-request-presigner`. The Lambda template's
`BackgroundRemovalProvider` parameter defaults to removebg and validates the
selected `RemoveBgSecretArn` or `LeonardoSecretArn`. It injects only the
selected provider secret. This PR deploys no infrastructure or secrets.

Logs identify provider, generation, job, asset, vehicle, attempt, size, format,
width, height, duration and reported cost amount/unit. They omit source/result
URLs, request bodies, headers, image bytes and credential values. Query
`leonardo_started`, `leonardo_generated`, `leonardo_completed` and
`leonardo_failed` for call counts, costs, latency and classified failures.

## Development cost experiment

With the Development AWS source already uploaded and credentials configured:

```sh
pnpm cost:leonardo <development-source-object-key> /tmp/leonardo-cost.json
```

This development-only command performs exactly three sequential paid calls
against the same original, using preview/full/50MP, and writes the measured
dimensions, normalized content type, reported cost, latency and downloaded
file size. No key or signed URL belongs in command arguments. The entry refuses
other environments and never forms part of the Lambda handler bundle.

**Live measurements are pending:** no Leonardo credential was available during
implementation. No equivalence of prices is assumed. If measured costs are
equal, retain one high-quality provider call and derive application previews
locally. The executor already derives previews without another provider call.
Cross-job reuse for new studio options is a separate cutover prerequisite:
the current staging key is job-scoped, not source-scoped.

A termination during generation/download, or an S3 failure before staging,
can leave a paid result without a durable copy. The documented sync API has no
true idempotency/reconciliation key. This adapter does not claim exactly-once
external billing across that uncertainty; the queue's attempt bound still
applies and charged generations are logged before download.

## Official references

- [Remove BG request and response](https://docs.leonardo.ai/docs/remove-bg)
- [remove.bg migration mapping](https://docs.leonardo.ai/docs/migrate-from-the-removebg-api-to-leonardoai)
- [remove.bg API](https://www.remove.bg/api)
