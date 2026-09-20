export interface ReserveExpiredUploadsCommand {
  batchSize: number;
  cutoff: Date;
  now: Date;
}

export interface ClaimStorageDeletionsCommand {
  batchSize: number;
  claimExpiresAt: Date;
  claimToken: string;
  now: Date;
}

export interface CompleteStorageDeletionCommand {
  claimToken: string;
  deletedAt: Date;
  messageId: string;
}

export interface ReleaseStorageDeletionCommand {
  claimToken: string;
  errorCode: string;
  messageId: string;
  nextAttemptAt: Date;
}

export interface FailStorageDeletionCommand {
  claimToken: string;
  errorCode: string;
  failedAt: Date;
  messageId: string;
}
