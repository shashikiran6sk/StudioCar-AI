# Vehicle shadow audit and fix

The pre-fix path requested remove.bg `shadow_type=car` for NATURAL and `3D`
for STUDIO. Those shadows were baked into the transparent provider artifact.
For HORIZON floors, StudioCar then added a second blurred ellipse. PLAIN floors
retained the provider shadow without adding the ellipse. Leonardo already requests
`shadow_type=none`.

This explains a provider-dependent directional component on three-quarter views:
the worker retained the provider's projected shadow and drew another floor shadow.
The local SVG did not skew a duplicated car silhouette. Its ellipse was centered
on trimmed subject bounds, which could themselves include the provider shadow.
Bounds previously came from RGB/alpha trim with a very low threshold. Windows did
not drive ellipse placement, but faint shadow pixels could expand those bounds.

Crop, resize, and padding already happened before shadow generation. There was no
separate post-shadow vehicle resize or incorrect perspective pivot to fix.

## Current processing

Both providers request a clean cutout regardless of the user's shadow treatment.
The worker persists that cutout using the existing provider-result.webp convention.
For studio backgrounds, it performs crop, resize, and padding into a transparent
vehicle layer, then reads its final alpha and strong foreground bounds. RGB values
and faint alpha residue do not determine the ground anchor. The vehicle's original
alpha remains unchanged, including glass, windows, and antialiased edges.

Only the bottom quarter of the strong foreground contributes to shadows. Each
column finds its lower contact point. The mask compresses vertically below those
points; an ambient layer blends gently toward the overall bottom line and spreads
symmetrically about the subject center. There is no lateral projection or skew.
Contact and ambient layers use separate blur and opacity. Raster rounding treats
opposite directions symmetrically. The blur fades at canvas edges to avoid a hard
cut. Constants are centralized in vehicle-shadow.constants.ts.

Order: final vehicle layer → alpha/contact geometry → wall/floor or plain color →
ambient/contact shadow → vehicle → existing enhancement → output/preview encoding.
Both PLAIN and HORIZON studio floors receive local shadows. NONE draws none.
Original-background processing retains its existing behavior.

## Validation and diagnostics

Geometry tests cover mirrored front/rear three-quarter contact profiles, translated
subjects, multiple scales, lower-region selection, and bounded edge placement.
Raster tests cover front, rear, side, all four three-quarter directions, large/small
vehicles, and off-center placement. They assert dimensions, subtle opacity, soft
falloff, and no upper-body shadow. These are controlled silhouettes, not a claim
of photographic validation across those poses. Existing renderer and option-matrix
tests continue to exercise final composition.

Generate diagnostic artifacts from a real original and a clean provider cutout
using absolute paths:

```sh
pnpm --filter @studiocar/image-processing-worker shadow:diagnostics \
  /path/original.jpg /path/clean-provider-cutout.webp /tmp/shadow-diagnostics \
  /path/previous-provider-cutout.webp
```

The last argument is optional. Supply the previous provider result to compare a
baked provider shadow plus the old ellipse with a clean cutout plus the new shadow.
Both cutouts must have identical canvas dimensions. This utility reconstructs the
historical ellipse for comparison at native scale; it does not invoke a provider,
charge an API account, or overwrite application artifacts. It writes:

1. 01-original.jpg
2. 02-provider-transparent.webp
3. 03-alpha-mask.png
4. 04-current-shadow-mask.png
5. 05-current-shadow-composite.webp
6. 06-new-shadow-mask.png
7. 07-new-shadow-composite.webp

The supplied 45° regression photograph has not been provided in this session.
Visual review used the repository's silver-sedan marketing image as a proxy, plus
controlled silhouettes. That marketing asset already contains floor shadow alpha;
a thresholded copy was used only for diagnostics and is not a real provider result.
It cannot prove that the specific supplied photograph is fixed. Repeat the utility
and visually review that photograph and real opposite-angle cutouts before cutover.

Existing stored outputs and staged provider artifacts are immutable and may still
contain old provider shadows. Retries reuse their staged bytes under the existing
idempotency policy. Do not advertise those old artifacts as clean reusable cutouts
or invalidate them automatically, which would introduce additional provider charges.
A future source-level reuse cache must distinguish the clean-cutout contract from
legacy artifacts.
