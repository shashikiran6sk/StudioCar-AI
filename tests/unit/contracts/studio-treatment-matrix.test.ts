import { describe, expect, it } from "vitest";

import {
  CreateProcessingBatchSchema,
  MAX_PROCESSING_BATCH_LABEL_LENGTH,
} from "../../../packages/contracts/src/jobs";
import { ProcessingOptionsSchema } from "../../../packages/contracts/src/processing";
import {
  STUDIO_CONFIGURATIONS,
  TOGGLE_CONFIGURATIONS,
  TREATMENT_MATRIX_SIZE,
  createTreatmentMatrix,
} from "../../support/studio-treatment-matrix";

const VEHICLE_ID = "4bb7fa89-c907-4458-9786-8aafc2235728";
const ASSET_ID = "5cc8fb90-d018-4569-a897-9bbfd3346839";

describe("studio treatment matrix", () => {
  const cases = createTreatmentMatrix();

  it("generates exactly 96 uniquely identified cases", () => {
    expect(cases).toHaveLength(TREATMENT_MATRIX_SIZE);
    expect(new Set(cases.map((testCase) => testCase.id)).size).toBe(
      TREATMENT_MATRIX_SIZE,
    );
    expect(cases[0]?.id).toBe("T01-S01");
    expect(cases.at(-1)?.id).toBe("T16-S06");
  });

  it("covers every one of the 16 switch combinations once", () => {
    const combinations = TOGGLE_CONFIGURATIONS.map(({ toggles }) =>
      [
        toggles.platePrivacy,
        toggles.enhancement,
        toggles.studioBackground,
        toggles.maintainComposition,
      ].join(),
    );
    expect(new Set(combinations).size).toBe(16);
    expect(TOGGLE_CONFIGURATIONS.find(({ id }) => id === "T02")?.toggles).toEqual({
      enhancement: true,
      maintainComposition: true,
      platePrivacy: false,
      studioBackground: true,
    });
    expect(TOGGLE_CONFIGURATIONS.find(({ id }) => id === "T16")?.toggles).toEqual({
      enhancement: false,
      maintainComposition: false,
      platePrivacy: false,
      studioBackground: false,
    });
  });

  it("covers the three backgrounds with both floors", () => {
    expect(
      STUDIO_CONFIGURATIONS.map(({ background, floor }) => `${background}:${floor}`),
    ).toEqual([
      "PREMIUM_WHITE:PLAIN",
      "PREMIUM_WHITE:HORIZON",
      "DARK_STUDIO:PLAIN",
      "DARK_STUDIO:HORIZON",
      "GREY_STUDIO:PLAIN",
      "GREY_STUDIO:HORIZON",
    ]);
  });

  it("describes each case in a label the batch contract accepts", () => {
    expect(cases.find(({ id }) => id === "T02-S04")?.label).toBe(
      "T02-S04 | Plate OFF | Enhance ON | Studio ON | Composition ON | Dark Studio | Standard Floor",
    );
    for (const testCase of cases) {
      expect(testCase.label.length).toBeLessThanOrEqual(
        MAX_PROCESSING_BATCH_LABEL_LENGTH,
      );
      const command = CreateProcessingBatchSchema.parse({
        assetIds: [ASSET_ID],
        label: testCase.label,
        options: testCase.options,
        vehicleId: VEHICLE_ID,
      });
      expect(command.options).toEqual(testCase.options);
      expect(command.label).toBe(testCase.label);
    }
  });

  it("maps every switch to the stored option the worker reads", () => {
    for (const { options, studio, toggles } of cases) {
      expect(ProcessingOptionsSchema.parse(options)).toEqual(options);
      expect(options.platePrivacy).toBe(toggles.platePrivacy);
      expect(options.enhancement).toBe(toggles.enhancement);
      expect(options.crop).toBe(
        toggles.maintainComposition ? "MAINTAIN_COMPOSITION" : "FIT_VEHICLE",
      );
      expect(options.background).toBe(
        toggles.studioBackground ? studio.background : "ORIGINAL",
      );
      expect(options.floor).toBe(studio.floor);
    }
  });
});
