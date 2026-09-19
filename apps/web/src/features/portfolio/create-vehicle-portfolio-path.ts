import { INVENTORY_PATH } from "../../app/app-routes";

export function createVehiclePortfolioPath(vehicleId: string): string {
  return `${INVENTORY_PATH}/${encodeURIComponent(vehicleId)}`;
}
