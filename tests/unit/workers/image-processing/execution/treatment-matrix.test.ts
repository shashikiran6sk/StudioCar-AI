import sharp, { type OverlayOptions } from "sharp";
import { beforeAll, describe, expect, it } from "vitest";

import type {
  BackgroundRemovalRequest,
  BackgroundRemovalResult,
  ImageProcessingProvider,
} from "../../../../../packages/processing/src/image-processing-provider.types";
import { buildProcessingObjectKeys } from "../../../../../workers/image-processing/src/execution/build-processing-object-keys";
import { calculateSha256 } from "../../../../../workers/image-processing/src/execution/calculate-sha256";
import { FileStudioBackgroundSource } from "../../../../../workers/image-processing/src/execution/file-studio-background-source";
import { ProcessingJobExecutor } from "../../../../../workers/image-processing/src/execution/processing-job-executor";
import type {
  ProcessingObjectStoragePort,
  PutProcessingObjectInput,
  StoredProcessingObject,
} from "../../../../../workers/image-processing/src/storage/processing-object-storage.types";
import {
  TREATMENT_MATRIX_SIZE,
  createTreatmentMatrix,
  type TreatmentCase,
  type TreatmentToggles,
} from "../../../../support/studio-treatment-matrix";
import { createClaimedJob } from "../test-support/create-claimed-job";
import { STUDIO_BACKGROUND_DIRECTORY } from "../test-support/load-studio-background";

/**
 * Every case of the Customize-treatment matrix, run through the worker's own
 * executor and compositor with the packaged StudioCar backgrounds. The
 * provider is replaced by a fixed cutout — a vehicle with a soft black ground
 * shadow — so any difference between two outputs comes from the options.
 */

const WIDTH = 800;
const HEIGHT = 500;
const PADDING = Math.round(Math.min(WIDTH, HEIGHT) * 0.08);
const SCENERY_WALL = { b: 190, g: 170, r: 150 };
const SCENERY_GROUND = { b: 90, g: 100, r: 110 };
const TOGGLE_KEYS: readonly (keyof TreatmentToggles)[] = [
  "enhancement",
  "maintainComposition",
  "studioBackground",
];

interface Rendered {
  bytes: Uint8Array;
  height: number;
  pixels: Buffer;
  requests: BackgroundRemovalRequest[];
  width: number;
}

class MemoryStorage implements ProcessingObjectStoragePort {
  public readonly objects = new Map<string, StoredProcessingObject>();

  public getOptional(key: string): Promise<StoredProcessingObject | null> {
    return Promise.resolve(this.objects.get(key) ?? null);
  }

  public getRequired(key: string): Promise<StoredProcessingObject> {
    const object = this.objects.get(key);
    if (!object) return Promise.reject(new Error("missing"));
    return Promise.resolve(object);
  }

  public put(input: PutProcessingObjectInput): Promise<void> {
    this.objects.set(input.key, {
      bytes: input.bytes,
      contentType: input.contentType,
      metadata: input.metadata,
    });
    return Promise.resolve();
  }
}

class FixedCutoutProvider implements ImageProcessingProvider {
  public readonly key = "LEONARDO";
  public readonly requests: BackgroundRemovalRequest[] = [];

  public constructor(private readonly cutout: Uint8Array) {}

  public removeBackground(
    request: BackgroundRemovalRequest,
  ): Promise<BackgroundRemovalResult> {
    this.requests.push(request);
    return Promise.resolve({
      ok: true,
      cutout: {
        bytes: this.cutout,
        contentType: "image/webp",
        height: HEIGHT,
        providerLatencyMilliseconds: 1,
        providerRequestId: "generation",
        width: WIDTH,
      },
    });
  }
}

/** A low-contrast vehicle body, as a flat overcast photo renders it. */
async function vehicleLayer(): Promise<OverlayOptions> {
  const width = 400;
  const height = 150;
  const data = Buffer.alloc(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    const x = index % width;
    data.fill(90 + (x % 70), index * 4, index * 4 + 3);
    data[index * 4 + 3] = 255;
  }
  return {
    input: await sharp(data, { raw: { channels: 4, height, width } }).png().toBuffer(),
    left: 200,
    top: 230,
  };
}

