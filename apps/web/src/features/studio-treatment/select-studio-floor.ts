import {
  StudioTreatmentSchema,
  type StudioFloorId,
  type StudioTreatment,
} from "@studiocar/contracts";

/**
 * Chooses a floor for the current background. A floor that belongs to a
 * different background is refused and the current choice is kept.
 */
export function selectStudioFloor(
  current: StudioTreatment,
  floorId: StudioFloorId,
): StudioTreatment {
  const next = StudioTreatmentSchema.safeParse({
    backgroundId: current.backgroundId,
    floorId,
  });
  return next.success ? next.data : current;
}
