import {
  ApiErrorSchema,
  CommitUploadResponseSchema,
  type CommitUploadResponse,
} from "@studiocar/contracts";

import {
  PHOTO_UPLOAD_COMMIT_ROUTE_SUFFIX,
  PHOTO_UPLOAD_CONTENT_TYPE_HEADER,
  PHOTO_UPLOAD_GENERIC_ERROR,
  PHOTO_UPLOAD_ROUTE_PREFIX,
} from "./vehicle-create.constants";

export async function commitPhotoUpload(
  assetId: string,
  etag: string | undefined,
  fetcher: typeof fetch = fetch,
): Promise<CommitUploadResponse> {
  const response = await fetcher(
    `${PHOTO_UPLOAD_ROUTE_PREFIX}/${assetId}${PHOTO_UPLOAD_COMMIT_ROUTE_SUFFIX}`,
    {
      method: "POST",
      headers: { [PHOTO_UPLOAD_CONTENT_TYPE_HEADER]: "application/json" },
      body: JSON.stringify(etag ? { etag } : {}),
    },
  );
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = ApiErrorSchema.safeParse(body);
    throw new Error(
      error.success ? error.data.error.message : PHOTO_UPLOAD_GENERIC_ERROR,
    );
  }
  return CommitUploadResponseSchema.parse(body);
}
