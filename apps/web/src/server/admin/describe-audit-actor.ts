import { AdministrativeActionSchema } from "@studiocar/contracts";

import {
  ADMIN_ACTIVITY_REMOVED_ACTOR,
  ADMIN_ACTIVITY_SYSTEM_ACTOR,
} from "./admin.constants";
import type { AuditLogRecord } from "../db/repositories/audit-log-repository";

/** The one action StudioCar AI performs with nobody signed in. */
const SYSTEM_ACTIONS: readonly string[] = [
  AdministrativeActionSchema.enum.INITIAL_ADMIN_BOOTSTRAPPED,
];

/**
 * Names who made a change.
 *
 * A null actor means one of two different things. The trail records the system
 * itself acting at first-run bootstrap, and it also outlives the accounts that
 * made entries, because `AuditLog.userId` is set to null when an administrator
 * is deleted. Reporting both as "StudioCar AI" would be untrue.
 */
export function describeAuditActor(entry: AuditLogRecord): string {
  if (entry.actorName !== null) return entry.actorName;
  return SYSTEM_ACTIONS.includes(entry.action)
    ? ADMIN_ACTIVITY_SYSTEM_ACTOR
    : ADMIN_ACTIVITY_REMOVED_ACTOR;
}
