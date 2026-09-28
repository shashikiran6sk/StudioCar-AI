import { getWebDatabase } from "../db/web-database";
import { PrismaSessionRepository } from "../db/repositories/session-repository";

import { SessionService } from "./session-service";

let sessionService: SessionService | undefined;

export function getSessionService(): SessionService {
  if (sessionService) return sessionService;

  const database = getWebDatabase();
  sessionService = new SessionService(new PrismaSessionRepository(database));
  return sessionService;
}
