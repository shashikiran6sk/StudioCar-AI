import type { StudioBackgroundId, StudioFloorId } from "@studiocar/contracts";

export interface StudioFloorChoice {
  id: StudioFloorId;
  label: string;
  previewPath: string;
}

export interface StudioBackgroundChoice {
  id: StudioBackgroundId;
  label: string;
  previewPath: string;
  floors: readonly StudioFloorChoice[];
}
