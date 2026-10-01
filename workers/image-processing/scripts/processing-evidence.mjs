// Deterministic pixel evidence for the studio compositor.
//
// Builds outdoor "photos" from the licensed marketing sedan, with the
// transparent car and soft car shadow that Leonardo's Remove Background returns
// for them (crop=false, so each cutout keeps its photo's frame). It renders the
// processing options through the production compositor, measures the pixels
// and writes images plus `metrics.json`.
//
// Usage, from workers/image-processing:
//   pnpm evidence:processing <output-directory> [legacy-worker-directory]
//
// The optional legacy directory is an older checkout of this worker (for
// example `git worktree add /tmp/legacy 10c1c52` →
// /tmp/legacy/workers/image-processing). Its `renderProcessedImage` is rendered
// from the same cutouts for before/after comparisons.
//
// The fixtures are stand-ins for provider output, not Leonardo responses. They
// make every number reproducible without a provider key.
import { Buffer } from "node:buffer";
import { log } from "node:console";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { performance } from "node:perf_hooks";
import { build } from "esbuild";
import sharp from "sharp";

const WORKER_DIRECTORY = process.cwd();
const SEDAN = path.resolve(
  WORKER_DIRECTORY,
  "../../apps/web/public/images/marketing/silver-sedan.png",
);
const PHOTO_WIDTH = 2400;
const PHOTO_HEIGHT = 1600;
const HORIZON_Y = 880;
const SHEET_WIDTH = 1200;
const JPEG_QUALITY = 84;
const DARKENING_THRESHOLD = 2;
const VEHICLE_ALPHA = 128;
const OUTPUT_QUALITY = 90;
const PREVIEW_WIDTH = 720;
const PADDING_PERCENT = 8;

/** Three representative framings of one licensed vehicle. */
const FIXTURES = [
  { name: "three-quarter", carWidth: 1500, left: 300, top: 520, mirror: false },
  { name: "three-quarter-mirrored", carWidth: 1500, left: 600, top: 520, mirror: true },
  { name: "small-off-centre", carWidth: 900, left: 1250, top: 780, mirror: false },
];
const BACKGROUNDS = ["PREMIUM_WHITE", "GREY_STUDIO", "DARK_STUDIO"];
const FLOORS = ["HORIZON", "PLAIN"];

const [outputArgument, legacyArgument] = process.argv.slice(2);
if (!outputArgument) {
  throw new Error(
    "Usage: pnpm evidence:processing <output-directory> [legacy-worker-directory]",
  );
}
const outputDirectory = path.resolve(outputArgument);
const legacyDirectory = legacyArgument ? path.resolve(legacyArgument) : null;

/** A small deterministic PRNG so the photo grain is identical on every run. */
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

async function bundle(directory, contents, temporary, name) {
  const outfile = path.join(temporary, `${name}.mjs`);
  await build({
    stdin: { contents, resolveDir: directory, loader: "ts" },
    bundle: true,
    platform: "node",
    format: "esm",
    external: ["sharp"],
    outfile,
    logLevel: "error",
  });
  // A bundle in a temporary directory cannot resolve workspace dependencies.
  const source = await readFile(outfile, "utf8");
  await writeFile(
    outfile,
    source.replaceAll(
      'from "sharp"',
      `from ${JSON.stringify(import.meta.resolve("sharp"))}`,
    ),
  );
  return import(outfile);
}

