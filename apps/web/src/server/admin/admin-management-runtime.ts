import { getWebDatabase } from "../db/web-database";

import { PrismaAdminManagementRepository } from "../db/repositories/admin-management-repository";

let repository: PrismaAdminManagementRepository | undefined;

export function getAdminManagementRepository(): PrismaAdminManagementRepository {
  repository ??= new PrismaAdminManagementRepository(
    getWebDatabase(),
  );
  return repository;
}
