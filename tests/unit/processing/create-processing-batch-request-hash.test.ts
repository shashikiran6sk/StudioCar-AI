import { describe, expect, it } from "vitest";

import { CreateProcessingBatchSchema } from "../../../packages/contracts/src/jobs";
import { createProcessingBatchRequestHash } from "../../../packages/processing/src/create-processing-batch-request-hash";

const baseCommand = CreateProcessingBatchSchema.parse({
  vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
  assetIds: ["331a1e25-b9d8-4b1a-a398-8351a58f8c24"],
  options: { backgroundId: "DARK_STUDIO", floorId: "DARK_STUDIO_FLOOR" },
});

describe("createProcessingBatchRequestHash", () => {
  it("is stable for an exact replay and changes with request semantics", () => {
    const first = createProcessingBatchRequestHash(baseCommand);
    const replay = createProcessingBatchRequestHash(baseCommand);
    const changed = createProcessingBatchRequestHash({
      ...baseCommand,
      options: { ...baseCommand.options, enhancement: false },
    });

    expect(first).toHaveLength(64);
    expect(replay).toBe(first);
    expect(changed).not.toBe(first);
  });

  // A replay that switches the standard floor for a turntable is a different
  // request; returning the original batch would silently drop the turntable.
  it("changes when only the floor changes", () => {
    const standard = createProcessingBatchRequestHash(baseCommand);
    const turntable = createProcessingBatchRequestHash(
      CreateProcessingBatchSchema.parse({
        ...baseCommand,
        options: { ...baseCommand.options, floorId: "DARK_TURNTABLE" },
      }),
    );

    expect(turntable).not.toBe(standard);
  });
});
