/**
 * Generates the studio processing assets and the Selection Dialog previews.
 *
 *   pnpm studio-assets:generate
 *
 * Processing assets are written to `infrastructure/studio-assets/` at full
 * stage resolution, ready for `pnpm studio-assets:sync`. The small previews
 * the browser shows are written to `apps/web/public/studio-assets/`. Both are
 * drawn from the same geometry the compositor reads, and the dither noise is
 * seeded, so a run reproduces the committed files.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";

import {
  StudioBackgroundIdSchema,
  StudioFloorIdSchema,
  type StudioBackgroundId,
  type StudioFloorId,
} from "@studiocar/contracts";
import sharp, { type Sharp } from "sharp";

import { PROCESSING_STUDIO_ASSETS } from "../src/studio-scene/processing-studio-assets.constants";
import {
  STUDIO_FLOOR_LAYOUT,
  STUDIO_HORIZON,
  STUDIO_STAGE,
  TURNTABLE_LAYOUT,
} from "../src/studio-scene/studio-scene-geometry.constants";
import { findRepositoryRoot } from "./find-repository-root";

type Rgb = readonly [number, number, number];

interface WallPalette {
  top: Rgb;
  bottom: Rgb;
  spotlight: number;
  vignette: number;
}

interface FloorPalette {
  far: Rgb;
  pool: number;
  sideFalloff: number;
}

interface TurntablePalette {
  surfaceCentre: Rgb;
  surfaceEdge: Rgb;
  sheen: number;
  lip: number;
  seam: number;
  rimTop: Rgb;
  rimBottom: Rgb;
  castShadow: number;
}

interface ThemePalette {
  wall: WallPalette;
  floor: FloorPalette;
  turntable: TurntablePalette;
}

const THEMES = {
  PREMIUM_WHITE: {
    wall: { top: [251, 251, 250], bottom: [236, 236, 234], spotlight: 4, vignette: 0.05 },
    floor: { far: [212, 212, 209], pool: 7, sideFalloff: 0.1 },
    turntable: {
      surfaceCentre: [226, 226, 224],
      surfaceEdge: [208, 208, 206],
      sheen: 8,
      lip: 22,
      seam: 14,
      rimTop: [186, 187, 188],
      rimBottom: [140, 141, 143],
      castShadow: 0.32,
    },
  },
  DARK_STUDIO: {
    wall: { top: [20, 22, 25], bottom: [36, 39, 44], spotlight: 16, vignette: 0.45 },
    floor: { far: [16, 17, 20], pool: 16, sideFalloff: 0.55 },
    turntable: {
      surfaceCentre: [64, 68, 75],
      surfaceEdge: [46, 49, 55],
      sheen: 14,
      lip: 70,
      seam: 12,
      rimTop: [40, 43, 48],
      rimBottom: [14, 15, 17],
      castShadow: 0.55,
    },
  },
  GREY_STUDIO: {
    wall: { top: [228, 230, 232], bottom: [204, 207, 210], spotlight: 6, vignette: 0.12 },
    floor: { far: [165, 168, 172], pool: 9, sideFalloff: 0.2 },
    turntable: {
      surfaceCentre: [218, 220, 223],
      surfaceEdge: [196, 199, 203],
      sheen: 10,
      lip: 28,
      seam: 16,
      rimTop: [160, 163, 167],
      rimBottom: [118, 121, 125],
      castShadow: 0.36,
    },
  },
} satisfies Record<StudioBackgroundId, ThemePalette>;

const FLOOR_THEMES = {
  WHITE_STUDIO: "PREMIUM_WHITE",
  WHITE_TURNTABLE: "PREMIUM_WHITE",
  DARK_STUDIO_FLOOR: "DARK_STUDIO",
  DARK_TURNTABLE: "DARK_STUDIO",
  GREY_STUDIO_FLOOR: "GREY_STUDIO",
  GREY_TURNTABLE: "GREY_STUDIO",
} satisfies Record<StudioFloorId, StudioBackgroundId>;

const STANDARD_FLOORS = {
  PREMIUM_WHITE: "WHITE_STUDIO",
  DARK_STUDIO: "DARK_STUDIO_FLOOR",
  GREY_STUDIO: "GREY_STUDIO_FLOOR",
} satisfies Record<StudioBackgroundId, StudioFloorId>;

const REPOSITORY_ROOT = findRepositoryRoot();
const PROCESSING_ROOT = path.join(REPOSITORY_ROOT, "infrastructure");
const PREVIEW_ROOT = path.join(REPOSITORY_ROOT, "apps/web/public/studio-assets");
const PREVIEW_WIDTH = 640;
const PREVIEW_HEIGHT = 360;
const PREVIEW_QUALITY = 82;
const BACKGROUND_QUALITY = 94;
const NOISE_SEED = 0x5c0ffee;

const { width: WIDTH, height: HEIGHT } = STUDIO_STAGE;

/** A small seeded generator, so dither noise is identical on every run. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function mix(from: Rgb, to: Rgb, amount: number): [number, number, number] {
  return [
    from[0] + (to[0] - from[0]) * amount,
    from[1] + (to[1] - from[1]) * amount,
    from[2] + (to[2] - from[2]) * amount,
  ];
}

function gaussian(dx: number, dy: number, sx: number, sy: number): number {
  return Math.exp(-((dx * dx) / (2 * sx * sx) + (dy * dy) / (2 * sy * sy)));
}

/** Rounds with triangular dither so smooth gradients never band. */
function dither(value: number, random: () => number): number {
  return Math.round(clamp(value + random() + random() - 1, 0, 255));
}

