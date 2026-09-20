const BYTES_PER_GIGABYTE = 1_073_741_824;
const BYTES_PER_MEGABYTE = 1_048_576;
const STORAGE_DECIMAL_PLACES = 1;

export function formatStorageSize(sizeBytes: number): string {
  if (sizeBytes >= BYTES_PER_GIGABYTE) {
    return `${(sizeBytes / BYTES_PER_GIGABYTE).toFixed(STORAGE_DECIMAL_PLACES)} GB`;
  }
  if (sizeBytes >= BYTES_PER_MEGABYTE) {
    return `${(sizeBytes / BYTES_PER_MEGABYTE).toFixed(STORAGE_DECIMAL_PLACES)} MB`;
  }
  return "0 GB";
}
