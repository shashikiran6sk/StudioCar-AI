import { describe, expect, it } from "vitest";

import { DEFAULT_PROCESSING_OPTIONS } from "../../../../apps/web/src/features/vehicle-create/vehicle-create.constants";
import { toProcessingBatchCommand } from "../../../../apps/web/src/features/vehicle-create/to-processing-batch-command";

const VEHICLE_ID = "0e879f46-1193-4d77-b785-057fe026d998";
const ASSET_ID = "331a1e25-b9d8-4b1a-a398-8351a58f8c24";

describe("toProcessingBatchCommand", () => {
  it("includes a trimmed label", () => {
    expect(
      toProcessingBatchCommand(
        VEHICLE_ID,
        [ASSET_ID],
        DEFAULT_PROCESSING_OPTIONS,
        "  T02-S04  ",
      ),
    ).toEqual({
      assetIds: [ASSET_ID],
      label: "T02-S04",
      options: DEFAULT_PROCESSING_OPTIONS,
      vehicleId: VEHICLE_ID,
    });
  });

  it("leaves out a blank label entirely", () => {
    const command = toProcessingBatchCommand(
      VEHICLE_ID,
      [ASSET_ID],
      DEFAULT_PROCESSING_OPTIONS,
      "   ",
    );
    expect(command).toEqual({
      assetIds: [ASSET_ID],
      options: DEFAULT_PROCESSING_OPTIONS,
      vehicleId: VEHICLE_ID,
    });
    expect("label" in command).toBe(false);
  });
});
