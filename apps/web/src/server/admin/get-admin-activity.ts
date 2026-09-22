import { AUDIT_ACTIVITY_LIMIT } from "@studiocar/contracts";
import { cache } from "react";

import { getAuditLogRepository } from "./audit-log-runtime";
import { describeAuditActor } from "./describe-audit-actor";
import { describeAuditEntry } from "./describe-audit-entry";

export interface AdminActivityEntry {
  /** Already named: an administrator, StudioCar AI, or a removed account. */
  actorLabel: string;
  id: string;
  occurredAt: string;
  summary: string;
}

/**
 * The recent administrative changes, already described.
 *
 * Each entry is rendered to a sentence here rather than in the browser, so the
 * stored metadata never leaves the server and a key added to it later cannot
 * reach a page by accident.
 */
export const getAdminActivity = cache(
  async (): Promise<readonly AdminActivityEntry[]> => {
    const entries =
      await getAuditLogRepository().listRecentAdministrative(
        AUDIT_ACTIVITY_LIMIT,
      );

    return entries.map((entry) => ({
      actorLabel: describeAuditActor(entry),
      id: entry.id,
      occurredAt: entry.createdAt.toISOString(),
      summary: describeAuditEntry(entry),
    }));
  },
);
