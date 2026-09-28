import { getWebDatabase } from "../db/web-database";
import { PrismaVehicleRepository } from "../db/repositories/vehicle-repository";

import { VehicleService } from "./vehicle-service";

let vehicleService: VehicleService | undefined;

export function getVehicleService(): VehicleService {
  if (vehicleService) return vehicleService;

  const database = getWebDatabase();
  vehicleService = new VehicleService(new PrismaVehicleRepository(database));
  return vehicleService;
}
