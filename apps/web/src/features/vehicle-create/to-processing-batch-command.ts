import type {
  CreateProcessingBatch,
  ProcessingOptions,
} from "@studiocar/contracts";

/**
 * The processing command the Review step submits. A blank label is left out,
 * so an unlabelled batch is exactly the request it was before labels existed.
 */
export function toProcessingBatchCommand(
  vehicleId: string,
  assetIds: string[],
  options: ProcessingOptions,
  batchLabel: string,
): CreateProcessingBatch {
  const label = batchLabel.trim();
  return label.length > 0
    ? { assetIds, label, options, vehicleId }
    : { assetIds, options, vehicleId };
}
