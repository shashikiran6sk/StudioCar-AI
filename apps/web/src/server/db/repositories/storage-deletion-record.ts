import type { Prisma } from "@studiocar/database-runtime";

export const storageDeletionSelect = {
  id: true,
  imageAssetId: true,
  objectKey: true,
  status: true,
  attemptCount: true,
  nextAttemptAt: true,
  claimedAt: true,
  claimExpiresAt: true,
  claimToken: true,
  deletedAt: true,
  failedAt: true,
  lastErrorCode: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.StorageDeletionOutboxMessageSelect;

export type StorageDeletionRecord =
  Prisma.StorageDeletionOutboxMessageGetPayload<{
    select: typeof storageDeletionSelect;
  }>;
