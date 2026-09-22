import type { PrismaClient } from "@studiocar/database-runtime";
import {
  AdminInviteStatus,
  AuthProvider,
  Prisma,
  Role,
  RoleGrantSource,
} from "@studiocar/database-runtime";

import {
  ADMIN_MANAGEMENT_LOCK_KEY,
  AUDIT_ACTION_ADMIN_GRANTED,
  AUDIT_ACTION_ADMIN_INVITATION_REVOKED,
  AUDIT_ACTION_ADMIN_INVITED,
  AUDIT_ACTION_ADMIN_REVOKED,
  AUDIT_RESOURCE_ADMIN_INVITE,
  AUDIT_RESOURCE_USER_ROLE,
} from "../../admin/admin.constants";

export type GrantAdministratorResult =
  /** A verified Google identity existed, so the role was granted at once. */
  | { kind: "GRANTED"; userId: string }
  | { kind: "ALREADY_ADMINISTRATOR"; userId: string }
  /** Nobody holds that verified email yet, so an invitation is waiting. */
  | { kind: "INVITED"; inviteId: string }
  | { kind: "ALREADY_INVITED" };

export type RevokeAdministratorResult =
  | { kind: "REVOKED" }
  | { kind: "NOT_ADMINISTRATOR" }
  /** Refused: StudioCar AI must never reach zero administrators. */
  | { kind: "LAST_ADMINISTRATOR" };

export interface PendingInviteRecord {
  id: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
  invitedByName: string | null;
}

export class PrismaAdminManagementRepository {
  public constructor(private readonly database: PrismaClient) {}

