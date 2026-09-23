import sharp, { type OverlayOptions } from "sharp";
import { beforeAll, describe, expect, it } from "vitest";

import type {
  BackgroundRemovalProvider,
  ProcessImageInput,
  ProcessImageResult,
} from "../../../../../packages/processing/src/background-removal-provider.types";
import { buildProcessingObjectKeys } from "../../../../../workers/image-processing/src/execution/build-processing-object-keys";
import { calculateSha256 } from "../../../../../workers/image-processing/src/execution/calculate-sha256";
import { ProcessingJobExecutor } from "../../../../../workers/image-processing/src/execution/processing-job-executor";
import { STUDIO_SCENE_PALETTES } from "../../../../../workers/image-processing/src/execution/studio-scene.constants";
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

/**
 * Every case of the Customize-treatment matrix, run through the worker's own
 * executor and renderer. The provider is replaced by a fixed cutout, so any
 * difference between two outputs comes from the options alone.
 */

const WIDTH = 800;
const HEIGHT = 500;
const PADDING = Math.round(Math.min(WIDTH, HEIGHT) * 0.08);
const SCENERY_WALL = { b: 190, g: 170, r: 150 };
const SCENERY_GROUND = { b: 90, g: 100, r: 110 };
const WHITE_FILL = { b: 255, g: 255, r: 255 };
const PLAIN_COLOURS = {
  DARK_STUDIO: { b: 36, g: 31, r: 27 },
  GREY_STUDIO: { b: 222, g: 220, r: 218 },
  PREMIUM_WHITE: { b: 248, g: 250, r: 250 },
} satisfies Record<TreatmentCase["studio"]["background"], RGB>;
const COLOUR_TOLERANCE = 12;
const CHANNELS: readonly (keyof RGB)[] = ["r", "g", "b"];
const TOGGLE_KEYS: readonly (keyof TreatmentToggles)[] = [
  "enhancement",
  "maintainComposition",
  "platePrivacy",
  "studioBackground",
];

interface RGB {
  b: number;
  g: number;
  r: number;
}

interface Rendered {
  bytes: Uint8Array;
  height: number;
  pixels: Buffer;
  providerCalls: ProcessImageInput[];
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

class FixedCutoutProvider implements BackgroundRemovalProvider {
  public readonly key = "REMOVEBG";
  public readonly inputs: ProcessImageInput[] = [];

  public constructor(private readonly cutout: Uint8Array) {}

