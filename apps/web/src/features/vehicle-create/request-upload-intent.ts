import {
  ApiErrorSchema,
  CreateUploadIntentResponseSchema,
  type CreateUploadIntent,
  type CreateUploadIntentResponse,
} from "@studiocar/contracts";

import {
  PHOTO_UPLOAD_CONTENT_TYPE_HEADER,
  PHOTO_UPLOAD_GENERIC_ERROR,
  PHOTO_UPLOAD_IDEMPOTENCY_HEADER,
  PHOTO_UPLOAD_PRESIGN_ROUTE,
} from "./vehicle-create.constants";

export async function requestUploadIntent(
  command: CreateUploadIntent,
  idempotencyKey: string,
  fetcher: typeof fetch = fetch,
): Promise<CreateUploadIntentResponse> {
  const response = await fetcher(PHOTO_UPLOAD_PRESIGN_ROUTE, {
    method: "POST",
    headers: {
      [PHOTO_UPLOAD_CONTENT_TYPE_HEADER]: "application/json",
      [PHOTO_UPLOAD_IDEMPOTENCY_HEADER]: idempotencyKey,
    },
    body: JSON.stringify(command),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = ApiErrorSchema.safeParse(body);
    throw new Error(
      error.success ? error.data.error.message : PHOTO_UPLOAD_GENERIC_ERROR,
    );
  }
  return CreateUploadIntentResponseSchema.parse(body);
}
