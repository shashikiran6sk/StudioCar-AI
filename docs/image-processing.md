# Image processing

This is the canonical reference for how StudioCar turns an uploaded vehicle
photo into a studio image. The audit behind the current design is in
[`audits/2026-09-30-leonardo-migration-audit.md`](./audits/2026-09-30-leonardo-migration-audit.md);
the pixel evidence for each option is in
[`evidence/processing-options/README.md`](./evidence/processing-options/README.md).

## Architecture

```
Browser ──signed PUT──▶ private S3 (original)
   │
   └─ POST /api/jobs ─▶ Application service ─▶ PostgreSQL (job + outbox row)
                                │  after(): publish outbox
                                ▼
                              SQS (one message per image, batch size 1)
                                │
                                ▼
          Lambda (arm64): ProcessingWorker ─▶ ProcessingJobExecutor
                                │                 │
                                │                 ├─▶ ImageProcessingProvider
                                │                 │      └─ LeonardoProvider (Sync API)
                                │                 ├─▶ StudioCar compositor (sharp)
                                │                 └─▶ private S3 (output + preview)
                                ▼
                      PostgreSQL (atomic, idempotent completion + usage)
   ▲
   └─ GET /api/jobs (adaptive polling, coalesced) ◀── browser
```

Layering follows `AGENTS.md`: product code (`apps/web`) knows only the
provider-neutral contracts in `packages/contracts` and the job lifecycle in
`packages/processing`. The provider port is
`ImageProcessingProvider.removeBackground(BackgroundRemovalRequest)` in
`packages/processing/src/image-processing-provider.types.ts`. Its only adapter
is `workers/image-processing/src/providers/leonardo-provider.ts`.

Nothing in a user-facing request calls the provider. The web tier never holds
the Leonardo key.

## Lifecycle and retries

The retry and idempotency semantics did not change in the migration:

| Concern | Mechanism |
| --- | --- |
| Delivery | SQS, at least once, batch size 1, `ReportBatchItemFailures` |
| Exclusivity | Claim lease (`IMAGE_WORKER_CLAIM_TTL_MS`, default 180 s) written in one transaction with the attempt row |
| Retries | Durable, in PostgreSQL: `5 s · 2ⁿ` with jitter, capped at 300 s, at most 5 attempts |
| Provider back-off | A `Retry-After` from Leonardo raises the next delay (never shortens it, never exceeds the cap) |
| Completion | Atomic and idempotent: the output, job, asset, vehicle and usage event commit together once |
| Paid-result reuse | The staged cutout `provider-cutout.webp` is reused on a later attempt if its checksum matches |

The adapter does not retry generations. It classifies each failure once, and
the worker's durable policy decides what happens next, so no second retry
mechanism competes with SQS and the outbox.

**Leonardo charges for every Sync call that returns HTTP 200**, whether or not
StudioCar can use the result. Two rules keep a retry from paying twice:

- A paid response that cannot be read or validated, or an output that fails
  validation, is terminal (`PROVIDER_UNUSABLE_RESULT`). The same response would
  fail the same way on every retry.
- Downloading a paid result is retried inside the attempt, up to three
  fetches with pauses of 1 s and 2 s, under the same deadline. This applies
  only to network errors and 408, 429 and 5xx statuses. A brief CDN failure
  therefore never costs a new generation.

## Leonardo request

`POST https://cloud.leonardo.ai/api/rest/v2/generationssync`, with a Bearer
token, `redirect: "error"`, and one abort deadline (`LEONARDO_TIMEOUT_MS`,
default 90 s) covering both the generation and the result download.

```json
{
  "model": "remove-bg",
  "public": false,
  "ephemeral": true,
  "parameters": {
    "size": "preview | auto",
    "type": "car",
    "format": "webp",
    "channels": "rgba",
    "crop": false,
    "shadow_type": "car",
    "semitransparency": true,
    "guidances": {
      "image_reference": [{ "image": { "type": "URL", "url": "<presigned S3 GET>" } }]
    }
  }
}
```

- `background_image_reference` is never sent. StudioCar composes its own
  backgrounds, so the car and Leonardo's shadow arrive on transparency.
- The source URL is a presigned S3 GET that expires after 15 minutes
  (`LEONARDO_SOURCE_URL_TTL_SECONDS`). Each attempt mints a new one. It is
  never persisted, queued, returned or logged. The structured logger accepts
  only allow-listed identifier fields, so a URL cannot be logged even by
  mistake.
- The response wraps the generation in a `generateSync` envelope. A body
  without the envelope is read the same way:

  ```json
  {
    "generateSync": {
      "id": "…",
      "blockedCount": 0,
      "cost": { "amount": "0.0269", "unit": "DOLLARS" },
      "results": [
        { "contentType": "image/webp", "url": "<30-minute presigned URL>", "dataB64": null, "width": 620, "height": 403 }
      ]
    }
  }
  ```

  Only `results` must be well formed. A missing, `null` or malformed id, cost,
  moderation count or optional result field reads as absent, so it can never
  discard a result that has already been paid for. An empty `results` with
  `blockedCount > 0` is moderated content.
