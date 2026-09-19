import { parseSessionEnvironment } from "@studiocar/config";
import {
  createDatabaseClient,
  PrismaVehicleRepository,
} from "@studiocar/database";

import { VehicleService } from "./vehicle-service";

let vehicleService: VehicleService | undefined;

export function getVehicleService(): VehicleService {
  if (vehicleService) return vehicleService;

  const environment = parseSessionEnvironment(process.env);
  const database = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
  });
  vehicleService = new VehicleService(new PrismaVehicleRepository(database));
  return vehicleService;
}
