import { getWebDatabase } from "../db/web-database";

import { PrismaManualSubscriptionRepository } from "../db/repositories/manual-subscription-repository";

let repository: PrismaManualSubscriptionRepository | undefined;

export function getManualSubscriptionRepository(): PrismaManualSubscriptionRepository {
  repository ??= new PrismaManualSubscriptionRepository(
    getWebDatabase(),
  );
  return repository;
}
