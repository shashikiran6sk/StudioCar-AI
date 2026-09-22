import {
  AdministrativeActionSchema,
  AuditMetadataSchema,
  type AuditMetadata,
} from "@studiocar/contracts";

import type { AuditLogRecord } from "../db/repositories/audit-log-repository";

/**
 * Says what one administrative change was, in a sentence.
 *
 * Metadata is stored as `Json`, so it is validated before any field is read.
 * An entry whose action or metadata this version does not recognise still
 * renders — as a plain statement of what happened rather than as nothing, or
 * as an invented sentence that might be wrong.
 */
export function describeAuditEntry(entry: AuditLogRecord): string {
  const parsedMetadata = AuditMetadataSchema.safeParse(entry.metadata ?? {});
  const metadata: AuditMetadata = parsedMetadata.success
    ? parsedMetadata.data
    : {};
  const action = AdministrativeActionSchema.safeParse(entry.action);
  if (!action.success) return describeUnknown(entry);

  switch (action.data) {
    case "INITIAL_ADMIN_BOOTSTRAPPED":
      return "Granted the first administrator.";
    case "ADMIN_GRANTED":
      return describeWith("Granted administrator access", metadata.email);
    case "ADMIN_REVOKED":
      return "Revoked administrator access.";
    case "ADMIN_INVITED":
      return describeWith("Invited an administrator", metadata.email);
    case "ADMIN_INVITATION_REVOKED":
      return "Cancelled an administrator invitation.";
    case "PLAN_CONFIG_UPDATED":
      return describeWith("Updated a plan", entry.resourceId);
    case "SUBSCRIPTION_ASSIGNED":
      return describeWith("Assigned a plan", metadata.planKey);
    case "SUBSCRIPTION_REVOKED":
      return describeWith("Ended an assigned plan", metadata.planKey);
    case "SOCIAL_LINK_SAVED":
      return describeWith("Saved a footer link", entry.resourceId);
    case "SOCIAL_LINK_REMOVED":
      return describeWith("Removed a footer link", entry.resourceId);
  }
}

function describeWith(statement: string, detail: string | undefined | null) {
  return detail === undefined || detail === null || detail === ""
    ? `${statement}.`
    : `${statement} (${detail}).`;
}

/** An action this version does not know. Reported, not hidden or guessed at. */
function describeUnknown(entry: AuditLogRecord): string {
  return describeWith(
    `${entry.action} on ${entry.resourceType}`,
    entry.resourceId,
  );
}
