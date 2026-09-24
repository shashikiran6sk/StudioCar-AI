const IMAGE_ASSET_LOCK_PREFIX = "image-asset-mutation:";

export function createImageAssetLockKey(assetId: string): string {
  return `${IMAGE_ASSET_LOCK_PREFIX}${assetId}`;
}
