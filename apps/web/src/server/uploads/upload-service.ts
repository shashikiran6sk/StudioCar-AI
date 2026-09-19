import type { CreateUploadIntent } from "@studiocar/contracts";

import type {
  CommitUploadResult,
  CreateUploadIntentResult,
  UploadApplication,
} from "./upload.types";

export interface CreateUploadIntentExecutor {
  execute(
    userId: string,
    idempotencyKey: string,
    command: CreateUploadIntent,
  ): Promise<CreateUploadIntentResult>;
}

export interface CommitUploadExecutor {
  execute(
    userId: string,
    assetId: string,
    etag: string | undefined,
  ): Promise<CommitUploadResult>;
}

export class UploadService implements UploadApplication {
  public constructor(
    private readonly intentService: CreateUploadIntentExecutor,
    private readonly commitService: CommitUploadExecutor,
  ) {}

  public createIntent(
    userId: string,
    idempotencyKey: string,
    command: CreateUploadIntent,
  ): Promise<CreateUploadIntentResult> {
    return this.intentService.execute(userId, idempotencyKey, command);
  }

  public commit(
    userId: string,
    assetId: string,
    etag: string | undefined,
  ): Promise<CommitUploadResult> {
    return this.commitService.execute(userId, assetId, etag);
  }
}
