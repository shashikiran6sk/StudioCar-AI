import { describe, expect, it } from "vitest";

import { createProcessingBatchRequestHash } from "../../../packages/processing/src/create-processing-batch-request-hash";
import { createProcessingOptionsKey } from "../../../packages/processing/src/create-processing-options-key";
import { createStudioVersionKey } from "../../../packages/processing/src/create-studio-version-key";
import {
  TREATMENT_MATRIX_SIZE,
  createTreatmentMatrix,
} from "../../support/studio-treatment-matrix";

const VEHICLE_ID = "4bb7fa89-c907-4458-9786-8aafc2235728";
const ASSET_ID = "5cc8fb90-d018-4569-a897-9bbfd3346839";

describe("processing keys across the treatment matrix", () => {
  const cases = createTreatmentMatrix();
  const studioOn = cases.filter(({ toggles }) => toggles.studioBackground);
  const studioOff = cases.filter(({ toggles }) => !toggles.studioBackground);

  it("gives each of the 96 labelled batches its own request and version", () => {
    expect(cases).toHaveLength(TREATMENT_MATRIX_SIZE);
    const hashes = cases.map(({ label, options }) =>
      createProcessingBatchRequestHash({
        assetIds: [ASSET_ID],
        label,
        options,
        vehicleId: VEHICLE_ID,
      }),
    );
    const versions = cases.map(({ label, options }) =>
      createStudioVersionKey(options, label),
    );

    expect(new Set(hashes).size).toBe(TREATMENT_MATRIX_SIZE);
    expect(new Set(versions).size).toBe(TREATMENT_MATRIX_SIZE);
  });

  it("gives every studio treatment its own unlabelled version", () => {
    expect(studioOn).toHaveLength(48);
    expect(
      new Set(studioOn.map(({ options }) => createProcessingOptionsKey(options)))
        .size,
    ).toBe(48);
  });

  it("cannot tell the three backgrounds apart once Studio Background is off", () => {
    // With the switch off the Customize step sends ORIGINAL, so S01/S03/S05
    // and S02/S04/S06 are the same request apart from their labels.
    const keys = studioOff.map(({ options }) => createProcessingOptionsKey(options));
    expect(new Set(keys).size).toBe(16);
  });

  // Known defect: the floor has no effect on an ORIGINAL background, yet it
  // stays in the stored options and splits one rendering into two versions.
  it.fails("gives renderings that cannot differ one unlabelled version", () => {
    const keys = studioOff.map(({ options }) => createProcessingOptionsKey(options));
    expect(new Set(keys).size).toBe(8);
  });
});
