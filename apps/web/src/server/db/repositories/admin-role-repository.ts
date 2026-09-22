import type { PrismaClient } from "@studiocar/database-runtime";
import { Role } from "@studiocar/database-runtime";

export interface AdministratorRecord {
  userId: string;
  displayName: string | null;
  email: string | null;
  source: string;
  grantedAt: Date;
  grantedByUserId: string | null;
  grantedByName: string | null;
}

/**
 * Reads database-backed authorization.
 *
 * A role is a row. Nothing here consults the environment, so revoking a role
 * takes effect on the next request everywhere.
 */
export class PrismaAdminRoleRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async isAdministrator(userId: string): Promise<boolean> {
    const role = await this.database.userRole.findUnique({
      where: { userId_role: { userId, role: Role.ADMIN } },
      select: { id: true },
    });
    return role !== null;
  }

  public countAdministrators(): Promise<number> {
    return this.database.userRole.count({ where: { role: Role.ADMIN } });
  }

  public async listAdministrators(): Promise<AdministratorRecord[]> {
    const roles = await this.database.userRole.findMany({
      where: { role: Role.ADMIN },
      orderBy: [{ grantedAt: "asc" }],
      select: {
        source: true,
        grantedAt: true,
        grantedByUserId: true,
        user: { select: { id: true, displayName: true, primaryEmail: true } },
        grantedBy: { select: { displayName: true } },
      },
    });

    return roles.map((role) => ({
      userId: role.user.id,
      displayName: role.user.displayName,
      email: role.user.primaryEmail,
      source: role.source,
      grantedAt: role.grantedAt,
      grantedByUserId: role.grantedByUserId,
      grantedByName: role.grantedBy?.displayName ?? null,
    }));
  }
}
