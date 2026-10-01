# Processing-option evidence

This folder holds pixel evidence for the decisions recorded in
[`../../audits/2026-09-30-leonardo-migration-audit.md`](../../audits/2026-09-30-leonardo-migration-audit.md)
and implemented in [`../../image-processing.md`](../../image-processing.md).
All numbers come from [`metrics.json`](./metrics.json).

## How it was produced

```sh
git worktree add --detach /tmp/legacy 10c1c52     # main before the migration
ln -s "$PWD/node_modules" /tmp/legacy/node_modules
cd workers/image-processing
pnpm evidence:processing ../../docs/evidence/processing-options /tmp/legacy/workers/image-processing
```

[`scripts/processing-evidence.mjs`](../../../workers/image-processing/scripts/processing-evidence.mjs)
does the following:

- Builds three outdoor "photos" of the licensed marketing sedan: a three-quarter
  view, its mirror image, and a small off-centre car.
- Gives each photo the cutout a background-removal provider returns: a
  transparent car with a soft car shadow, in the photo's own frame.
- Renders these through the **production** compositor, bundled from `src/`
  with esbuild. With a legacy checkout, it also renders through the
  pre-migration `renderProcessedImage`.

Grain comes from a seeded PRNG, so two runs produce byte-identical images and
the same metrics, apart from timings. This was verified with `sha256sum`
across consecutive runs.

> **The cutouts are stand-ins, not Leonardo responses.** No Leonardo API key
> was available during the migration and the provider's hosts were not
> reachable. The compositor's behaviour does not depend on where the alpha
> came from; Leonardo's real shadow shape will differ from the ellipse used
> here. Live validation with real dealer photos remains a deployment step.

## Inputs

| Source photo | Provider cutout (on magenta) |
| --- | --- |
| ![](./source-three-quarter.jpg) | ![](./provider-cutout-three-quarter.jpg) |
| ![](./source-three-quarter-mirrored.jpg) | ![](./provider-cutout-three-quarter-mirrored.jpg) |
| ![](./source-small-off-centre.jpg) | ![](./provider-cutout-small-off-centre.jpg) |

## Image Enhancement: retained and fixed

Comparison sheet: OFF on the left, ON on the right.

![](./enhancement-off-vs-on.jpg)

| Measure (Grey studio, floor, Maintain composition) | Legacy | Current |
| --- | --- | --- |
| Background pixels changed by turning enhancement on | 4,009,888 of 4,010,004 | **0** (exact, before encoding) |
| Background mean absolute difference | 6.54 levels | **0** (0.02 after WebP encoding noise) |
| Vehicle mean absolute difference | 21.01 | 18.66 |
| Vehicle tonal range p1–p99 (OFF → ON) | 187.7 → 214.1 | 204.9 → 250.3 |

The legacy renderer normalised and sharpened the **whole composite**. That
shifted StudioCar's own floor and wall, so "enhanced" photos of one car sat on
visibly different backgrounds. The fix keeps the option, because the vehicle
gain is real and visible. It now measures levels from the vehicle's own pixels
and applies them to the vehicle layer only. Sharpening is masked by the
vehicle's alpha.

![](./enhancement-legacy-vs-current.jpg)

*Left: legacy enhancement ON. Right: current enhancement ON.*

## Maintain Composition: retained and fixed

Comparison sheet: ON on the left, OFF (fit to vehicle) on the right.

![](./composition-on-vs-off.jpg)

| | Canvas | Vehicle body box | Scale | Body aspect |
| --- | --- | --- | --- | --- |
| ON | 2656×1856 (photo + 8 % padding) | 1419×697 at (461, 830) | 1.0000 | 2.0359 |
| OFF | 1600×1200 | 1302×640 at (142, 260) | 0.9179 | 2.0359 |

The two settings are genuinely different products, so the option stays. Both
use one uniform scale, so the body's aspect ratio matches the cutout exactly
(2.0359) and nothing is stretched or cropped.

The pre-migration UI also let Studio Background be off while "fit to vehicle"
was selected, with no cutout to fit. Turning Studio Background off now forces
Maintain Composition and disables the toggle. The request contract rejects the
combination.

## Shadow: exactly one

![](./shadow-legacy-vs-current.jpg)

*Left: legacy. Right: current.*

| | Pixels darkened by StudioCar's own shadow |
| --- | --- |
| Legacy (`shadow: NATURAL` on a provider cutout that already had one) | **173,474** pixels, up to 36.5 levels darker |
| Current, where the provider's alpha is zero | **0** |

StudioCar no longer draws any shadow: Leonardo's `shadow_type: "car"` is the
only one.

## Floor alignment

For every fixture and every floor artwork, the wall/floor seam lands at
`tyreLine − 0.30 × vehicleHeight`. All 9 combinations in `metrics.json` report
exactly 0.300, so the far wheels of a three-quarter view stand on the floor,
not against the wall.

## The six backgrounds (fit to vehicle)

| | Floor | Plain |
| --- | --- | --- |
| Premium white | ![](./premium-white-floor-three-quarter.jpg) | ![](./premium-white-plain-three-quarter.jpg) |
| Grey studio | ![](./grey-studio-floor-three-quarter.jpg) | ![](./grey-studio-plain-three-quarter.jpg) |
| Dark studio | ![](./dark-studio-floor-three-quarter.jpg) | ![](./dark-studio-plain-three-quarter.jpg) |

Other framings on the floor artworks:

| | Mirrored three-quarter | Small, off-centre |
| --- | --- | --- |
| Premium white | ![](./premium-white-floor-three-quarter-mirrored.jpg) | ![](./premium-white-floor-small-off-centre.jpg) |
| Grey studio | ![](./grey-studio-floor-three-quarter-mirrored.jpg) | ![](./grey-studio-floor-small-off-centre.jpg) |
| Dark studio | ![](./dark-studio-floor-three-quarter-mirrored.jpg) | ![](./dark-studio-floor-small-off-centre.jpg) |

Render and encode time per 1600×1200 output is about 0.5–0.7 s on the build
machine; per-render figures are in `metrics.json`. A 2656×1856
Maintain-composition render takes about 1.3–1.5 s, most of it the
high-quality WebP encode.

## Hide Number Plate: removed

`platePrivacy` was accepted by the contract and shown in the UI, but no worker
ever applied it. It is removed from the UI, the request contract, the review
step and the portfolio facts. Stored rows that still carry it are read and the
key is dropped.
