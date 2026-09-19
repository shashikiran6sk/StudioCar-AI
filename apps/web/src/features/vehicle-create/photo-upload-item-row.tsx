"use client";

import { Button } from "@studiocar/ui";
import Image from "next/image";

import { formatPhotoSize } from "./format-photo-size";
import { photoUploadStatusLabel } from "./photo-upload-status-label";
import type { PhotoUploadItem } from "./photo-upload.types";
import { PhotoUploadStatus } from "./photo-upload-status";
import {
  PHOTO_UPLOAD_MOVE_DOWN_LABEL,
  PHOTO_UPLOAD_MOVE_UP_LABEL,
  PHOTO_UPLOAD_REMOVE_LABEL,
  PHOTO_UPLOAD_REORDER_LABEL,
  PHOTO_UPLOAD_RETRY_LABEL,
} from "./vehicle-create.constants";

export interface PhotoUploadItemRowProps {
  canMoveDown: boolean;
  canMoveUp: boolean;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
  onRetry: () => void;
  photo: PhotoUploadItem;
}

export function PhotoUploadItemRow({
  canMoveDown,
  canMoveUp,
  onMoveDown,
  onMoveUp,
  onRemove,
  onRetry,
  photo,
}: PhotoUploadItemRowProps) {
  const dimensions = photo.width && photo.height
    ? ` · ${String(photo.width)} × ${String(photo.height)}`
    : "";

  return (
    <li className="photo-upload-item">
      <div
        aria-label={`${PHOTO_UPLOAD_REORDER_LABEL} ${photo.file.name}`}
        className="photo-upload-item__reorder"
      >
        <button
          aria-label={`${PHOTO_UPLOAD_MOVE_UP_LABEL} ${photo.file.name}`}
          disabled={!canMoveUp}
          onClick={onMoveUp}
          type="button"
        >
          ↑
        </button>
        <button
          aria-label={`${PHOTO_UPLOAD_MOVE_DOWN_LABEL} ${photo.file.name}`}
          disabled={!canMoveDown}
          onClick={onMoveDown}
          type="button"
        >
          ↓
        </button>
      </div>
      <Image
        alt=""
        className="photo-upload-item__thumbnail"
        height={40}
        src={photo.previewUrl}
        unoptimized
        width={60}
      />
      <div className="photo-upload-item__copy">
        <strong title={photo.file.name}>{photo.file.name}</strong>
        <span>
          {formatPhotoSize(photo.file.size)}
          {dimensions}
        </span>
        {photo.error ? (
          <span className="photo-upload-item__error">{photo.error}</span>
        ) : null}
      </div>
      <div
        aria-live="polite"
        className={`photo-upload-item__status photo-upload-item__status--${photo.status.toLowerCase()}`}
      >
        {photoUploadStatusLabel(photo)}
      </div>
      {photo.status === PhotoUploadStatus.Failed ? (
        <Button onClick={onRetry} size="small">
          {PHOTO_UPLOAD_RETRY_LABEL}
        </Button>
      ) : null}
      <Button
        aria-label={`${PHOTO_UPLOAD_REMOVE_LABEL} ${photo.file.name}`}
        onClick={onRemove}
        size="icon"
      >
        ×
      </Button>
    </li>
  );
}
