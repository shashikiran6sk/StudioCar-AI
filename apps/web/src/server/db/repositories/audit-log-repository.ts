import { AdministrativeActionSchema } from "@studiocar/contracts";
import type { PrismaClient } from "@studiocar/database-runtime";

export interface AuditLogRecord {
  action: string;
  actorName: string | null;
  createdAt: Date;
  id: string;
  metadata: unknown;
  resourceId: string | null;
  resourceType: string;
}

export class PrismaAuditLogRepository {
  public constructor(private readonly database: PrismaClient) {}

  /**
   * The most recent administrative changes.
   *
   * Restricted to the administrative actions and bounded by `limit`, so the
   * overview can never become an unpaged dump of the whole trail — which also
   * carries entries about ordinary account activity.
   *
   * `metadata` is `Json`, so it comes back as `unknown` and is validated before
   * anything reads a field from it.
   */
  public async listRecentAdministrative(
    limit: number,
  ): Promise<AuditLogRecord[]> {
    const entries = await this.database.auditLog.findMany({
      where: { action: { in: [...AdministrativeActionSchema.options] } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      select: {
        action: true,
        createdAt: true,
        id: true,
        metadata: true,
        resourceId: true,
        resourceType: true,
        user: { select: { displayName: true } },
      },
    });

    return entries.map((entry) => ({
      action: entry.action,
      actorName: entry.user?.displayName ?? null,
      createdAt: entry.createdAt,
      id: entry.id,
      metadata: entry.metadata,
      resourceId: entry.resourceId,
      resourceType: entry.resourceType,
    }));
  }
}