async function createFixture(fixture) {
  const car = await sharp(SEDAN)
    .resize({ width: fixture.carWidth })
    .flop(fixture.mirror)
    .png()
    .toBuffer({ resolveWithObject: true });
  const carHeight = car.info.height;
  const scene = `<svg xmlns="http://www.w3.org/2000/svg" width="${PHOTO_WIDTH}" height="${PHOTO_HEIGHT}">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fb2d6"/><stop offset="1" stop-color="#d9e4ee"/></linearGradient>
<linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d6a66"/><stop offset="1" stop-color="#3e3c3a"/></linearGradient></defs>
<rect width="${PHOTO_WIDTH}" height="${PHOTO_HEIGHT}" fill="url(#sky)"/>
<rect y="620" width="${PHOTO_WIDTH}" height="260" fill="#9a8f84"/><rect x="200" y="560" width="520" height="320" fill="#b7aa9b"/><rect x="1500" y="520" width="700" height="360" fill="#8c8278"/>
<rect y="${HORIZON_Y}" width="${PHOTO_WIDTH}" height="${PHOTO_HEIGHT - HORIZON_Y}" fill="url(#road)"/></svg>`;
  const random = createRandom(0x5eed);
  const grain = Buffer.alloc(PHOTO_WIDTH * PHOTO_HEIGHT * 3);
  for (let index = 0; index < grain.length; index += 1) {
    grain[index] = 128 + Math.round((random() + random() + random() - 1.5) * 24);
  }
  const background = await sharp(Buffer.from(scene))
    .composite([
      {
        input: grain,
        raw: { width: PHOTO_WIDTH, height: PHOTO_HEIGHT, channels: 3 },
        blend: "soft-light",
      },
    ])
    .png()
    .toBuffer();
  // Leonardo's `shadow_type: car` is a soft contact shadow under the tyres.
  const shadowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PHOTO_WIDTH}" height="${PHOTO_HEIGHT}"><ellipse cx="${fixture.left + fixture.carWidth * 0.5}" cy="${fixture.top + carHeight * 0.83}" rx="${fixture.carWidth * 0.5}" ry="${carHeight * 0.07}" fill="black" fill-opacity="0.55"/></svg>`;
  const shadow = await sharp(Buffer.from(shadowSvg)).blur(18).png().toBuffer();
  const photo = await sharp(background)
    .composite([
      { input: shadow },
      { input: car.data, left: fixture.left, top: fixture.top },
    ])
    // A flat, overcast phone exposure: lower contrast, slightly lifted blacks.
    .linear(0.78, 26)
    .jpeg({ quality: 92 })
    .toBuffer();

  const carLayer = await sharp({
    create: {
      width: PHOTO_WIDTH,
      height: PHOTO_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: car.data, left: fixture.left, top: fixture.top }])
    .png()
    .toBuffer();
  const carAlpha = await sharp(carLayer).extractChannel(3).raw().toBuffer();
  const carRgb = await sharp(carLayer)
    .removeAlpha()
    .linear(0.78, 26)
    .raw()
    .toBuffer();
  const shadowAlpha = await sharp(shadow).extractChannel(3).raw().toBuffer();
  const rgba = Buffer.alloc(PHOTO_WIDTH * PHOTO_HEIGHT * 4);
  for (let pixel = 0; pixel < PHOTO_WIDTH * PHOTO_HEIGHT; pixel += 1) {
    const alpha = carAlpha[pixel];
    if (alpha >= VEHICLE_ALPHA) {
      rgba[pixel * 4] = carRgb[pixel * 3];
      rgba[pixel * 4 + 1] = carRgb[pixel * 3 + 1];
      rgba[pixel * 4 + 2] = carRgb[pixel * 3 + 2];
      rgba[pixel * 4 + 3] = alpha;
    } else {
      rgba[pixel * 4 + 3] = Math.max(Math.round(alpha * 0.5), shadowAlpha[pixel]);
    }
  }
  const raw = { raw: { width: PHOTO_WIDTH, height: PHOTO_HEIGHT, channels: 4 } };
  return {
    photo,
    cutout: await sharp(rgba, raw).webp({ lossless: true }).toBuffer(),
    cutoutOnMagenta: await sharp(rgba, raw)
      .flatten({ background: "#ff00ff" })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer(),
  };
}