function wallColour(palette: WallPalette, u: number, v: number): [number, number, number] {
  const colour = mix(palette.top, palette.bottom, smoothstep(0, STUDIO_HORIZON.y + 0.1, v));
  const light = palette.spotlight * gaussian(u - 0.5, v - 0.42, 0.24, 0.3);
  const shade = 1 - palette.vignette * clamp((u - 0.5) ** 2 * 1.4 + (v - 0.45) ** 2 * 0.9);
  return [
    (colour[0] + light) * shade,
    (colour[1] + light) * shade,
    (colour[2] + light) * shade,
  ];
}

/**
 * The floor starts exactly as the wall looks where they meet, so the curve
 * between them has no visible edge, then changes tone toward the camera.
 */
function floorColour(theme: ThemePalette, u: number, v: number): [number, number, number] {
  const depth = clamp((v - STUDIO_HORIZON.y) / (1 - STUDIO_HORIZON.y));
  const colour = mix(wallColour(theme.wall, u, STUDIO_HORIZON.y), theme.floor.far, depth ** 0.85);
  const pool = theme.floor.pool * gaussian(u - 0.5, v - STUDIO_FLOOR_LAYOUT.contactY, 0.26, 0.1);
  const shade = 1 - theme.floor.sideFalloff * depth * clamp((u - 0.5) ** 2 * 2.2);
  return [
    (colour[0] + pool) * shade,
    (colour[1] + pool) * shade,
    (colour[2] + pool) * shade,
  ];
}

function floorAlpha(v: number): number {
  const half = STUDIO_HORIZON.blendHeight / 2;
  return smoothstep(STUDIO_HORIZON.y - half, STUDIO_HORIZON.y + half, v);
}

interface Ellipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** Normalised radius (1 on the edge) and pixel coverage for anti-aliasing. */
function ellipseSample(ellipse: Ellipse, x: number, y: number): { d: number; coverage: number } {
  const nx = (x - ellipse.cx) / ellipse.rx;
  const ny = (y - ellipse.cy) / ellipse.ry;
  const d = Math.sqrt(nx * nx + ny * ny);
  if (d === 0) return { d, coverage: 1 };
  const gx = nx / (ellipse.rx * d);
  const gy = ny / (ellipse.ry * d);
  const distance = (d - 1) / Math.sqrt(gx * gx + gy * gy);
  return { d, coverage: clamp(0.5 - distance) };
}

function blend(
  base: [number, number, number],
  over: readonly [number, number, number],
  amount: number,
): [number, number, number] {
  return mix(base, over, amount);
}

function renderWall(palette: WallPalette): Buffer {
  const random = createRandom(NOISE_SEED);
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 3);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const colour = wallColour(palette, x / WIDTH, y / HEIGHT);
      const index = (y * WIDTH + x) * 3;
      pixels[index] = dither(colour[0], random);
      pixels[index + 1] = dither(colour[1], random);
      pixels[index + 2] = dither(colour[2], random);
    }
  }
  return pixels;
}

