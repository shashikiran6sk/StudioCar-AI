import { parseSessionEnvironment } from "@studiocar/config";
import { createDatabaseClient } from "@studiocar/database-runtime";

import { PrismaAuditLogRepository } from "../db/repositories/audit-log-repository";

let repository: PrismaAuditLogRepository | undefined;

export function getAuditLogRepository(): PrismaAuditLogRepository {
  repository ??= new PrismaAuditLogRepository(
    createDatabaseClient({
      connectionString: parseSessionEnvironment(process.env).DATABASE_URL,
    }),
  );
  return repository;
}
