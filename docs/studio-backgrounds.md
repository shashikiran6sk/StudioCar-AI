# Studio backgrounds and floors

How a studio background and its floor are chosen, carried to the worker, and
composed with a vehicle.

## The six treatments

There are three studio backgrounds, each with exactly two floor treatments: a
flat studio floor and a turntable. A floor belongs to one background only.

| Background | `backgroundId` | Floor | `floorId` | Kind |
| --- | --- | --- | --- | --- |
| Premium White | `PREMIUM_WHITE` | Soft White Floor | `WHITE_STUDIO` | studio floor |
| Premium White | `PREMIUM_WHITE` | Pearl Grey Turntable | `WHITE_TURNTABLE` | turntable |
| Dark Studio | `DARK_STUDIO` | Charcoal Floor | `DARK_STUDIO_FLOOR` | studio floor |
| Dark Studio | `DARK_STUDIO` | Graphite Turntable | `DARK_TURNTABLE` | turntable |
| Grey Studio | `GREY_STUDIO` | Light Grey Floor | `GREY_STUDIO_FLOOR` | studio floor |
| Grey Studio | `GREY_STUDIO` | Silver Turntable | `GREY_TURNTABLE` | turntable |

Turning **Studio Background** off sends `backgroundId: "ORIGINAL"`, which keeps
the photographed background, calls no background-removal provider, and has no
floor. Dealership and Custom backgrounds no longer exist.

`ProcessingOptionsSchema` in `packages/contracts/src/processing.ts` is a
discriminated union on `backgroundId`, so a floor from another background does
not parse — `PREMIUM_WHITE` with `DARK_TURNTABLE` is rejected at every boundary,
and nothing is ever substituted for it.

## Two copies of each treatment, two responsibilities

```
Selection Dialog ──► bundled previews (apps/web/public/studio-assets/) ──► semantic IDs
Worker          ──► processing assets (S3 studio-assets/v1/...)        ──► composition
```

- **The browser never asks object storage for a studio.** The Selection Dialog
  shows small WebP previews served by the application itself, and the frontend
  catalog (`apps/web/src/features/studio-treatment/studio-treatment.constants.ts`)
  knows only IDs, labels, preview paths, and which floors belong to which
  background. It knows no bucket, object key, region, or signed URL.
- **The worker never reads frontend or design files.** It resolves the two IDs
  to versioned keys in `workers/image-processing/src/studio-scene/processing-studio-assets.constants.ts`
  and reads them from the configured bucket through the same storage port it
  uses for every image. The bucket always comes from `S3_BUCKET`.

`docs/screens/Selection_Dialog/` remains the design reference: the UI
screenshot and the original mockup assets. The production processing assets
are generated separately at full resolution; the previews are small renders of
those same processing assets, so both copies always show the same treatment.

## Process request to final image

```
Process ─► POST /api/jobs { options: { backgroundId, floorId, ... } }
        ─► ProcessingJob.options (PostgreSQL, both IDs stored as sent)
        ─► outbox ─► SQS { jobId }
        ─► worker claims the job and reads both IDs back from PostgreSQL
        ─► studio-assets/v1/backgrounds/<background>.webp  (S3, cached)
        ─► studio-assets/v1/floors/<floor>.png             (S3, cached)
        ─► original photo (S3) ─► remove.bg ─► transparent vehicle
        ─► compose: wall ─► floor or turntable ─► contact shadow ─► vehicle
        ─► encode ─► processed image and preview (S3)
```

The queue message deliberately carries only `jobId`. PostgreSQL is
authoritative, so the worker never trusts queue contents for what to draw; it
reads both IDs from the job it claims. The studio assets are loaded before the
provider is called, so a missing asset fails the attempt as retryable without
paying for a background removal.

Processing assets are immutable under `studio-assets/v1/`. A worker keeps each
one in memory after its first read. A visual change is published under a new
version prefix rather than by overwriting `v1`.

## Composition

Every layer is a full-stage image at 3840×2160 (16:9), drawn to the geometry in
`studio-scene-geometry.constants.ts`: the wall blends into the floor around
60% of the height, as a curved studio cove does, so there is no seam.

The vehicle is placed from its own **tyre line**: the lowest row of solid
cutout pixels. remove.bg's synthesized shadow is never solid, so it cannot push
the tyre line down and leave the car floating. The vehicle is scaled to fit its
stand and never enlarged; a small photo produces a smaller scene.

| | Studio floor | Turntable |
| --- | --- | --- |
| Floor layer | A floor running to the edges of the frame | The same floor, plus a platform with a visible rim and its own cast shadow |
| Tyre line | 84% of the frame height | On the platform surface, in front of its centre, so every wheel is on it |
| Vehicle size | Up to 74% of the width and 60% of the height | Up to 90% of the platform width and 58% of the height, centred on it |
| Narrowest crop | 60% of the stage width | The whole platform and its shadow, plus a margin |

Layers stay transparent until the final flatten, so the turntable is drawn
exactly as stored, over the floor and in front of the wall, and the vehicle is
drawn over it.

**Maintain Composition** keeps the photo's aspect ratio. The frame is cut from
the stage around the floor's stand; when the photo is tall, the frame grows
upward instead of cropping the platform. With it off, the whole 16:9 stage is
used. **Image Enhancement** is applied to the vehicle only, so every image of a
batch keeps identical studio tones.

## Provisioning the processing assets

```bash
pnpm studio-assets:generate   # redraw infrastructure/studio-assets/v1 and the previews
pnpm studio-assets:sync       # upload them to the configured bucket
```

Generation is deterministic: its dither noise is seeded, so re-running it
reproduces the committed files byte for byte. The sync command reads the same
storage settings as the application (`apps/web/.env` locally), writes only the
nine registry keys with their media types (`image/webp`, `image/png`), skips an
object whose stored checksum already matches, and refuses to overwrite a
different object under the same versioned key. `-- --replace` overwrites it,
for a development bucket only.

Run the sync against every environment's bucket before a worker that reads
these keys is deployed. The worker's IAM role can only read `studio-assets/*`.