  public process(input: ProcessImageInput): Promise<ProcessImageResult> {
    this.inputs.push(input);
    return Promise.resolve({
      ok: true,
      result: {
        bytes: this.cutout,
        contentType: "image/webp",
        providerLatencyMilliseconds: 1,
        providerRequestId: null,
      },
    });
  }
}

/** A vehicle body with a striped "number plate" on it. */
async function vehicleLayers(): Promise<OverlayOptions[]> {
  const body = await sharp({
    create: { background: { alpha: 1, b: 200, g: 60, r: 40 }, channels: 4, height: 200, width: 400 },
  })
    .png()
    .toBuffer();
  const stripe = await sharp({
    create: { background: { alpha: 1, b: 10, g: 10, r: 10 }, channels: 4, height: 14, width: 4 },
  })
    .png()
    .toBuffer();
  const plate = await sharp({
    create: { background: { alpha: 1, b: 250, g: 250, r: 250 }, channels: 4, height: 20, width: 60 },
  })
    .composite([6, 16, 26, 36, 46].map((left) => ({ input: stripe, left, top: 3 })))
    .png()
    .toBuffer();
  return [
    { input: body, left: 200, top: 230 },
    { input: plate, left: 500, top: 380 },
  ];
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
    .composite([{ input: ground, left: 0, top: 300 }, ...(await vehicleLayers())])
    .jpeg({ quality: 95 })
    .toBuffer();
}

/** What background removal returns: the same vehicle, nothing around it. */
async function providerCutout(): Promise<Uint8Array> {
  return sharp({
    create: { background: { alpha: 0, b: 0, g: 0, r: 0 }, channels: 4, height: HEIGHT, width: WIDTH },
  })
    .composite(await vehicleLayers())
    .webp({ lossless: true })
    .toBuffer();
}

function colourAt(image: Rendered, x: number, y: number): RGB {
  const index = (y * image.width + x) * 3;
  return {
    b: image.pixels[index + 2] ?? -1,
    g: image.pixels[index + 1] ?? -1,
    r: image.pixels[index] ?? -1,
  };
}

function hexColour(hex: string): RGB {
  const value = Number.parseInt(hex.slice(1), 16);
  return { b: value & 0xff, g: (value >> 8) & 0xff, r: (value >> 16) & 0xff };
}

function expectColour(actual: RGB, expected: RGB) {
  for (const channel of CHANNELS) {
    expect(Math.abs(actual[channel] - expected[channel])).toBeLessThanOrEqual(
      COLOUR_TOLERANCE,
    );
  }
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return Buffer.from(left).equals(Buffer.from(right));
}

/** Cases identical to `testCase` except for one switch. */
function partner(
  cases: TreatmentCase[],
  testCase: TreatmentCase,
  toggle: keyof TreatmentToggles,
): TreatmentCase {
  const found = cases.find(
    (candidate) =>
      candidate.studio.id === testCase.studio.id &&
      candidate.toggles[toggle] !== testCase.toggles[toggle] &&
      TOGGLE_KEYS.every(
        (key) => key === toggle || candidate.toggles[key] === testCase.toggles[key],
      ),
  );
  if (!found) throw new Error(`No partner for ${testCase.id} on ${toggle}.`);
  return found;
}

describe("worker output across the 96-case treatment matrix", () => {
  const cases = createTreatmentMatrix();
  const outputs = new Map<string, Rendered>();

  beforeAll(async () => {
    const source = await sourcePhoto();
    const cutout = await providerCutout();
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
      const result = await new ProcessingJobExecutor(storage, provider, {
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
        providerCalls: provider.inputs,
        width: decoded.info.width,
      });
    }
  }, 120_000);

  function output(testCase: TreatmentCase): Rendered {
    const rendered = outputs.get(testCase.id);
    if (!rendered) throw new Error(`${testCase.id} was not rendered.`);
    return rendered;
  }

  function expectStudioColours(testCase: TreatmentCase) {
    const { studio } = testCase;
    const image = output(testCase);
    const top = colourAt(image, 3, 3);
    const bottom = colourAt(image, 3, image.height - 4);
    if (studio.floor === "PLAIN") {
      expectColour(top, PLAIN_COLOURS[studio.background]);
      expectColour(bottom, PLAIN_COLOURS[studio.background]);
    } else {
      const palette = STUDIO_SCENE_PALETTES[studio.background];
      expectColour(top, hexColour(palette.wallTop));
      expectColour(bottom, hexColour(palette.floorBottom));
    }
  }

  it("renders all 96 cases", () => {
    expect(cases).toHaveLength(TREATMENT_MATRIX_SIZE);
    expect(outputs.size).toBe(TREATMENT_MATRIX_SIZE);
  });

  describe.each(cases)("$id", (testCase) => {
    const { studio, toggles } = testCase;

    it("asks for background removal only for a studio background", () => {
      const calls = output(testCase).providerCalls;
      if (toggles.studioBackground) {
        expect(calls).toHaveLength(1);
        expect(calls[0]?.shadow).toBe("NATURAL");
      } else {
        expect(calls).toHaveLength(0);
      }
    });

    it("frames the image by its composition setting", () => {
      const { height, width } = output(testCase);
      if (toggles.maintainComposition) {
        expect([width, height]).toEqual([WIDTH + 2 * PADDING, HEIGHT + 2 * PADDING]);
      } else {
        expect(width - 1_600).toBe(height - 1_200);
        expect(width).toBeGreaterThan(1_600);
      }
    });

    if (toggles.studioBackground && !toggles.enhancement) {
      it("draws the chosen background and floor in their specified colours", () => {
        expectStudioColours(testCase);
      });
    } else if (toggles.studioBackground) {
      it("draws the background nearest to the chosen one", () => {
        const corner = colourAt(output(testCase), 3, 3);
        const nearest = Object.entries(PLAIN_COLOURS)
          .map(([background, colour]) => ({
            background,
            distance: CHANNELS.reduce(
              (total, channel) => total + Math.abs(corner[channel] - colour[channel]),
              0,
            ),
          }))
          .sort((left, right) => left.distance - right.distance)[0];
        expect(nearest?.background).toBe(studio.background);
      });
    } else if (!toggles.enhancement) {
      it("keeps the photo's own surroundings", () => {
        const image = output(testCase);
        const inset = toggles.maintainComposition ? PADDING + 5 : 0;
        if (inset > 0) expectColour(colourAt(image, inset, inset), SCENERY_WALL);
      });
    }
  });

  it("Check A — Hide Number Plate is stored but changes nothing (known defect)", () => {
    for (const testCase of cases.filter(({ toggles }) => toggles.platePrivacy)) {
      const other = partner(cases, testCase, "platePrivacy");
      expect(sameBytes(output(testCase).bytes, output(other).bytes)).toBe(true);
    }
  });

  it.fails("Check A — Hide Number Plate changes the plate", () => {
    for (const testCase of cases.filter(({ toggles }) => toggles.platePrivacy)) {
      const other = partner(cases, testCase, "platePrivacy");
      expect(sameBytes(output(testCase).bytes, output(other).bytes)).toBe(false);
    }
  });

  it("Check B — Image Enhancement changes the output and nothing else", () => {
    for (const testCase of cases.filter(({ toggles }) => toggles.enhancement)) {
      const other = partner(cases, testCase, "enhancement");
      const [on, off] = [output(testCase), output(other)];
      expect(sameBytes(on.bytes, off.bytes)).toBe(false);
      expect([on.width, on.height]).toEqual([off.width, off.height]);
    }
  });

  it("Check C — Maintain Composition switches the framing", () => {
    for (const testCase of cases.filter(({ toggles }) => toggles.maintainComposition)) {
      const other = partner(cases, testCase, "maintainComposition");
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
      const corners = siblings.map((sibling) =>
        JSON.stringify(colourAt(output(sibling), 3, 3)),
      );
      expect(new Set(corners).size).toBe(3);
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
    expect(studioOff).toHaveLength(48);
    for (const toggleId of new Set(studioOff.map(({ toggleId }) => toggleId))) {
      const [first, ...rest] = studioOff.filter((testCase) => testCase.toggleId === toggleId);
      if (!first) throw new Error(`No cases for ${toggleId}.`);
      for (const other of rest) {
        expect(sameBytes(output(other).bytes, output(first).bytes)).toBe(true);
      }
    }
  });

  // Known defect: enhancement normalises the finished picture, background
  // included, so a photo with a narrow tonal range shifts the studio colours.
  it.fails("keeps the studio colours as specified when Image Enhancement is on", () => {
    for (const testCase of cases.filter(
      ({ toggles }) => toggles.studioBackground && toggles.enhancement,
    )) {
      expectStudioColours(testCase);
    }
  });

  it.fails("keeps the original frame when Studio Background is off (known defect: white border)", () => {
    for (const testCase of cases.filter(
      ({ toggles }) => !toggles.studioBackground && toggles.maintainComposition,
    )) {
      const { height, width } = output(testCase);
      expect([width, height]).toEqual([WIDTH, HEIGHT]);
    }
  });

  it.fails("fits the vehicle without letterboxing the photo when Studio Background is off (known defect)", () => {
    for (const testCase of cases.filter(
      ({ toggles }) =>
        !toggles.studioBackground && !toggles.maintainComposition && !toggles.enhancement,
    )) {
      const corner = colourAt(output(testCase), 3, 3);
      expect(corner).not.toEqual(WHITE_FILL);
    }
  });
});
