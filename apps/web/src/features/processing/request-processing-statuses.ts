import {
  ApiErrorSchema,
  JobStatusResponseSchema,
  type JobStatusResponse,
} from "@studiocar/contracts";

import {
  PROCESSING_STATUS_IDS_PARAMETER,
  PROCESSING_STATUS_REQUEST_ERROR,
  PROCESSING_STATUS_ROUTE,
} from "./processing-polling.constants";

export async function requestProcessingStatuses(
  jobIds: string[],
  signal?: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<JobStatusResponse> {
  const search = new URLSearchParams({
    [PROCESSING_STATUS_IDS_PARAMETER]: jobIds.join(","),
  });
  const requestOptions: RequestInit = signal
    ? { cache: "no-store", signal }
    : { cache: "no-store" };
  const response = await fetcher(
    `${PROCESSING_STATUS_ROUTE}?${search}`,
    requestOptions,
  );
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = ApiErrorSchema.safeParse(body);
    throw new Error(
      error.success ? error.data.error.message : PROCESSING_STATUS_REQUEST_ERROR,
    );
  }
  return JobStatusResponseSchema.parse(body);
}
