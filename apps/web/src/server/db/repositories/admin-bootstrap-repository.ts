import type { PrismaClient } from "@studiocar/database-runtime";
import { Prisma, Role, RoleGrantSource } from "@studiocar/database-runtime";

import {
  ADMIN_BOOTSTRAP_CONFIG_KEY,
  ADMIN_BOOTSTRAP_LOCK_KEY,
  AUDIT_ACTION_INITIAL_ADMIN_BOOTSTRAPPED,
  AUDIT_RESOURCE_USER_ROLE,
} from "../../admin/admin.constants";

export type AdminBootstrapOutcome =
  /** This sign-in created the first administrator. */
  | { kind: "BOOTSTRAPPED" }
  /** Bootstrap had already completed, so the environment value is inert. */
  | { kind: "ALREADY_COMPLETED" }
  /** This account already holds the role. */
  | { kind: "ALREADY_ADMINISTRATOR" };

export class PrismaAdminBootstrapRepository {
  public constructor(private readonly database: PrismaClient) {}

  /**
   * Grants the first administrator exactly once, then records that it happened.
   *
   * The persisted record, not the absence of an administrator, is what closes
   * the window. That is what stops a revoked administrator regaining the role
   * simply because the environment variable still names them.
   *
   * The caller must already have established that this is a verified Google
   * email matching the configured one; this method decides only whether the
   * one-time grant is still available.
   */
  public bootstrap(
    userId: string,
    now: Date,
  ): Promise<AdminBootstrapOutcome> {
    return this.database.$transaction(async (transaction) => {
      // Serialises concurrent sign-ins racing for the one-time grant.
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${ADMIN_BOOTSTRAP_LOCK_KEY}, 0))`;

      const completed = await transaction.appConfig.findUnique({
        where: { key: ADMIN_BOOTSTRAP_CONFIG_KEY },
        select: { key: true },
      });
      if (completed) return { kind: "ALREADY_COMPLETED" };

      const existing = await transaction.userRole.findUnique({
        where: { userId_role: { userId, role: Role.ADMIN } },
        select: { id: true },
      });
      if (existing) return { kind: "ALREADY_ADMINISTRATOR" };

      await transaction.userRole.create({
        data: { userId, role: Role.ADMIN, source: RoleGrantSource.BOOTSTRAP },
      });
      await transaction.appConfig.create({
        data: {
          key: ADMIN_BOOTSTRAP_CONFIG_KEY,
          value: { completedAt: now.toISOString(), userId },
        },
      });
      await transaction.auditLog.create({
        data: {
          // The actor is the system: no administrator existed to perform this.
          userId: null,
          action: AUDIT_ACTION_INITIAL_ADMIN_BOOTSTRAPPED,
          resourceType: AUDIT_RESOURCE_USER_ROLE,
          resourceId: userId,
          metadata: { source: RoleGrantSource.BOOTSTRAP },
        },
      });

      return { kind: "BOOTSTRAPPED" };
    });
  }

  public async isCompleted(): Promise<boolean> {
    const record = await this.database.appConfig.findUnique({
      where: { key: ADMIN_BOOTSTRAP_CONFIG_KEY },
      select: { key: true },
    });
    return record !== null;
  }
}

export function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
