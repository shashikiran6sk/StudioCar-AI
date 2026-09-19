import {
  ApiErrorSchema,
  CreateProcessingBatchResponseSchema,
  type CreateProcessingBatch,
  type CreateProcessingBatchResponse,
} from "@studiocar/contracts";

import {
  PROCESSING_BATCH_GENERIC_ERROR,
  PROCESSING_BATCH_IDEMPOTENCY_HEADER,
  PROCESSING_BATCH_METHOD,
  PROCESSING_BATCH_ROUTE,
  VEHICLE_CREATE_CONTENT_TYPE_HEADER,
  VEHICLE_CREATE_JSON_CONTENT_TYPE,
} from "./vehicle-create.constants";

export async function requestProcessingBatch(
  command: CreateProcessingBatch,
  idempotencyKey: string,
  fetcher: typeof fetch = fetch,
): Promise<CreateProcessingBatchResponse> {
  const response = await fetcher(PROCESSING_BATCH_ROUTE, {
    body: JSON.stringify(command),
    headers: {
      [VEHICLE_CREATE_CONTENT_TYPE_HEADER]: VEHICLE_CREATE_JSON_CONTENT_TYPE,
      [PROCESSING_BATCH_IDEMPOTENCY_HEADER]: idempotencyKey,
    },
    method: PROCESSING_BATCH_METHOD,
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = ApiErrorSchema.safeParse(body);
    throw new Error(
      error.success ? error.data.error.message : PROCESSING_BATCH_GENERIC_ERROR,
    );
  }
  return CreateProcessingBatchResponseSchema.parse(body);
}
