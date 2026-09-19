import type { PhotoUploadStatus } from "./photo-upload-status";

export interface PhotoUploadItem {
  assetId: string | null;
  clientId: string;
  error: string | null;
  file: File;
  height: number | null;
  previewUrl: string;
  progress: number;
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
