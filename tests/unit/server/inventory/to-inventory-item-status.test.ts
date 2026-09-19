import { VehicleStatus } from "../../../../packages/database/src/index";
import { describe, expect, it } from "vitest";

import { toInventoryItemStatus } from "../../../../apps/web/src/server/inventory/to-inventory-item-status";

describe("toInventoryItemStatus", () => {
  it.each([
    [VehicleStatus.PROCESSING, "PROCESSING"],
    [VehicleStatus.READY, "COMPLETED"],
    [VehicleStatus.PARTIALLY_FAILED, "FAILED"],
    [VehicleStatus.ARCHIVED, "ARCHIVED"],
  ])("maps %s to %s", (status, expected) => {
    expect(toInventoryItemStatus(status)).toBe(expected);
  });

  it("rejects workflow drafts that are not inventory batches", () => {
    expect(() => toInventoryItemStatus(VehicleStatus.DRAFT)).toThrow(
      "Non-operational vehicles",
    );
  });
});
