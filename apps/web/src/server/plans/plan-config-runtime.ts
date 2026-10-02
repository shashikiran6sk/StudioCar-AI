import { getWebDatabase } from "../db/web-database";

import { PrismaPlanConfigRepository } from "../db/repositories/plan-config-repository";

let repository: PrismaPlanConfigRepository | undefined;

export function getPlanConfigRepository(): PrismaPlanConfigRepository {
  repository ??= new PrismaPlanConfigRepository(
    getWebDatabase(),
  );
  return repository;
}
