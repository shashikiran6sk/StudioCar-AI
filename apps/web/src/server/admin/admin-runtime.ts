import { getWebDatabase } from "../db/web-database";

import { PrismaAdminRoleRepository } from "../db/repositories/admin-role-repository";

let roleRepository: PrismaAdminRoleRepository | undefined;

export function getAdminRoleRepository(): PrismaAdminRoleRepository {
  roleRepository ??= new PrismaAdminRoleRepository(
    getWebDatabase(),
  );
  return roleRepository;
}
