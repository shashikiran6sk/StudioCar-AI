import { getWebDatabase } from "../db/web-database";

import { PrismaSocialLinkRepository } from "../db/repositories/social-link-repository";

let repository: PrismaSocialLinkRepository | undefined;

export function getSocialLinkRepository(): PrismaSocialLinkRepository {
  repository ??= new PrismaSocialLinkRepository(
    getWebDatabase(),
  );
  return repository;
}
