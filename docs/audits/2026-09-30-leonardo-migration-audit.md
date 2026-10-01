# Image-processing audit before the Leonardo-only migration

Audited on 30 September 2026 against `main` at `10c1c52`. Every statement below
was traced in source, tests, templates or rendered pixels rather than inferred
from file names or earlier documentation. This is the record of the system
*before* the migration; [image-processing.md](../image-processing.md) describes
the system after it.

## 1. Provider architecture

The domain port is `BackgroundRemovalProvider` in `packages/processing`
(`process(ProcessImageInput) → ProcessImageResult`). Adapters lived in
`workers/image-processing/src/providers`:

| Implementation | State | Reachable in production? |
| --- | --- | --- |
| `RemoveBgProvider` (multipart upload, `size=full`, `type=car`, `shadow_type=none`) | Complete, 12 files | **Yes — the only production path** (`BACKGROUND_REMOVAL_PROVIDER` defaulted to `removebg` in every profile and in the Lambda template) |
| `LeonardoProvider` (Sync API, `size=full`, `shadow_type=none`) | Complete, added in #78 | Only if an operator changed the template parameter; never cut over |
| fal.ai | No adapter; the factory threw `FAL_PROVIDER_NOT_IMPLEMENTED_MESSAGE` | No — worker startup would fail |
| self-hosted BiRefNet | No adapter; the factory threw | No — worker startup would fail |

Selection was duplicated: the control plane stamped `ProcessingJob.provider`
from its own `BACKGROUND_REMOVAL_PROVIDER`, the worker built its adapter from a
separate copy of the same variable, and nothing checked that they agreed. The
claim then wrote the *reservation-time* provider onto `ProcessingAttempt`, so a
job reserved under one provider and executed by another would be recorded
against the wrong one. Provider-specific configuration covered
`REMOVEBG_API_KEY`, `REMOVEBG_TIMEOUT_MS`, `LEONARDO_API_KEY`,
`LEONARDO_TIMEOUT_MS`, `FAL_KEY` and `SELF_HOSTED_BIREFNET_ENDPOINT`, plus
profile allow-lists, a Lambda `AllowedValues` rule, two secret parameters and
local compose pass-through.

Only remove.bg emitted provider EMF metrics (`removebg.*`), and the
observability stack's three provider alarms were bound to those names; the
Leonardo adapter only logged. `NON_CAR_IMAGE` classification existed only in
the remove.bg adapter (`unknown_foreground`).

## 2. Production path and lifecycle

```
Browser ─PUT (presigned)→ S3 users/{u}/…/original
Review "Process" → POST /api/jobs → ProcessingJobService
  → one transaction: jobs + outbox rows + VEHICLE_PROCESSING_BATCH_CREATED usage
  → HTTP 202-style response; browser navigates to Inventory immediately
  → next/server after(): outbox claim → SendMessageBatch (≤10) → jobs QUEUED
  (EventBridge recovery every minute republishes anything missed)
SQS (one message = one image job) → Lambda (batch size 1, max concurrency 10)
  → claim (QUEUED→PROCESSING, lease, attempt row)
  → S3 GET original, size + SHA-256 + full decode validation
  → staged provider-result.webp? reuse : provider.process() then stage it
  → renderProcessedImage (crop/pad, scene, local shadow, enhancement, encode)
  → S3 PUT processed.{jpg|png|webp} + preview.webp (720 px)
  → one transaction: ProcessedAsset + attempt SUCCEEDED + job COMPLETED
    + BACKGROUND_REMOVAL_COMPLETED usage + vehicle aggregate status
```

- **Unit of work:** one SQS message is one image job; a batch of 20 images is
  20 messages, published in two `SendMessageBatch` calls.
- **Concurrency:** event-source `MaximumConcurrency` 10, batch size 1, no
  batching window; optional reserved concurrency (0 = unset).
