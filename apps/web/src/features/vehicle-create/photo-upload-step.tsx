"use client";

import { Button } from "@studiocar/ui";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import { createPhotoUploadItem } from "./create-photo-upload-item";
import { PhotoUploadItemRow } from "./photo-upload-item-row";
import type { PhotoUploadItem, RejectedPhoto } from "./photo-upload.types";
import { PhotoUploadStatus } from "./photo-upload-status";
import { selectPhotoFiles } from "./select-photo-files";
import { uploadPhoto } from "./upload-photo";
import {
  FREE_PLAN_PHOTO_LIMIT,
  PHOTO_UPLOAD_ACCEPT,
  PHOTO_UPLOAD_BACK_LABEL,
  PHOTO_UPLOAD_CONTINUE_LABEL,
  PHOTO_UPLOAD_DROP_LABEL,
  PHOTO_UPLOAD_EMPTY_ERROR,
  PHOTO_UPLOAD_FORMATS_LABEL,
  PHOTO_UPLOAD_GENERIC_ERROR,
  PHOTO_UPLOAD_INCOMPLETE_ERROR,
  PHOTO_UPLOAD_LIMIT_LABEL,
  PHOTO_UPLOAD_MAX_PROGRESS,
  PHOTO_UPLOAD_SELECT_LABEL,
} from "./vehicle-create.constants";
import { useVehicleCreateStore } from "./vehicle-create-store";

export interface PhotoUploadStepProps {
  maximumPhotos?: number;
  onBack: () => void;
  onContinue: () => void;
  upload?: typeof uploadPhoto;
}

export function PhotoUploadStep({
  maximumPhotos = FREE_PLAN_PHOTO_LIMIT,
  onBack,
  onContinue,
  upload = uploadPhoto,
}: PhotoUploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadControllers = useRef(new Map<string, AbortController>());
  const [dragActive, setDragActive] = useState(false);
  const [rejected, setRejected] = useState<RejectedPhoto[]>([]);
  const [stepError, setStepError] = useState<string | null>(null);
  const photos = useVehicleCreateStore((state) => state.photos);
  const vehicleId = useVehicleCreateStore((state) => state.vehicleId);
  const addPhotos = useVehicleCreateStore((state) => state.addPhotos);
  const movePhoto = useVehicleCreateStore((state) => state.movePhoto);
  const removePhoto = useVehicleCreateStore((state) => state.removePhoto);
  const updatePhoto = useVehicleCreateStore((state) => state.updatePhoto);

  useEffect(
    () => () => {
      uploadControllers.current.forEach((controller) => controller.abort());
      uploadControllers.current.clear();
    },
    [],
  );

  async function startUpload(photo: PhotoUploadItem) {
    if (!vehicleId) {
      updatePhoto(photo.clientId, {
        error: PHOTO_UPLOAD_GENERIC_ERROR,
        status: PhotoUploadStatus.Failed,
      });
      return;
    }
    uploadControllers.current.get(photo.clientId)?.abort();
    const controller = new AbortController();
    uploadControllers.current.set(photo.clientId, controller);
    updatePhoto(photo.clientId, { error: null, progress: 0 });
    try {
      const result = await upload(vehicleId, photo, {
        onProgress: (progress) => updatePhoto(photo.clientId, { progress }),
        onStatus: (status) => updatePhoto(photo.clientId, { status }),
        signal: controller.signal,
      });
      updatePhoto(photo.clientId, {
        ...result,
        error: null,
        progress: PHOTO_UPLOAD_MAX_PROGRESS,
        status: PhotoUploadStatus.Uploaded,
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      updatePhoto(photo.clientId, {
        error: error instanceof Error ? error.message : PHOTO_UPLOAD_GENERIC_ERROR,
        status: PhotoUploadStatus.Failed,
      });
    } finally {
      if (uploadControllers.current.get(photo.clientId) === controller) {
        uploadControllers.current.delete(photo.clientId);
      }
    }
  }

  function removeSelectedPhoto(clientId: string) {
    uploadControllers.current.get(clientId)?.abort();
    uploadControllers.current.delete(clientId);
    removePhoto(clientId);
  }

  function acceptFiles(files: Iterable<File>) {
    setStepError(null);
    const selection = selectPhotoFiles(files, photos.length, maximumPhotos);
    setRejected(selection.rejected);
    const items = selection.accepted.map((file) => createPhotoUploadItem(file));
    addPhotos(items);
    items.forEach((item) => void startUpload(item));
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) acceptFiles(event.target.files);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    acceptFiles(event.dataTransfer.files);
  }

  function handleContinue() {
    if (photos.length === 0) {
      setStepError(PHOTO_UPLOAD_EMPTY_ERROR);
      return;
    }
    if (!photos.every((photo) => photo.status === PhotoUploadStatus.Uploaded)) {
      setStepError(PHOTO_UPLOAD_INCOMPLETE_ERROR);
      return;
    }
    onContinue();
  }

  return (
    <section className="photo-upload-step">
      <div
        className={`photo-dropzone${dragActive ? " photo-dropzone--active" : ""}`}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <span aria-hidden="true" className="photo-dropzone__icon">
          ⇧
        </span>
        <strong>{PHOTO_UPLOAD_DROP_LABEL}</strong>
        <span>{PHOTO_UPLOAD_FORMATS_LABEL}</span>
        <Button onClick={() => inputRef.current?.click()}>
          {PHOTO_UPLOAD_SELECT_LABEL}
        </Button>
        <input
          accept={PHOTO_UPLOAD_ACCEPT}
          aria-label={PHOTO_UPLOAD_SELECT_LABEL}
          className="sc-visually-hidden"
          multiple
          onChange={handleInputChange}
          ref={inputRef}
          type="file"
        />
      </div>
      <p className="photo-upload-step__limit">{PHOTO_UPLOAD_LIMIT_LABEL}</p>
      {rejected.length > 0 ? (
        <ul className="photo-upload-step__rejections" role="alert">
          {rejected.map((photo) => (
            <li key={`${photo.filename}-${photo.reason}`}>
              {photo.filename}: {photo.reason}
            </li>
          ))}
        </ul>
      ) : null}
      <ol className="photo-upload-list">
        {photos.map((photo, index) => (
          <PhotoUploadItemRow
            canMoveDown={index < photos.length - 1}
            canMoveUp={index > 0}
            key={photo.clientId}
            onMoveDown={() => movePhoto(photo.clientId, 1)}
            onMoveUp={() => movePhoto(photo.clientId, -1)}
            onRemove={() => removeSelectedPhoto(photo.clientId)}
            onRetry={() => void startUpload(photo)}
            photo={photo}
          />
        ))}
      </ol>
      {stepError ? (
        <p className="photo-upload-step__error" role="alert">
          {stepError}
        </p>
      ) : null}
      <footer className="photo-upload-step__footer">
        <Button onClick={onBack}>{PHOTO_UPLOAD_BACK_LABEL}</Button>
        <Button onClick={handleContinue} variant="primary">
          {PHOTO_UPLOAD_CONTINUE_LABEL}
        </Button>
      </footer>
    </section>
  );
}
