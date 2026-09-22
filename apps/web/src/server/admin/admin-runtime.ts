import { parseSessionEnvironment } from "@studiocar/config";
import { createDatabaseClient } from "@studiocar/database-runtime";

import { PrismaAdminRoleRepository } from "../db/repositories/admin-role-repository";

let roleRepository: PrismaAdminRoleRepository | undefined;

export function getAdminRoleRepository(): PrismaAdminRoleRepository {
  roleRepository ??= new PrismaAdminRoleRepository(
    createDatabaseClient({
      connectionString: parseSessionEnvironment(process.env).DATABASE_URL,
    }),
  );
  return roleRepository;
}
