import type { PortfolioStatus } from "@studiocar/contracts";
import { VehicleStatus } from "@studiocar/database-runtime";

export function toPortfolioStatus(status: VehicleStatus): PortfolioStatus {
  switch (status) {
    case VehicleStatus.READY:
      return "COMPLETED";
    case VehicleStatus.PARTIALLY_FAILED:
      return "NEEDS_ATTENTION";
    case VehicleStatus.ARCHIVED:
      return "ARCHIVED";
    case VehicleStatus.DRAFT:
    case VehicleStatus.UPLOADING:
    case VehicleStatus.PROCESSING:
      throw new Error("Vehicle is not available as a portfolio.");
  }
}
