import type { InventoryItemStatus } from "@studiocar/contracts";
import { VehicleStatus } from "@studiocar/database-runtime";

export function toInventoryItemStatus(
  status: VehicleStatus,
): InventoryItemStatus {
  switch (status) {
    case VehicleStatus.PROCESSING:
      return "PROCESSING";
    case VehicleStatus.READY:
      return "COMPLETED";
    case VehicleStatus.PARTIALLY_FAILED:
      return "FAILED";
    case VehicleStatus.ARCHIVED:
      return "ARCHIVED";
    case VehicleStatus.DRAFT:
    case VehicleStatus.UPLOADING:
      throw new Error("Non-operational vehicles cannot appear in inventory.");
  }
}