- **Retries:** classified failures (429, 5xx, timeout, network) schedule a
  *durable* retry: job → `RETRYING`, outbox reset with `nextAttemptAt`
  (5 s × 2ⁿ with jitter, capped at 300 s, five attempts). The SQS message is
  acknowledged once that is committed. Unexpected exceptions return the record
  as a batch item failure, so SQS redelivers it (max receive 5 → DLQ).
- **Duplicates:** the claim is a conditional update; a live lease returns
  `CLAIM_BUSY` (message redelivered later), terminal jobs are ignored, and an
  early message waits for publication rather than being dropped.
- **Completion:** atomic and idempotent (`ALREADY_COMPLETED`); usage is keyed by
  job, so it is charged at most once.
- **Storage:** keys are deterministic and job-scoped
  (`users/{u}/vehicles/{v}/assets/{a}/jobs/{j}/…`), not content-addressed; each
  object carries its SHA-256 as metadata. A retry after a successful provider
  call reuses the staged `provider-result.webp` instead of paying again.
- **Variants:** exactly one full output plus one 720 px WebP preview, rendered
  in the same execution.
- **Timing budget:** Lambda timeout 120 s, claim lease 120 s, provider timeout
  60 s, queue visibility 900 s.

## 3. Frontend completion mechanism and the performance history

Polling was never removed. The browser learns about completion through one
batched `GET /api/jobs?ids=…` poller (`ProcessingStatusPoller`, mounted once in
the app shell) fed by a transient Zustand store that the Review step populates
with the accepted job IDs before navigating to Inventory.

- Adaptive cadence: 1 s for the first 10 s, 2 s to 30 s, 5 s to 2 min, then
  10 s; paused while the tab is hidden; terminal jobs leave the poll set.
