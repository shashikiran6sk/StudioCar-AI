import {
  MAXIMUM_STORAGE_DELETION_BATCH_SIZE,
  MINIMUM_STORAGE_DELETION_BATCH_SIZE,
} from "./storage-deletion-repository.constants";

export function validateStorageDeletionBatchSize(batchSize: number): void {
  if (
    !Number.isInteger(batchSize) ||
    batchSize < MINIMUM_STORAGE_DELETION_BATCH_SIZE ||
    batchSize > MAXIMUM_STORAGE_DELETION_BATCH_SIZE
  ) {
    throw new RangeError(
      `Storage deletion batch size must be between ${String(MINIMUM_STORAGE_DELETION_BATCH_SIZE)} and ${String(MAXIMUM_STORAGE_DELETION_BATCH_SIZE)}.`,
    );
  }
}
