export const STUDIO_ASSET_CONTENT_TYPES = {
  ".png": "image/png",
  ".webp": "image/webp",
};

export const STUDIO_ASSET_CHECKSUM_METADATA_KEY = "checksum-sha256";

export const UNSUPPORTED_STUDIO_ASSET_MESSAGE =
  "Studio assets must be PNG or WebP images.";
export const CHANGED_STUDIO_ASSET_MESSAGE =
  "A different studio asset is already stored under this versioned key. Publish the change under a new version, or pass --replace to overwrite a development bucket.";
