import { getWebDatabase } from "../db/web-database";

import { PrismaAuditLogRepository } from "../db/repositories/audit-log-repository";

let repository: PrismaAuditLogRepository | undefined;

export function getAuditLogRepository(): PrismaAuditLogRepository {
  repository ??= new PrismaAuditLogRepository(
    getWebDatabase(),
  );
  return repository;
}