- The temporary result is downloaded straight away, without the API key. It
  is size-bounded and must be WebP with alpha, at the reported dimensions and
  within the pixel limit. Only then is it staged to StudioCar's private S3.
  The URL must be fetched exactly as returned: changing its query string
  breaks the S3 signature (`SignatureDoesNotMatch`).

### Output resolution is server-side only

The worker reads the owner's durable Plus purchase entitlement inside the claim
transaction. Purchased credits never expire; it maps that entitlement to a quality tier:

| Plan | Tier | Leonardo `size` |
| --- | --- | --- |
| FREE, or no purchase | STANDARD | `preview` |
| PLUS | HIGH | `auto` |

`PLAN_PROCESSING_QUALITY_TIERS` is declared with `satisfies Record<PlanKey, …>`,
so the compiler forces a decision for every new plan. The request contract is
`.strict()`, so a browser that sends `size`, `quality` or any other field gets
`400` and never reaches the worker. This is covered by tests in
`tests/unit/contracts/processing.test.ts` and in the worker-repository
integration tests.

## Failure handling

| Leonardo outcome | Category | Job failure kind | Retried |
| --- | --- | --- | --- |
| 401 / 403 | AUTHORIZATION | AUTHORIZATION | no |
| 402 | PAYMENT_REQUIRED | PAYMENT_REQUIRED | no |
| 408 or local deadline | TIMEOUT | TIMEOUT | yes |
| 429 | RATE_LIMITED | PROVIDER_429 (honours `Retry-After`) | yes |
| 5xx | SERVER_ERROR | PROVIDER_5XX | yes |
| Other 4xx | REJECTED | INVALID_REQUEST | no |
| 200 with an unreadable body, invalid JSON or malformed `results` | INVALID_RESPONSE | UNUSABLE_PROVIDER_RESULT | no (already paid) |
| 200 with no or several results, or a missing or non-HTTPS URL | INVALID_RESPONSE | UNUSABLE_PROVIDER_RESULT | no (already paid) |
| Result marked `nsfw` or `blocked`, or no results with `blockedCount > 0` | CONTENT_BLOCKED | CONTENT_BLOCKED | no |
| Download still failing after three fetches (network, 408, 429 or 5xx), or another non-2xx | DOWNLOAD_FAILED | NETWORK | yes |
| Wrong content type, not WebP+alpha, wrong size | INVALID_OUTPUT | UNUSABLE_PROVIDER_RESULT | no (already paid) |
| Fetch rejected (DNS, reset) | NETWORK | NETWORK | yes |
| Presigner failure or invalid URL | SOURCE_UNAVAILABLE | NETWORK | yes |
| Cutout with no vehicle body | (executor) | NON_CAR_IMAGE | no |

An expired source URL cannot happen inside one attempt: the URL lives far
longer than the deadline. If Leonardo reports one anyway, it surfaces as a
non-retried 4xx or a retried 5xx depending on the status, and the next attempt
mints a fresh URL.

People see only the existing failure reasons, such as "Background removal
failed". Leonardo status codes, messages and generation IDs stay in
operator-only fields.

When a response fails validation, `provider_request_failed` names where and
how, never the value:

- `responseIssuePath`: a field path such as `results` or `results.0`, or
  `root` for the body as a whole;
- `responseIssueCode`: an issue code such as `invalid_type`, `invalid_json`
  or `unreadable_body`.

These are enough to match the adapter to a changed response shape without
logging a URL or a body.

The generation is logged (`provider_generation_charged`, with the reported
cost) **before** the download. A result that fails afterwards has still been
paid for. The Sync API has no idempotency key, so a crash between charge and
staging can lead to one more paid call on retry. That window is logged, not
hidden.

## Backgrounds

There are six packaged 3840×2160 artworks in
`workers/image-processing/assets/backgrounds/`:

| Option | PLAIN | FLOOR (HORIZON) | Floor seam (row) |
| --- | --- | --- | --- |
| Premium white | `premium-white-plain.png` | `premium-white-floor.png` | 1494 |
| Grey studio | `grey-studio-plain.png` | `grey-studio-floor.png` | 1474 |
| Dark studio | `dark-studio-plain.png` | `dark-studio-floor.png` | 1471 |

`grey-studio-floor.png` came from a truncated source file. The rows that
decoded (0–2034) are exact. The bottom 125 rows of plain floor were mirrored
from the rows above them, where the floor is a smooth gradient. A clean
re-export from the designer should replace it.

The original-background option keeps the photo itself and makes no provider
call.

## Compositor

The compositor lives in `workers/image-processing/src/execution/compose-studio-image.ts`.
It runs in this order:

