"use client";

import { Button } from "@studiocar/ui";
import Image from "next/image";

import { formatPhotoSize } from "./format-photo-size";
import { photoUploadStatusLabel } from "./photo-upload-status-label";
import type { PhotoUploadItem } from "./photo-upload.types";
import { PhotoUploadStatus } from "./photo-upload-status";
import {
  EXISTING_PHOTO_FAILED_LABEL,
  EXISTING_PHOTO_IMAGE_LABEL,
  EXISTING_PHOTO_INCLUDE_LABEL,
  EXISTING_PHOTO_REPLACE_LABEL,
} from "./studio-selection.constants";
import {
  PHOTO_UPLOAD_MOVE_DOWN_LABEL,
  PHOTO_UPLOAD_MOVE_UP_LABEL,
  PHOTO_UPLOAD_REMOVE_LABEL,
  PHOTO_UPLOAD_REMOVING_LABEL,
  PHOTO_UPLOAD_REORDER_LABEL,
  PHOTO_UPLOAD_RETRY_LABEL,
} from "./vehicle-create.constants";
import { PROCESSING_FAILURE_MESSAGES } from "../processing/processing-failure-messages.constants";

export interface PhotoUploadItemRowProps {
  canMoveDown: boolean;
  canMoveUp: boolean;
  /** One-based position, shown when choosing among existing photos. */
  position?: number | undefined;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
  /** Offered for a photo that failed processing; opens a file chooser. */
  onReplace?: (() => void) | undefined;
  onRetry: () => void;
  /** Present when the person chooses which photos go into the batch. */
  onToggleSelected?: (() => void) | undefined;
  photo: PhotoUploadItem;
}

export function PhotoUploadItemRow({
  canMoveDown,
  canMoveUp,
  position,
  onMoveDown,
  onMoveUp,
  onRemove,
  onReplace,
  onRetry,
  onToggleSelected,
  photo,
}: PhotoUploadItemRowProps) {
  const removing = photo.status === PhotoUploadStatus.Removing;
  const dimensions = photo.width && photo.height
    ? ` · ${String(photo.width)} × ${String(photo.height)}`
    : "";
  const failed = photo.failureReason !== null;
  const title =
    position === undefined
      ? photo.filename
      : `${EXISTING_PHOTO_IMAGE_LABEL} ${String(position)} · ${photo.filename}`;

  return (
    <li
      className={`photo-upload-item${failed ? " photo-upload-item--failed" : ""}`}
    >
      {onToggleSelected ? (
        <input
          aria-label={`${EXISTING_PHOTO_INCLUDE_LABEL} ${photo.filename}`}
          checked={photo.selected}
          className="photo-upload-item__select"
          disabled={
            removing ||
            photo.replaceRequired ||
            photo.status !== PhotoUploadStatus.Uploaded
          }
          onChange={onToggleSelected}
          type="checkbox"
        />
      ) : null}
      <div
        aria-label={`${PHOTO_UPLOAD_REORDER_LABEL} ${photo.filename}`}
        className="photo-upload-item__reorder"
      >
        <button
          aria-label={`${PHOTO_UPLOAD_MOVE_UP_LABEL} ${photo.filename}`}
          disabled={!canMoveUp || removing}
          onClick={onMoveUp}
          type="button"
        >
          ↑
        </button>
        <button
          aria-label={`${PHOTO_UPLOAD_MOVE_DOWN_LABEL} ${photo.filename}`}
          disabled={!canMoveDown || removing}
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
        <strong title={photo.filename}>{title}</strong>
        <span>
          {formatPhotoSize(photo.sizeBytes)}
          {dimensions}
        </span>
        {photo.failureReason ? (
          <span className="photo-upload-item__error">
            {EXISTING_PHOTO_FAILED_LABEL} ·{" "}
            {PROCESSING_FAILURE_MESSAGES[photo.failureReason]}
          </span>
        ) : null}
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
      {failed && onReplace ? (
        <Button
          aria-label={`${EXISTING_PHOTO_REPLACE_LABEL} ${photo.filename}`}
          disabled={removing}
          onClick={onReplace}
          size="small"
          variant="danger"
        >
          {EXISTING_PHOTO_REPLACE_LABEL}
        </Button>
      ) : null}
      <Button
        aria-label={`${removing ? PHOTO_UPLOAD_REMOVING_LABEL : PHOTO_UPLOAD_REMOVE_LABEL} ${photo.filename}`}
        disabled={removing}
        onClick={onRemove}
        size="icon"
      >
        {removing ? "…" : "×"}
      </Button>
    </li>
  );
}
