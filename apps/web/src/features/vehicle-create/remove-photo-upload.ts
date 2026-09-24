import { ApiErrorSchema } from "@studiocar/contracts";

import {
  PHOTO_UPLOAD_REMOVE_GENERIC_ERROR,
  PHOTO_UPLOAD_ROUTE_PREFIX,
} from "./vehicle-create.constants";

export async function removePhotoUpload(
  assetId: string,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const response = await fetcher(`${PHOTO_UPLOAD_ROUTE_PREFIX}/${assetId}`, {
    method: "DELETE",
  });
  if (response.ok) return;
  const body: unknown = await response.json().catch(() => null);
  const error = ApiErrorSchema.safeParse(body);
  throw new Error(
    error.success ? error.data.error.message : PHOTO_UPLOAD_REMOVE_GENERIC_ERROR,
  );
}
