import type {
  ProcessingOptions,
  ProcessingSettings,
  StudioTreatment,
} from "@studiocar/contracts";

export interface ProcessingOptionsDraft {
  settings: ProcessingSettings;
  studioBackgroundEnabled: boolean;
  studio: StudioTreatment | null;
}

/**
 * The options a batch is processed with, or `null` while a studio background
 * is wanted but not yet chosen. Only semantic IDs are included.
 */
export function buildProcessingOptions(
  draft: ProcessingOptionsDraft,
): ProcessingOptions | null {
  if (!draft.studioBackgroundEnabled) {
    return { ...draft.settings, backgroundId: "ORIGINAL" };
  }
  if (!draft.studio) return null;
  return { ...draft.settings, ...draft.studio };
}