async function saveJpeg(bytes, name) {
  const file = path.join(outputDirectory, `${name}.jpg`);
  await sharp(bytes)
    .resize({ width: SHEET_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(file);
  return path.basename(file);
}

async function sideBySide(left, right, name) {
  const tiles = await Promise.all(
    [left, right].map((bytes) =>
      sharp(bytes)
        .resize({ width: SHEET_WIDTH / 2, height: 450, fit: "contain", background: "#ffffff" })
        .png()
        .toBuffer(),
    ),
  );
  const sheet = await sharp({
    create: { width: SHEET_WIDTH + 8, height: 450, channels: 3, background: "#ffffff" },
  })
    .composite([
      { input: tiles[0], left: 0, top: 0 },
      { input: tiles[1], left: SHEET_WIDTH / 2 + 8, top: 0 },
    ])
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
  await writeFile(path.join(outputDirectory, `${name}.jpg`), sheet);
  return `${name}.jpg`;
}

async function rawRgb(bytes) {
  const { data, info } = await sharp(bytes)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function luminance(data, pixel) {
  return 0.2126 * data[pixel * 3] + 0.7152 * data[pixel * 3 + 1] + 0.0722 * data[pixel * 3 + 2];
}

function percentile(values, share) {
  const sorted = Float64Array.from(values).sort();
  return sorted[Math.min(sorted.length - 1, Math.floor(share * sorted.length))];
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** Compares two equal-size renders inside and outside a canvas-sized mask. */
function compareRenders(off, on, isVehicle) {
  let backgroundChanged = 0;
  let backgroundPixels = 0;
  let backgroundDifference = 0;
  let vehicleDifference = 0;
  const offLuma = [];
  const onLuma = [];
  for (let pixel = 0; pixel < off.width * off.height; pixel += 1) {
    let difference = 0;
    for (let channel = 0; channel < 3; channel += 1) {
      difference += Math.abs(off.data[pixel * 3 + channel] - on.data[pixel * 3 + channel]);
    }
    if (isVehicle(pixel)) {
      vehicleDifference += difference / 3;
      offLuma.push(luminance(off.data, pixel));
      onLuma.push(luminance(on.data, pixel));
    } else {
      backgroundPixels += 1;
      backgroundDifference += difference / 3;
      if (difference > 0) backgroundChanged += 1;
    }
  }
  return {
    backgroundPixels,
    backgroundPixelsChanged: backgroundChanged,
    backgroundMeanAbsoluteDifference: round(backgroundDifference / backgroundPixels),
    vehicleMeanAbsoluteDifference: round(vehicleDifference / offLuma.length),
    vehicleTonalRange: {
      off: round(percentile(offLuma, 0.99) - percentile(offLuma, 0.01)),
      on: round(percentile(onLuma, 0.99) - percentile(onLuma, 0.01)),
    },
  };
}

/** Pixels darker than the background alone where the provider drew nothing. */
function countAddedDarkening(composite, background, providerAlphaIsZero) {
  let darkened = 0;
  let maximum = 0;
  for (let pixel = 0; pixel < composite.width * composite.height; pixel += 1) {
    if (!providerAlphaIsZero(pixel)) continue;
    const delta = luminance(background.data, pixel) - luminance(composite.data, pixel);
    if (delta > DARKENING_THRESHOLD) {
      darkened += 1;
      maximum = Math.max(maximum, delta);
    }
  }
  return { pixels: darkened, maximumLevels: round(maximum, 1) };
}

/** Canvas-sized masks of the placed cutout: its alpha after framing. */
async function placedAlpha(compositor, cutout, framing) {
  const layer = await compositor.placeCutoutLayer(cutout, framing);
  const alpha = new Uint8Array(framing.canvasWidth * framing.canvasHeight);
  for (let y = 0; y < layer.image.height; y += 1) {
    const canvasY = y + layer.top;
    if (canvasY < 0 || canvasY >= framing.canvasHeight) continue;
    for (let x = 0; x < layer.image.width; x += 1) {
      const canvasX = x + layer.left;
      if (canvasX < 0 || canvasX >= framing.canvasWidth) continue;
      alpha[canvasY * framing.canvasWidth + canvasX] =
        layer.image.data[(y * layer.image.width + x) * 4 + 3];
    }
  }
  return alpha;
}

/** The same placement `composeStudioImage` derives, rendered without a vehicle. */
async function renderBackgroundAlone(compositor, cutout, options, backgroundBytes) {
  const measurement = compositor.measureCutout(cutout);
  const framing = compositor.frameVehicle({
    content: measurement.content,
    crop: options.crop,
    cutoutHeight: cutout.height,
    cutoutWidth: cutout.width,
    paddingPercent: options.paddingPercent,
  });
  const vehicleHeight = measurement.vehicle.height * framing.scale;
  const tyreLine =
    framing.offsetY + (measurement.vehicle.top + measurement.vehicle.height) * framing.scale;
  const asset = compositor.STUDIO_BACKGROUND_ASSETS[options.background][options.floor];
  const placement = compositor.placeStudioBackground({
    asset,
    canvasHeight: framing.canvasHeight,
    canvasWidth: framing.canvasWidth,
    targetSeamY: tyreLine - vehicleHeight * compositor.HORIZON_ABOVE_CONTACT_RATIO,
  });
  const data = await compositor.renderStudioBackground(
    backgroundBytes,
    placement,
    framing.canvasWidth,
    framing.canvasHeight,
  );
  // The placement is the asset region that fills the canvas, scaled uniformly.
  const seamY =
    asset.seamY === null
      ? null
      : (asset.seamY - placement.top) * (framing.canvasHeight / placement.height);
  return {
    background: { data, width: framing.canvasWidth, height: framing.canvasHeight },
    framing,
    measurement,
    seamY,
    tyreLine,
    vehicleHeight,
  };
}

async function main() {
  const temporary = await mkdtemp(path.join(tmpdir(), "studiocar-evidence-"));
  try {
    await mkdir(outputDirectory, { recursive: true });
    const compositor = await bundle(
      WORKER_DIRECTORY,
      [
        'export { composeStudioImage } from "./src/execution/compose-studio-image";',
        'export { decodeCutout } from "./src/execution/decode-cutout";',
        'export { encodeProcessedImage } from "./src/execution/encode-processed-image";',
        'export { measureCutout } from "./src/execution/measure-cutout";',
        'export { frameVehicle } from "./src/execution/frame-vehicle";',
        'export { placeCutoutLayer } from "./src/execution/place-cutout-layer";',
        'export { placeStudioBackground } from "./src/execution/place-studio-background";',
        'export { renderStudioBackground } from "./src/execution/render-studio-background";',
        'export { STUDIO_BACKGROUND_ASSETS, HORIZON_ABOVE_CONTACT_RATIO } from "./src/execution/studio-background.constants";',
      ].join("\n"),
      temporary,
      "compositor",
    );
    const legacy = legacyDirectory
      ? await bundle(
          legacyDirectory,
          'export { renderProcessedImage } from "./src/execution/render-processed-image";',
          temporary,
          "legacy",
        )
      : null;
    const backgroundBytes = new Map();
    const readBackground = async (background, floor) => {
      const { file } = compositor.STUDIO_BACKGROUND_ASSETS[background][floor];
      if (!backgroundBytes.has(file)) {
        backgroundBytes.set(file, await readFile(path.join(WORKER_DIRECTORY, "assets/backgrounds", file)));
      }
      return backgroundBytes.get(file);
    };
    const render = async (cutout, options) => {
      const startedAt = performance.now();
      const image = await compositor.composeStudioImage({
        background: options.background,
        backgroundBytes: await readBackground(options.background, options.floor),
        cutout,
        floor: options.floor,
        options,
      });
      const encoded = await compositor.encodeProcessedImage(image, OUTPUT_QUALITY, PREVIEW_WIDTH);
      return {
        bytes: encoded.bytes,
        milliseconds: Math.round(performance.now() - startedAt),
        width: encoded.width,
        height: encoded.height,
      };
    };

    const metrics = { fixtures: {}, enhancement: {}, composition: {}, shadow: {}, floorAlignment: [], backgrounds: [], legacy: null };
    const prepared = [];
    for (const fixture of FIXTURES) {
      const built = await createFixture(fixture);
      const cutout = await compositor.decodeCutout(built.cutout);
      prepared.push({ fixture, built, cutout });
      metrics.fixtures[fixture.name] = {
        source: await saveJpeg(built.photo, `source-${fixture.name}`),
        providerCutout: await saveJpeg(built.cutoutOnMagenta, `provider-cutout-${fixture.name}`),
        cutoutVehicleAspectRatio: round(compositor.measureCutout(cutout).vehicle.width / compositor.measureCutout(cutout).vehicle.height, 4),
      };
    }
    const [primary] = prepared;
    const base = {
      background: "GREY_STUDIO",
      floor: "HORIZON",
      crop: "MAINTAIN_COMPOSITION",
      enhancement: false,
      paddingPercent: PADDING_PERCENT,
    };

    // Image Enhancement: OFF/ON from the same cutout and treatment.
    const enhancementOff = await render(primary.cutout, base);
    const enhancementOn = await render(primary.cutout, { ...base, enhancement: true });
    const placement = await renderBackgroundAlone(compositor, primary.cutout, base, await readBackground("GREY_STUDIO", "HORIZON"));
    const alpha = await placedAlpha(compositor, primary.cutout, placement.framing);
    metrics.enhancement = {
      images: {
        off: await saveJpeg(enhancementOff.bytes, "enhancement-off"),
        on: await saveJpeg(enhancementOn.bytes, "enhancement-on"),
        comparison: await sideBySide(enhancementOff.bytes, enhancementOn.bytes, "enhancement-off-vs-on"),
      },
      // Decoded output WebP, so encoder noise is included in both sides.
      ...compareRenders(
        await rawRgb(enhancementOff.bytes),
        await rawRgb(enhancementOn.bytes),
        (pixel) => alpha[pixel] > 0,
      ),
      milliseconds: { off: enhancementOff.milliseconds, on: enhancementOn.milliseconds },
    };
    // Exact (pre-encoding) background equality, the claim the compositor makes.
    const exactOff = await compositor.composeStudioImage({ background: base.background, backgroundBytes: await readBackground("GREY_STUDIO", "HORIZON"), cutout: primary.cutout, floor: base.floor, options: base });
    const exactOn = await compositor.composeStudioImage({ background: base.background, backgroundBytes: await readBackground("GREY_STUDIO", "HORIZON"), cutout: primary.cutout, floor: base.floor, options: { ...base, enhancement: true } });
    metrics.enhancement.exact = compareRenders(exactOff, exactOn, (pixel) => alpha[pixel] > 0);

    // Maintain Composition: ON keeps the photo frame, OFF fits the vehicle.
    const compositionOn = enhancementOff;
    const compositionOff = await render(primary.cutout, { ...base, crop: "FIT_VEHICLE" });
    const fitPlacement = await renderBackgroundAlone(compositor, primary.cutout, { ...base, crop: "FIT_VEHICLE" }, await readBackground("GREY_STUDIO", "HORIZON"));
    const vehicleBox = (layout) => {
      const { vehicle } = layout.measurement;
      const { framing } = layout;
      return {
        left: round(framing.offsetX + vehicle.left * framing.scale, 1),
        top: round(framing.offsetY + vehicle.top * framing.scale, 1),
        width: round(vehicle.width * framing.scale, 1),
        height: round(vehicle.height * framing.scale, 1),
        widthShareOfCanvas: round((vehicle.width * framing.scale) / framing.canvasWidth, 3),
        aspectRatio: round(vehicle.width / vehicle.height, 4),
        scale: round(framing.scale, 4),
      };
    };
    metrics.composition = {
      images: {
        on: await saveJpeg(compositionOn.bytes, "composition-on"),
        off: await saveJpeg(compositionOff.bytes, "composition-off"),
        comparison: await sideBySide(compositionOn.bytes, compositionOff.bytes, "composition-on-vs-off"),
      },
      on: { width: compositionOn.width, height: compositionOn.height, vehicle: vehicleBox(placement) },
      off: { width: compositionOff.width, height: compositionOff.height, vehicle: vehicleBox(fitPlacement) },
    };

    // Shadow: only the provider's. Nothing darkens where the provider drew nothing.
    const composedRaw = await rawRgb(
      await sharp(exactOff.data, { raw: { width: exactOff.width, height: exactOff.height, channels: 3 } }).png().toBuffer(),
    );
    metrics.shadow = {
      addedDarkeningOutsideProviderAlpha: countAddedDarkening(composedRaw, placement.background, (pixel) => alpha[pixel] === 0),
    };

    // Floor alignment and the six backgrounds, for every fixture.
    for (const { fixture, cutout } of prepared) {
      for (const background of BACKGROUNDS) {
        for (const floor of FLOORS) {
          const options = { ...base, background, floor, crop: "FIT_VEHICLE" };
          const rendered = await render(cutout, options);
          const layout = await renderBackgroundAlone(compositor, cutout, options, await readBackground(background, floor));
          const name = `${background.toLowerCase().replaceAll("_", "-")}-${floor === "HORIZON" ? "floor" : "plain"}-${fixture.name}`;
          const image = fixture === primary.fixture || floor === "HORIZON" ? await saveJpeg(rendered.bytes, name) : null;
          metrics.backgrounds.push({
            fixture: fixture.name,
            background,
            floor,
            image,
            width: rendered.width,
            height: rendered.height,
            sizeBytes: rendered.bytes.byteLength,
            milliseconds: rendered.milliseconds,
            vehicleAspectRatio: vehicleBox(layout).aspectRatio,
          });
          if (layout.seamY !== null) {
            metrics.floorAlignment.push({
              fixture: fixture.name,
              background,
              tyreLineY: round(layout.tyreLine, 1),
              seamY: round(layout.seamY, 1),
              seamAboveTyreLineShareOfVehicleHeight: round((layout.tyreLine - layout.seamY) / layout.vehicleHeight, 3),
            });
          }
        }
      }
    }

    if (legacy) {
      const legacyOptions = {
        background: "GREY_STUDIO",
        floor: "HORIZON",
        crop: "MAINTAIN_COMPOSITION",
        enhancement: false,
        paddingPercent: PADDING_PERCENT,
        quality: OUTPUT_QUALITY,
        platePrivacy: false,
        shadow: "NATURAL",
        outputFormat: "WEBP",
      };
      const renderLegacy = (options) =>
        legacy.renderProcessedImage({ bytes: primary.built.cutout, options, previewMaxWidth: PREVIEW_WIDTH });
      const legacyShadow = await renderLegacy(legacyOptions);
      const legacyNoLocalShadow = await renderLegacy({ ...legacyOptions, shadow: "NONE" });
      const legacyEnhanced = await renderLegacy({ ...legacyOptions, enhancement: true });
      const legacyFit = await renderLegacy({ ...legacyOptions, crop: "FIT_VEHICLE" });
      const shadowRaw = await rawRgb(legacyShadow.bytes);
      const noShadowRaw = await rawRgb(legacyNoLocalShadow.bytes);
      const enhancedRaw = await rawRgb(legacyEnhanced.bytes);
      // The legacy renderer drew the cutout at the frame's origin plus padding.
      const legacyPadding = Math.round(Math.min(PHOTO_WIDTH, PHOTO_HEIGHT) * (PADDING_PERCENT / 100));
      const legacyAlpha = (pixel) => {
        const x = (pixel % shadowRaw.width) - legacyPadding;
        const y = Math.floor(pixel / shadowRaw.width) - legacyPadding;
        if (x < 0 || y < 0 || x >= primary.cutout.width || y >= primary.cutout.height) return 0;
        return primary.cutout.data[(y * primary.cutout.width + x) * 4 + 3];
      };
      metrics.legacy = {
        source: "renderProcessedImage from the supplied legacy worker checkout",
        images: {
          doubleShadow: await saveJpeg(legacyShadow.bytes, "legacy-double-shadow"),
          enhancementOn: await saveJpeg(legacyEnhanced.bytes, "legacy-enhancement-on"),
          compositionOff: await saveJpeg(legacyFit.bytes, "legacy-composition-off"),
          shadowComparison: await sideBySide(legacyShadow.bytes, compositionOn.bytes, "shadow-legacy-vs-current"),
          enhancementComparison: await sideBySide(legacyEnhanced.bytes, enhancementOn.bytes, "enhancement-legacy-vs-current"),
        },
        localShadowDarkening: countAddedDarkening(shadowRaw, noShadowRaw, () => true),
        enhancement: compareRenders(shadowRaw, enhancedRaw, (pixel) => legacyAlpha(pixel) > 0),
      };
    }

    await writeFile(path.join(outputDirectory, "metrics.json"), `${JSON.stringify(metrics, null, 2)}\n`);
    log(JSON.stringify({
      enhancementExactBackgroundPixelsChanged: metrics.enhancement.exact.backgroundPixelsChanged,
      addedShadowPixels: metrics.shadow.addedDarkeningOutsideProviderAlpha.pixels,
      legacyLocalShadowPixels: metrics.legacy?.localShadowDarkening.pixels ?? null,
      legacyEnhancementBackgroundMeanDifference: metrics.legacy?.enhancement.backgroundMeanAbsoluteDifference ?? null,
    }));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

await main();
