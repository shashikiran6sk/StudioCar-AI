const BYTES_PER_MEGABYTE = 1_048_576;
const PHOTO_SIZE_DECIMAL_PLACES = 1;

export function formatPhotoSize(sizeBytes: number): string {
  return `${(sizeBytes / BYTES_PER_MEGABYTE).toFixed(PHOTO_SIZE_DECIMAL_PLACES)} MB`;
}
