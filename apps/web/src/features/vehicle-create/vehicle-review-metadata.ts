import type { VehicleDetailsValues } from "./vehicle-details.types";

const METADATA_SEPARATOR = " · ";
const STOCK_PREFIX = "Stock ";

export function vehicleReviewMetadata(details: VehicleDetailsValues): string {
  const values = [
    details.brand.trim(),
    details.model.trim(),
    details.stockId.trim() ? `${STOCK_PREFIX}${details.stockId.trim()}` : "",
  ].filter((value) => value.length > 0);
  return values.join(METADATA_SEPARATOR);
}
