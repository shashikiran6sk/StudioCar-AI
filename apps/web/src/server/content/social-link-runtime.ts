import { parseSessionEnvironment } from "@studiocar/config";
import { createDatabaseClient } from "@studiocar/database-runtime";

import { PrismaSocialLinkRepository } from "../db/repositories/social-link-repository";

let repository: PrismaSocialLinkRepository | undefined;

export function getSocialLinkRepository(): PrismaSocialLinkRepository {
  repository ??= new PrismaSocialLinkRepository(
    createDatabaseClient({
      connectionString: parseSessionEnvironment(process.env).DATABASE_URL,
    }),
  );
  return repository;
}
