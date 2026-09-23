import type { ProcessingFailureReason } from "@studiocar/contracts";

import type { PhotoSource } from "./photo-source";
import type { PhotoUploadStatus } from "./photo-upload-status";

export interface PhotoUploadItem {
  assetId: string | null;
  clientId: string;
  error: string | null;
  /** Why this photo failed in the batch the dialog was opened from. */
  failureReason: ProcessingFailureReason | null;
  /** The selected file; absent for an original that is already stored. */
  file: File | null;
  filename: string;
  height: number | null;
  previewUrl: string;
  progress: number;
  /** The stored original cannot be processed; only a new photo can fix it. */
  replaceRequired: boolean;
  /** Whether the photo goes into the batch this dialog submits. */
  selected: boolean;
  sizeBytes: number;
  source: PhotoSource;
  status: PhotoUploadStatus;
  width: number | null;
}

export interface PhotoUploadSuccess {
  assetId: string;
  height: number;
  width: number;
}

export interface RejectedPhoto {
  filename: string;
  reason: string;
}
