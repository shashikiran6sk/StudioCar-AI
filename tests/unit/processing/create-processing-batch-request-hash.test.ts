import { describe, expect, it } from "vitest";

import { CreateProcessingBatchSchema } from "../../../packages/contracts/src/jobs";
import { createProcessingBatchRequestHash } from "../../../packages/processing/src/create-processing-batch-request-hash";

const baseCommand = CreateProcessingBatchSchema.parse({
  vehicleId: "0e879f46-1193-4d77-b785-057fe026d998",
  assetIds: ["331a1e25-b9d8-4b1a-a398-8351a58f8c24"],
  options: {},
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

  it("changes when only the floor changes", () => {
    const plain = createProcessingBatchRequestHash({
      ...baseCommand,
      options: { ...baseCommand.options, floor: "PLAIN" },
    });

    expect(plain).not.toBe(createProcessingBatchRequestHash(baseCommand));
  });

  it("keeps an unlabelled request's hash and treats a label as part of the request", () => {
    // Pinned: the digest every unlabelled batch stored before labels existed.
    const unlabelled = createProcessingBatchRequestHash(baseCommand);
    expect(unlabelled).toBe(
      "76ba328e1a56a1ee3bcb73ada2ba47b9e0896412a2288bc6068bda32c43e30f9",
    );
    const labelled = createProcessingBatchRequestHash({
      ...baseCommand,
      label: "T02-S04",
    });
    expect(labelled).not.toBe(unlabelled);
    expect(
      createProcessingBatchRequestHash({ ...baseCommand, label: "T02-S05" }),
    ).not.toBe(labelled);
  });
});