/** The ground shadow a provider draws: black, partially transparent. */
async function shadowLayer(): Promise<OverlayOptions> {
  return {
    input: await sharp({
      create: { background: { alpha: 0.35, b: 0, g: 0, r: 0 }, channels: 4, height: 20, width: 460 },
    })
      .png()
      .toBuffer(),
    left: 170,
    top: 380,
  };
}

/** The dealer's photo: a two-tone scene with the vehicle in it. */
async function sourcePhoto(): Promise<Uint8Array> {
  const ground = await sharp({
    create: { background: { alpha: 1, ...SCENERY_GROUND }, channels: 4, height: 200, width: WIDTH },
  })
    .png()
    .toBuffer();
  return sharp({
    create: { background: { alpha: 1, ...SCENERY_WALL }, channels: 4, height: HEIGHT, width: WIDTH },
  })
    .composite([{ input: ground, left: 0, top: 300 }, await vehicleLayer()])
    .jpeg({ quality: 95 })
    .toBuffer();
}

/** What the provider returns: the same vehicle and its shadow, nothing else. */
async function providerCutout(): Promise<Uint8Array> {
  return sharp({
    create: { background: { alpha: 0, b: 0, g: 0, r: 0 }, channels: 4, height: HEIGHT, width: WIDTH },
  })
    .composite([await shadowLayer(), await vehicleLayer()])
    .webp({ lossless: true })
    .toBuffer();
}

function colourAt(image: Rendered, x: number, y: number): string {
  const index = (y * image.width + x) * 3;
  return Array.from(image.pixels.subarray(index, index + 3)).join();
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return Buffer.from(left).equals(Buffer.from(right));
}

/** The case identical to `testCase` except for one switch, if the step allows it. */
function partner(
  cases: TreatmentCase[],
  testCase: TreatmentCase,
  toggle: keyof TreatmentToggles,
): TreatmentCase | undefined {
  return cases.find(
    (candidate) =>
      candidate.studio.id === testCase.studio.id &&
      candidate.toggles[toggle] !== testCase.toggles[toggle] &&
      TOGGLE_KEYS.every(
        (key) => key === toggle || candidate.toggles[key] === testCase.toggles[key],
      ),
  );
}

