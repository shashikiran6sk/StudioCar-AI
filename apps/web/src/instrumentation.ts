import type { Instrumentation } from "next";

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initializeErrorTracking } = await import(
      "@studiocar/observability"
    );
    initializeErrorTracking(process.env);
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const {
      ApplicationErrorCode,
      getRequestId,
      monitoringContext,
      reportUnexpectedError,
      flushErrorTracking,
      UUID_PATTERN,
      REQUEST_ID_HEADER,
    } = await import("@studiocar/observability");
    const suppliedId = request.headers[REQUEST_ID_HEADER];
    const requestId =
      typeof suppliedId === "string" && UUID_PATTERN.test(suppliedId)
        ? suppliedId
        : getRequestId();
    await monitoringContext.run(
      { requestId, route: context.routePath, method: request.method },
      async () => {
        reportUnexpectedError(error, ApplicationErrorCode.INTERNAL_ERROR);
        await flushErrorTracking();
      },
    );
  }
};