function renderFloor(theme: ThemePalette, withTurntable: boolean): Buffer {
  const random = createRandom(NOISE_SEED + 1);
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 4);
  const top: Ellipse = {
    cx: TURNTABLE_LAYOUT.centerX * WIDTH,
    cy: TURNTABLE_LAYOUT.centerY * HEIGHT,
    rx: TURNTABLE_LAYOUT.radiusX * WIDTH,
    ry: TURNTABLE_LAYOUT.radiusY * HEIGHT,
  };
  const rimDepth = TURNTABLE_LAYOUT.rimDepth * HEIGHT;
  const bottom: Ellipse = { ...top, cy: top.cy + rimDepth };
  const shadow: Ellipse = {
    ...top,
    cy: top.cy + rimDepth + top.ry * 0.22,
    rx: top.rx * TURNTABLE_LAYOUT.castShadowSpread,
    ry: top.ry * 1.18,
  };
  const table = theme.turntable;
  const firstRow = Math.floor((STUDIO_HORIZON.y - STUDIO_HORIZON.blendHeight) * HEIGHT);

  for (let y = firstRow; y < HEIGHT; y += 1) {
    const v = y / HEIGHT;
    const alpha = floorAlpha(v);
    if (alpha <= 0) continue;
    for (let x = 0; x < WIDTH; x += 1) {
      const u = x / WIDTH;
      let colour = floorColour(theme, u, v);

      if (withTurntable) {
        const cast = ellipseSample(shadow, x, y);
        const castAmount = table.castShadow * (1 - smoothstep(0.82, 1.32, cast.d));
        colour = [colour[0] * (1 - castAmount), colour[1] * (1 - castAmount), colour[2] * (1 - castAmount)];

        const rim = ellipseSample(bottom, x, y);
        if (rim.coverage > 0) {
          const across = (x - top.cx) / top.rx;
          const down = clamp((y - (top.cy + top.ry * Math.sqrt(clamp(1 - across * across)))) / rimDepth);
          const rimColour = mix(table.rimTop, table.rimBottom, down);
          const rounding = 1 - 0.35 * across * across;
          const lipLight = down < 0.12 ? table.lip * 0.5 * (1 - down / 0.12) : 0;
          colour = blend(
            colour,
            [
              rimColour[0] * rounding + lipLight,
              rimColour[1] * rounding + lipLight,
              rimColour[2] * rounding + lipLight,
            ],
            rim.coverage,
          );
        }

        const surface = ellipseSample(top, x, y);
        if (surface.coverage > 0) {
          const dx = (x - top.cx) / top.rx;
          const dy = (y - top.cy) / top.ry;
          const base = mix(table.surfaceCentre, table.surfaceEdge, surface.d * surface.d);
          const sheen = table.sheen * gaussian(dx, dy + 0.35, 0.4, 0.4);
          const seam = surface.d > 0.855 && surface.d < 0.87 ? -table.seam : surface.d >= 0.87 && surface.d < 0.882 ? table.seam * 0.6 : 0;
          const lip = surface.d > 0.965 ? table.lip * smoothstep(0.965, 0.995, surface.d) * (dy < 0 ? 1 : 0.55) : 0;
          const light = sheen + seam + lip;
          colour = blend(colour, [base[0] + light, base[1] + light, base[2] + light], surface.coverage);
        }
      }

      const index = (y * WIDTH + x) * 4;
      pixels[index] = dither(colour[0], random);
      pixels[index + 1] = dither(colour[1], random);
      pixels[index + 2] = dither(colour[2], random);
      pixels[index + 3] = Math.round(alpha * 255);
    }
  }
  return pixels;
}

async function writeProcessingAsset(objectKey: string, image: Sharp): Promise<Buffer> {
  const target = path.join(PROCESSING_ROOT, objectKey);
  await mkdir(path.dirname(target), { recursive: true });
  const bytes = objectKey.endsWith(".webp")
    ? await image.webp({ quality: BACKGROUND_QUALITY, smartSubsample: true }).toBuffer()
    : await image.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
  await sharp(bytes).toFile(target);
  process.stdout.write(`${objectKey} ${String(bytes.byteLength)} bytes\n`);
  return bytes;
}

async function writePreview(name: string, background: Buffer, floor: Buffer): Promise<void> {
  const target = path.join(PREVIEW_ROOT, `${name}.webp`);
  await mkdir(path.dirname(target), { recursive: true });
  const scene = await sharp(background).composite([{ input: floor }]).png().toBuffer();
  await sharp(scene)
    .resize(PREVIEW_WIDTH, PREVIEW_HEIGHT)
    .webp({ quality: PREVIEW_QUALITY })
    .toFile(target);
  process.stdout.write(`preview ${name}\n`);
}

function rawImage(pixels: Buffer, channels: 3 | 4): Sharp {
  return sharp(pixels, { raw: { channels, height: HEIGHT, width: WIDTH } });
}

/** The public file name an ID's preview is served under. */
function previewName(id: StudioBackgroundId | StudioFloorId): string {
  return id.toLowerCase().replaceAll("_", "-");
}

const backgrounds = new Map<StudioBackgroundId, Buffer>();
for (const [backgroundId, objectKey] of Object.entries(PROCESSING_STUDIO_ASSETS.backgrounds)) {
  const id = StudioBackgroundIdSchema.parse(backgroundId);
  const bytes = await writeProcessingAsset(objectKey, rawImage(renderWall(THEMES[id].wall), 3));
  backgrounds.set(id, bytes);
}

for (const [floorId, asset] of Object.entries(PROCESSING_STUDIO_ASSETS.floors)) {
  const id = StudioFloorIdSchema.parse(floorId);
  const themeId = FLOOR_THEMES[id];
  const bytes = await writeProcessingAsset(
    asset.objectKey,
    rawImage(renderFloor(THEMES[themeId], asset.kind === "TURNTABLE"), 4),
  );
  const background = backgrounds.get(themeId);
  if (!background) throw new Error(`Missing background for ${id}`);
  await writePreview(`floors/${previewName(id)}`, background, bytes);
  if (STANDARD_FLOORS[themeId] === id) {
    await writePreview(`backgrounds/${previewName(themeId)}`, background, bytes);
  }
}