- **PR #85** (`ca2f897`, "coalesce processing polling and final page
  refreshes") kept polling but made it cheap: one request in flight at a time,
  coalesced wake-ups, unchanged payloads keep the same store object (no
  re-render), and `router.refresh()` runs **once when the tracked group reaches
  zero active jobs** instead of once per completed image (SC039's behaviour).
  Its measured effect was render/refresh churn, not processing latency.
- **PR #80** (`f8bb6c8`) moved queue publication after the response with
  `after()`, cutting 20-image acceptance from ~530 ms to ~19 ms locally.

The mechanism is provider-agnostic (it reads PostgreSQL job state only), so a
slower synchronous provider call simply keeps a job in `PROCESSING` longer and
the poller backs off to 5–10 s. **Decision: keep it exactly as it is.** The one
gap — a full page reload forgets the transient IDs, so an Inventory card stays
server-rendered until the next navigation — predates this migration, is
documented in `progress.md`, and is not changed here.

## 4. Treatment options, traced UI → worker → pixels

Measured with a deterministic fixture (see
[the evidence page](../evidence/processing-options/README.md)).

| Option | Wired end to end? | Effect on pixels | Verdict |
| --- | --- | --- | --- |
| **Hide Number Plate** (`platePrivacy`) | Validated, stored, hashed into version keys — **read by nothing** in the worker or either provider | Zero pixels change (SC045 measured 0 in all 96 real cases) | **Remove** |
| **Image Enhancement** | Yes: `normalise().sharpen()` | Vehicle body shifts ~18 levels, but it runs on the *finished* image, so the studio floor darkened 12.6 levels and the wall 3.3 | **Fix**: enhance the vehicle layer only |
| **Maintain Composition** | Yes: `crop` = `MAINTAIN_COMPOSITION` vs `FIT_VEHICLE` | ON keeps the photo's frame (2656×1856 for a 2400×1600 photo); OFF trims to the vehicle and fits a 4:3 canvas (1856×1456) | **Retain**; fix Studio-off defects |

The two Studio-Background-off defects were already pinned by `it.fails`: ON
added a white 8% border around the photo and OFF letterboxed the photo on a
white 4:3 canvas, because "fit to vehicle" trims transparency and an unprocessed
photo has none.

Two more hidden options were effectively dead from the user's point of view:
`shadow` (never exposed; only fed the local shadow) and `outputFormat`
(never exposed; the UI always sent **JPEG** although the portfolio and the brief
assume WebP).

## 5. Shadow implementation

`createVehicleShadow` + `projectContactMask` + `readVehicleAlpha` drew a local
two-layer contact/ambient shadow from the final vehicle alpha for every studio
background (PR #79; PR #92, still open, proposes reverting it). Both providers
requested `shadow_type=none`. With a provider shadow present, the same renderer
darkened a further 135,262 pixels by up to 34 levels under the fixture vehicle:
enabling Leonardo's car shadow without deleting the local one would ship double
shadows.

Backgrounds were procedural SVG gradients (`createStudioSceneSvg`) seamed 30% of
the vehicle height above its tyre line, not designer assets.

## 6. Lambda packaging

No packaging script was committed; `infrastructure/aws/README.md` only states
the contract (`handler.mjs`, external production dependencies and the Linux
arm64 Sharp binary at the archive root). Reproducing that contract with
`pnpm deploy --prod --os=linux --cpu=arm64 --libc=glibc`:

| | Before | After (`pnpm package:worker`) |
| --- | --- | --- |
| ZIP | **62,592,857 bytes (59.7 MiB)** | **18,123,601 bytes (17.3 MiB)**, −71% |
| Uncompressed | **199,428,523 bytes (190.2 MiB)**, 76% of Lambda's 250 MB limit | **35,071,678 bytes (33.4 MiB)**, 13% |
| Files | 14,288 | 120 |
| Largest | `@prisma/client` 71 MB (engines for every database), Sentry build plugins 21 MB + `sentry` CLI 15 MB, libvips 17.9 MB, Babel/oxc-parser/caniuse-lite (pulled by `@sentry/node@11`'s bundler plugins), unused `@aws-sdk/client-sqs` | arm64 libvips 18.3 MB; `handler.mjs` 8.5 MB (Prisma's WebAssembly query compiler 4.9 MB, zod 0.7 MB, AWS SDK ≈0.9 MB, Sentry ≈0.8 MB); backgrounds 6.9 MB |
| Reproducible | No | Byte-identical across builds; verified in CI |
| Verified on arm64 | No | Handler and packaged libvips run on arm64 Node 24 (QEMU locally; the `public.ecr.aws/lambda/nodejs:24` arm64 image in CI) |

## 7. Supplied backgrounds

Six 3840×2160 PNGs. The three "plain" files are uniform colours; the three
floor files have a wall/floor seam at 68–69% of the height.
`grey-studio-4k.png` **was truncated in transfer** (2,424,832 bytes = 37 × 64 KiB,
no `IEND`, final `IDAT` short by 998 bytes): 2,035 of 2,160 rows decode. The
missing 125 rows are floor whose row luminance is flat (233.4–233.6) from the
seam to the last decoded row, so they were reconstructed by mirroring the
adjacent floor rows. Replace the committed asset with a clean export when
available; no code changes are needed.

## 8. Risks identified

1. Double shadows unless the local shadow is removed in the same change.
2. Enhancement repainting designer-owned backgrounds.
3. In-flight jobs at cutover: attempts recorded against the reservation-time
   provider; staged remove.bg cutouts (no shadow) would be reused on retry.
4. Leonardo fetches the source by URL: MinIO URLs in the Local profile are
   unreachable, so real processing requires Development/Production storage.
5. A 5-minute presigned source URL is tight for a queued synchronous call.
6. A synchronous generation can outlast the 60 s provider timeout plus
   compositing within a 120 s Lambda; the claim lease must cover the Lambda.
7. Persisted job options contain legacy keys (`platePrivacy`, `shadow`,
   `outputFormat`), so a stricter request contract needs a tolerant reader.
8. The observability stack's provider alarms read remove.bg metric names.
9. Artifact size is near the unzipped Lambda limit and not reproducible.
