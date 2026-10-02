import {
  ApplicationErrorCode,
  reportUnexpectedError,
} from "@studiocar/observability";
import type {
  ObjectDeletionStoragePort,
  UserUploadRemovalRepositoryPort,
} from "../storage-cleanup/storage-cleanup.types";
import type {
  RemoveUploadResult,
  UploadRemovalApplication,
} from "./upload.types";

export class RemoveUploadService implements UploadRemovalApplication {
  public constructor(
    private readonly removals: UserUploadRemovalRepositoryPort,
    private readonly storage: ObjectDeletionStoragePort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async remove(
    userId: string,
    assetId: string,
  ): Promise<RemoveUploadResult> {
    const reservation = await this.removals.reserveUserUploadRemoval({
      assetId,
      now: this.now(),
      userId,
    });
    if (reservation.kind === "NOT_FOUND") {
      return { ok: false, reason: "ASSET_NOT_FOUND" };
    }
    if (reservation.kind === "NOT_REMOVABLE") {
      return { ok: false, reason: "ASSET_NOT_REMOVABLE" };
    }
    if (reservation.kind === "ALREADY_DELETED") return { ok: true };

    try {
      await this.storage.deleteObject(reservation.objectKey);
    } catch (error) {
      reportUnexpectedError(error, ApplicationErrorCode.INTERNAL_ERROR);
      return { ok: false, reason: "STORAGE_UNAVAILABLE" };
    }
    const completed = await this.removals.completeUserUploadRemoval({
      deletedAt: this.now(),
      messageId: reservation.messageId,
    });
    return completed
      ? { ok: true }
      : { ok: false, reason: "STORAGE_UNAVAILABLE" };
  }
}