describe("worker output across the 36-case treatment matrix", () => {
  const cases = createTreatmentMatrix();
  const outputs = new Map<string, Rendered>();

  beforeAll(async () => {
    const source = await sourcePhoto();
    const cutout = await providerCutout();
    const backgrounds = new FileStudioBackgroundSource(STUDIO_BACKGROUND_DIRECTORY);
    for (const [index, testCase] of cases.entries()) {
      const storage = new MemoryStorage();
      const provider = new FixedCutoutProvider(cutout);
      const job = createClaimedJob({
        checksumSha256: calculateSha256(source),
        id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
        options: testCase.options,
        sizeBytes: BigInt(source.byteLength),
      });
      storage.objects.set(job.originalObjectKey, {
        bytes: source,
        contentType: "image/jpeg",
        metadata: {},
      });
      const result = await new ProcessingJobExecutor(storage, provider, backgrounds, {
        maximumInputBytes: 10_000_000,
        maximumPixels: 10_000_000,
        previewMaximumWidth: 320,
      }).execute(job);
      if (!result.ok) throw new Error(`${testCase.id} failed: ${result.failure.errorMessage}`);
      const stored = storage.objects.get(buildProcessingObjectKeys(job).output);
      if (!stored) throw new Error(`${testCase.id} stored no output.`);
      const decoded = await sharp(stored.bytes)
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      outputs.set(testCase.id, {
        bytes: stored.bytes,
        height: decoded.info.height,
        pixels: decoded.data,
        requests: provider.requests,
        width: decoded.info.width,
      });
    }
  }, 180_000);

  function output(testCase: TreatmentCase): Rendered {
    const rendered = outputs.get(testCase.id);
    if (!rendered) throw new Error(`${testCase.id} was not rendered.`);
    return rendered;
  }

  it("renders all 36 cases as WebP", async () => {
    expect(cases).toHaveLength(TREATMENT_MATRIX_SIZE);
    expect(outputs.size).toBe(TREATMENT_MATRIX_SIZE);
    for (const rendered of outputs.values()) {
      expect((await sharp(rendered.bytes).metadata()).format).toBe("webp");
    }
  });

  describe.each(cases)("$id", (testCase) => {
    const { toggles } = testCase;

    it("asks the provider only for a studio background", () => {
      const { requests } = output(testCase);
      expect(requests).toHaveLength(toggles.studioBackground ? 1 : 0);
    });

    it("frames the image by its composition setting", () => {
      const { height, width } = output(testCase);
      if (!toggles.studioBackground) {
        expect([width, height]).toEqual([WIDTH, HEIGHT]);
      } else if (toggles.maintainComposition) {
        expect([width, height]).toEqual([WIDTH + 2 * PADDING, HEIGHT + 2 * PADDING]);
      } else {
        expect([width, height]).toEqual([1_600, 1_200]);
      }
    });
  });

  it("Check B — Image Enhancement changes the vehicle and not one background pixel", () => {
    for (const testCase of cases.filter(({ toggles }) => toggles.enhancement)) {
      const other = partner(cases, testCase, "enhancement");
      if (!other) throw new Error(`No enhancement partner for ${testCase.id}.`);
      const [on, off] = [output(testCase), output(other)];
      expect(sameBytes(on.bytes, off.bytes)).toBe(false);
      expect([on.width, on.height]).toEqual([off.width, off.height]);
      if (testCase.toggles.studioBackground) {
        for (const [x, y] of [
          [3, 3],
          [on.width - 4, 3],
          [3, on.height - 4],
          [on.width - 4, on.height - 4],
        ] as const) {
          expect(colourAt(on, x, y)).toBe(colourAt(off, x, y));
        }
      }
    }
  });

  it("Check C — Maintain Composition switches the framing of a studio image", () => {
    for (const testCase of cases.filter(
      ({ toggles }) => toggles.studioBackground && toggles.maintainComposition,
    )) {
      const other = partner(cases, testCase, "maintainComposition");
      if (!other) throw new Error(`No composition partner for ${testCase.id}.`);
      expect(output(testCase).width).not.toBe(output(other).width);
    }
  });

  it("Check D — each studio background renders differently", () => {
    for (const testCase of cases.filter(
      ({ studio, toggles }) => toggles.studioBackground && studio.background === "PREMIUM_WHITE",
    )) {
      const siblings = cases.filter(
        (candidate) =>
          candidate.toggleId === testCase.toggleId &&
          candidate.studio.floor === testCase.studio.floor,
      );
      expect(new Set(siblings.map((sibling) => colourAt(output(sibling), 3, 3))).size).toBe(3);
    }
  });

  it("Check E — the standard floor differs from a plain background", () => {
    for (const testCase of cases.filter(
      ({ studio, toggles }) => toggles.studioBackground && studio.floor === "HORIZON",
    )) {
      const plain = cases.find(
        (candidate) =>
          candidate.toggleId === testCase.toggleId &&
          candidate.studio.background === testCase.studio.background &&
          candidate.studio.floor === "PLAIN",
      );
      if (!plain) throw new Error(`No plain partner for ${testCase.id}.`);
      expect(sameBytes(output(testCase).bytes, output(plain).bytes)).toBe(false);
    }
  });

  it("Check F — with Studio Background off, background and floor choices change nothing", () => {
    const studioOff = cases.filter(({ toggles }) => !toggles.studioBackground);
    expect(studioOff).toHaveLength(12);
    for (const toggleId of new Set(studioOff.map(({ toggleId }) => toggleId))) {
      const [first, ...rest] = studioOff.filter((testCase) => testCase.toggleId === toggleId);
      if (!first) throw new Error(`No cases for ${toggleId}.`);
      for (const other of rest) {
        expect(sameBytes(output(other).bytes, output(first).bytes)).toBe(true);
      }
    }
  });

  it("Check G — with Studio Background off, the photo keeps its own surroundings", () => {
    for (const testCase of cases.filter(
      ({ toggles }) => !toggles.studioBackground && !toggles.enhancement,
    )) {
      const [red, green, blue] = colourAt(output(testCase), 20, 20).split(",").map(Number);
      expect(Math.abs((red ?? 0) - SCENERY_WALL.r)).toBeLessThanOrEqual(6);
      expect(Math.abs((green ?? 0) - SCENERY_WALL.g)).toBeLessThanOrEqual(6);
      expect(Math.abs((blue ?? 0) - SCENERY_WALL.b)).toBeLessThanOrEqual(6);
    }
  });
});
