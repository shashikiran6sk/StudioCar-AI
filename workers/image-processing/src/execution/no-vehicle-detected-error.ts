import { NO_VEHICLE_DETECTED_MESSAGE } from "./image-execution.constants";

/** The provider returned a cutout with no vehicle body in it. */
export class NoVehicleDetectedError extends Error {
  public constructor() {
    super(NO_VEHICLE_DETECTED_MESSAGE);
    this.name = "NoVehicleDetectedError";
  }
}
