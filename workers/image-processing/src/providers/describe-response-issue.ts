import { PROVIDER_RESPONSE_ROOT_PATH } from "./provider-telemetry.constants";

export interface ResponseIssue {
  responseIssueCode: string;
  responseIssuePath: string;
}

/** The parts of a validation error this reads: issue codes and field paths. */
export interface ValidationIssues {
  issues: readonly { code: string; path: readonly PropertyKey[] }[];
}

/**
 * Where and how a provider response first failed validation, without any of
 * its values: field names and indexes joined with dots (`results.0`), and the
 * validator's issue code. The logger still drops anything that is not a safe
 * identifier, so an unusual key from the provider is never written.
 */
export function describeResponseIssue(error: ValidationIssues): ResponseIssue {
  const [issue] = error.issues;
  if (issue === undefined) {
    return {
      responseIssueCode: "invalid",
      responseIssuePath: PROVIDER_RESPONSE_ROOT_PATH,
    };
  }
  const path = issue.path.map(String).join(".");
  return {
    responseIssueCode: issue.code,
    responseIssuePath: path === "" ? PROVIDER_RESPONSE_ROOT_PATH : path,
  };
}
