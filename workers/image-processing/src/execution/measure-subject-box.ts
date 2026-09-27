import { readVehicleAlpha } from "./read-vehicle-alpha";
import type { SubjectBox } from "./vehicle-alpha.types";

/** Strong foreground alpha bounds, independent of RGB and faint provider residue. */
export async function measureSubjectBox(
  cutout: Buffer,
): Promise<SubjectBox | null> {
  try {
    return (await readVehicleAlpha(cutout)).subject;
  } catch {
    return null;
  }
}
