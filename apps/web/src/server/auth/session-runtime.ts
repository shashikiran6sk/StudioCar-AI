import { parseSessionEnvironment } from "@studiocar/config";
import { createDatabaseClient } from "@studiocar/database-runtime";
import { PrismaSessionRepository } from "../db/repositories/session-repository";

import { SessionService } from "./session-service";

let sessionService: SessionService | undefined;

export function getSessionService(): SessionService {
  if (sessionService) return sessionService;

  const environment = parseSessionEnvironment(process.env);
  const database = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
  });
  sessionService = new SessionService(new PrismaSessionRepository(database));
  return sessionService;
}
