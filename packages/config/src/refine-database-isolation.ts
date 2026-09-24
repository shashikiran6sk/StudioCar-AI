import { AppEnvironment } from "./app-environment";
import { PRODUCTION_NAME_SEGMENTS } from "./environment-isolation.constants";
import type {
  EnvironmentIssueSink,
  IsolationSubject,
} from "./environment-isolation.types";
import { hasNameSegment } from "./has-name-segment";
import { isLocalServiceUrl } from "./is-local-service-url";
import { LOCAL_INFRASTRUCTURE } from "./local-infrastructure";

const LOCAL_DATABASE_REQUIRED_MESSAGE =
  "DATABASE_URL must address the local Docker PostgreSQL in the local environment.";
const LOCAL_DATABASE_REFUSED_MESSAGE =
  "DATABASE_URL must not address a local database in production.";
const LOCAL_DATABASE_CREDENTIALS_MESSAGE =
  "DATABASE_URL must not use the repository's local database credentials outside the local environment.";
const PRODUCTION_DATABASE_MESSAGE =
  "DATABASE_URL names a production database; Development must use its own.";

function usesLocalCredentials(url: URL): boolean {
  return (
    decodeURIComponent(url.username) === LOCAL_INFRASTRUCTURE.databaseUser &&
    decodeURIComponent(url.password) === LOCAL_INFRASTRUCTURE.databasePassword
  );
}

/**
 * Local runs only against Docker PostgreSQL; production never against a local
 * database or the committed local credentials; Development never against a
 * database that declares itself production.
 */
export function refineDatabaseIsolation(
  value: IsolationSubject,
  context: EnvironmentIssueSink,
): void {
  const databaseUrl = value.DATABASE_URL;
  if (databaseUrl === undefined) return;

  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    return;
  }

  const addIssue = (message: string): void => {
    context.addIssue({ code: "custom", message, path: ["DATABASE_URL"] });
  };

  if (value.APP_ENV === AppEnvironment.Local) {
    if (!isLocalServiceUrl(databaseUrl)) addIssue(LOCAL_DATABASE_REQUIRED_MESSAGE);
    return;
  }

  if (value.APP_ENV === AppEnvironment.Production) {
    if (isLocalServiceUrl(databaseUrl)) addIssue(LOCAL_DATABASE_REFUSED_MESSAGE);
    if (usesLocalCredentials(url)) addIssue(LOCAL_DATABASE_CREDENTIALS_MESSAGE);
    return;
  }

  if (
    hasNameSegment(url.hostname, PRODUCTION_NAME_SEGMENTS) ||
    hasNameSegment(url.pathname, PRODUCTION_NAME_SEGMENTS)
  ) {
    addIssue(PRODUCTION_DATABASE_MESSAGE);
  }
}