  /**
   * Grants immediately when a **verified Google identity** already holds the
   * address, and otherwise records a pending invitation.
   *
   * No placeholder account is ever created: an invitation names an email, and
   * is matched only when somebody proves they hold it.
   */
  public grantOrInvite(command: {
    email: string;
    actorUserId: string;
    now: Date;
    expiresAt: Date;
  }): Promise<GrantAdministratorResult> {
    return this.database.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${ADMIN_MANAGEMENT_LOCK_KEY}, 0))`;

      const identity = await transaction.authIdentity.findFirst({
        where: {
          provider: AuthProvider.GOOGLE,
          email: command.email,
          emailVerifiedAt: { not: null },
        },
        select: { userId: true },
      });

      if (identity) {
        const existing = await transaction.userRole.findUnique({
          where: {
            userId_role: { userId: identity.userId, role: Role.ADMIN },
          },
          select: { id: true },
        });
        if (existing) {
          return { kind: "ALREADY_ADMINISTRATOR", userId: identity.userId };
        }

        await transaction.userRole.create({
          data: {
            userId: identity.userId,
            role: Role.ADMIN,
            source: RoleGrantSource.ADMIN_GRANT,
            grantedByUserId: command.actorUserId,
          },
        });
        await transaction.auditLog.create({
          data: {
            userId: command.actorUserId,
            action: AUDIT_ACTION_ADMIN_GRANTED,
            resourceType: AUDIT_RESOURCE_USER_ROLE,
            resourceId: identity.userId,
            metadata: {
              email: command.email,
              source: RoleGrantSource.ADMIN_GRANT,
            },
          },
        });
        return { kind: "GRANTED", userId: identity.userId };
      }

      const pending = await transaction.adminInvite.findFirst({
        where: { email: command.email, status: AdminInviteStatus.PENDING },
        select: { id: true },
      });
      if (pending) return { kind: "ALREADY_INVITED" };

      const invite = await transaction.adminInvite.create({
        data: {
          email: command.email,
          invitedByUserId: command.actorUserId,
          expiresAt: command.expiresAt,
        },
        select: { id: true },
      });
      await transaction.auditLog.create({
        data: {
          userId: command.actorUserId,
          action: AUDIT_ACTION_ADMIN_INVITED,
          resourceType: AUDIT_RESOURCE_ADMIN_INVITE,
          resourceId: invite.id,
          metadata: { email: command.email },
        },
      });
      return { kind: "INVITED", inviteId: invite.id };
    });
  }

  /**
   * Revokes a role, refusing when it would leave StudioCar AI with none.
   *
   * The count and the delete happen under one lock, so two administrators
   * revoking each other simultaneously cannot both succeed.
   */
  public revoke(command: {
    userId: string;
    actorUserId: string;
  }): Promise<RevokeAdministratorResult> {
    return this.database.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${ADMIN_MANAGEMENT_LOCK_KEY}, 0))`;

      const existing = await transaction.userRole.findUnique({
        where: { userId_role: { userId: command.userId, role: Role.ADMIN } },
        select: { id: true },
      });
      if (!existing) return { kind: "NOT_ADMINISTRATOR" };

      const total = await transaction.userRole.count({
        where: { role: Role.ADMIN },
      });
      if (total <= 1) return { kind: "LAST_ADMINISTRATOR" };

      await transaction.userRole.delete({ where: { id: existing.id } });
      await transaction.auditLog.create({
        data: {
          userId: command.actorUserId,
          action: AUDIT_ACTION_ADMIN_REVOKED,
          resourceType: AUDIT_RESOURCE_USER_ROLE,
          resourceId: command.userId,
          metadata: { remainingAdministrators: total - 1 },
        },
      });
      return { kind: "REVOKED" };
    });
  }

  public async revokeInvite(command: {
    inviteId: string;
    actorUserId: string;
  }): Promise<boolean> {
    return this.database.$transaction(async (transaction) => {
      const revoked = await transaction.adminInvite.updateMany({
        where: {
          id: command.inviteId,
          status: AdminInviteStatus.PENDING,
        },
        data: { status: AdminInviteStatus.REVOKED },
      });
      if (revoked.count === 0) return false;

      await transaction.auditLog.create({
        data: {
          userId: command.actorUserId,
          action: AUDIT_ACTION_ADMIN_INVITATION_REVOKED,
          resourceType: AUDIT_RESOURCE_ADMIN_INVITE,
          resourceId: command.inviteId,
        },
      });
      return true;
    });
  }

  /**
   * Accepts any pending invitation for an email Google has just verified.
   *
   * This is the only path from an invitation to a role. The address is proven,
   * never asserted, and an expired invitation is closed rather than honoured.
   */
  public acceptForVerifiedEmail(command: {
    userId: string;
    email: string;
    now: Date;
  }): Promise<boolean> {
    return this.database.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${ADMIN_MANAGEMENT_LOCK_KEY}, 0))`;

      const invite = await transaction.adminInvite.findFirst({
        where: { email: command.email, status: AdminInviteStatus.PENDING },
        select: { id: true, expiresAt: true },
      });
      if (!invite) return false;

      if (invite.expiresAt <= command.now) {
        await transaction.adminInvite.update({
          where: { id: invite.id },
          data: { status: AdminInviteStatus.EXPIRED },
        });
        return false;
      }

      await transaction.adminInvite.update({
        where: { id: invite.id },
        data: {
          status: AdminInviteStatus.ACCEPTED,
          acceptedAt: command.now,
          acceptedByUserId: command.userId,
        },
      });

      const existing = await transaction.userRole.findUnique({
        where: { userId_role: { userId: command.userId, role: Role.ADMIN } },
        select: { id: true },
      });
      if (existing) return true;

      await transaction.userRole.create({
        data: {
          userId: command.userId,
          role: Role.ADMIN,
          source: RoleGrantSource.INVITATION,
        },
      });
      await transaction.auditLog.create({
        data: {
          userId: command.userId,
          action: AUDIT_ACTION_ADMIN_GRANTED,
          resourceType: AUDIT_RESOURCE_USER_ROLE,
          resourceId: command.userId,
          metadata: {
            email: command.email,
            source: RoleGrantSource.INVITATION,
            inviteId: invite.id,
          },
        },
      });
      return true;
    });
  }

  public async listPendingInvites(): Promise<PendingInviteRecord[]> {
    const invites = await this.database.adminInvite.findMany({
      where: { status: AdminInviteStatus.PENDING },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        email: true,
        createdAt: true,
        expiresAt: true,
        invitedBy: { select: { displayName: true } },
      },
    });

    return invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      invitedByName: invite.invitedBy.displayName,
    }));
  }
}

export function isInviteUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
