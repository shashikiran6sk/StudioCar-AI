import {
  STUDIO_ASSET_CONTENT_TYPES,
  UNSUPPORTED_STUDIO_ASSET_MESSAGE,
} from "./studio-asset-sync.constants";

/** The media type a processing asset is stored with, from its extension. */
export function studioAssetContentType(objectKey: string): string {
  const match = Object.entries(STUDIO_ASSET_CONTENT_TYPES).find(([extension]) =>
    objectKey.endsWith(extension),
  );
  if (!match) throw new Error(`${UNSUPPORTED_STUDIO_ASSET_MESSAGE} ${objectKey}`);
  return match[1];
}