1. **Measure from alpha.** Pixels with alpha ≥ 128 are the vehicle body: they
   give the tyre line and the vehicle size. Pixels with alpha ≥ 8 are content,
   which includes most of Leonardo's shadow. A body covering less than 0.2 % of
   the frame means no vehicle was found.
2. **Frame**, with one uniform scale. Width and height are never scaled
   independently, so the vehicle never stretches.
   - **Maintain composition:** the photo's own frame at its own scale, with
     padding added as background.
   - **Fit to vehicle:** a fixed 1600×1200 canvas with the content centred
     inside the padding. Enlargement is capped at 1.3×.
   - **Square:** 1600×1600, likewise.
3. **Place the background** with "cover" scaling, never stretched. A floor
   artwork is positioned so that its wall/floor seam sits at
   `tyreLine − 0.3 × vehicleHeight`. Every tyre of a three-quarter view
   therefore stands on the floor. A plain artwork is centred.
4. **Draw the vehicle with Leonardo's shadow**, and no other shadow. StudioCar
   draws no shadow of its own, which removes the old double shadow.
5. **Image Enhancement** (optional) stretches the levels of the vehicle's own
   pixels between its 1st and 99th percentiles, with gain capped at 1.5. It
   then sharpens with the vehicle's alpha as a mask, inside the content box.
   Background pixels are byte-identical with enhancement on or off.
6. **Encode once** as WebP: quality from the option, effort 4,
   `smartSubsample`, metadata stripped. The preview is derived from the same
   render, so there is no second provider call.

The intermediate cutout stays RGBA end to end. Only the final opaque
composite drops alpha.

## Options

| Option | Values | Notes |
| --- | --- | --- |
| `background` | PREMIUM_WHITE, GREY_STUDIO, DARK_STUDIO, ORIGINAL | ORIGINAL requires `crop: MAINTAIN_COMPOSITION` |
| `floor` | PLAIN, HORIZON | |
| `enhancement` | boolean | Vehicle only |
| `crop` | MAINTAIN_COMPOSITION, FIT_VEHICLE, SQUARE | |
| `paddingPercent` | 0–40 (default 8) | |
| `quality` | 60–100 (default 90) | WebP quality |

Removed: `platePrivacy` (Hide Number Plate), `shadow` (Leonardo now owns the
shadow) and `outputFormat` (always WebP). Rows stored before the migration
still parse through `StoredProcessingOptionsSchema`, which drops these keys
and normalizes an ORIGINAL background to Maintain Composition.

## Configuration

| Variable | Where | Default | Notes |
| --- | --- | --- | --- |
| `LEONARDO_API_KEY` | Worker only | — | Required; from Secrets Manager in AWS |
| `LEONARDO_TIMEOUT_MS` | Worker | 90000 | 1000–150000; covers generation and download |
| `IMAGE_WORKER_CLAIM_TTL_MS` | Worker | 180000 | Must be at least the Leonardo timeout plus 30 s (validated) |

Lambda timing (`infrastructure/aws/image-processing-worker.yml`):

- Lambda timeout: 180 s (minimum 150).
- Queue visibility timeout: greater than the Lambda timeout, as before.
- Duration alarm: 150 s.

Reserved and event-source concurrency are unchanged.

## Observability

Metrics are emitted under `StudioCarAI/Operations` and carry no per-job
dimensions:

- **Provider:** requests, latency, success, and failures by category, with
  dedicated 429, 5xx and timeout counters, plus the reported cost.
- **Stage failures:** SOURCE, PROVIDER, COMPOSITION and STORAGE.
- **Durations:** processing duration and end-to-end duration.

Alarms and the dashboard section are defined in
`infrastructure/aws/observability.yml`. See [`observability.md`](./observability.md).

## Runbook

| Symptom | Check |
| --- | --- |
| Spike in `ProviderRateLimited` | Leonardo plan limits; jobs back off automatically and complete later |
| `PROVIDER_AUTHORIZATION_FAILED` on every job | Rotate or restore the `LeonardoSecretArn` secret; failures are terminal, so retry affected batches afterwards |
| `PROVIDER_PAYMENT_REQUIRED` | Top up Leonardo API credit; failures are terminal |
| Timeouts | Compare `ProviderLatency` p99 with `LEONARDO_TIMEOUT_MS`; raise both it and the claim TTL together |
| Composition failures | Lambda memory and duration; the asset table and `assets/backgrounds` in the ZIP |
| Wrong resolution for a paid plan | The lifetime PURCHASE_GRANT or positive ADMIN_ADJUSTMENT ledger entry |

## References

- [Leonardo.Ai Remove Background](https://docs.leonardo.ai/docs/remove-bg)
- [Migrate from remove.bg to Leonardo.Ai](https://docs.leonardo.ai/docs/migrate-from-the-removebg-api-to-leonardoai)
