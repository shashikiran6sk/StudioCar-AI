import { init } from "@sentry/node";
import { parseObservabilityEnvironment } from "@studiocar/config";
import { sanitizeSentryEvent } from "./sanitize-sentry-event";

export function initializeErrorTracking(
  values: Record<string, string | undefined>,
): void {
  const environment = parseObservabilityEnvironment(values);
  if (!environment.SENTRY_DSN) return;
  init({
    dsn: environment.SENTRY_DSN,
    environment: environment.APP_ENV,
    release: environment.SENTRY_RELEASE,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
      frameContextLines: 0,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
    },
    includeServerName: false,
    enhanceFetchErrorMessages: false,
    defaultIntegrations: false,
    tracesSampleRate: 0,
    beforeSend: sanitizeSentryEvent,
  });
}
