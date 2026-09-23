import { PROCESSING_STUDIO_ASSETS } from "../studio-scene/processing-studio-assets.constants";

/** Every processing asset the worker can ask for, each exactly once. */
export function listStudioAssetKeys(): string[] {
  return [
    ...Object.values(PROCESSING_STUDIO_ASSETS.backgrounds),
    ...Object.values(PROCESSING_STUDIO_ASSETS.floors).map(
      (floor) => floor.objectKey,
    ),
  ];
}
