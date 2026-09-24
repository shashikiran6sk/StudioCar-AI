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
import { describeBatchLimitRejection } from "./describe-batch-limit-rejection";
import { PhotoUploadItemRow } from "./photo-upload-item-row";
import {
  EXISTING_PHOTO_NONE_SELECTED_ERROR,
  EXISTING_PHOTO_REPLACE_INPUT_LABEL,
  EXISTING_PHOTOS_CANCEL_LABEL,
  NEW_UPLOAD_MODE,
  existingPhotoSelectionLimitError,
} from "./studio-selection.constants";
import type { PhotoUploadItem, RejectedPhoto } from "./photo-upload.types";
import { PhotoUploadStatus } from "./photo-upload-status";
import { PhotoSource } from "./photo-source";
import { removePhotoUpload } from "./remove-photo-upload";
import { selectPhotoFiles } from "./select-photo-files";
import { uploadPhoto } from "./upload-photo";
import {
  PHOTO_UPLOAD_ACCEPT,
  PHOTO_UPLOAD_BACK_LABEL,
  PHOTO_UPLOAD_CONTINUE_LABEL,
  PHOTO_UPLOAD_DROP_LABEL,
  PHOTO_UPLOAD_EMPTY_ERROR,
  PHOTO_UPLOAD_FORMATS_LABEL,
  PHOTO_UPLOAD_GENERIC_ERROR,
  PHOTO_UPLOAD_INCOMPLETE_ERROR,
  PHOTO_UPLOAD_MAX_PROGRESS,
  PHOTO_UPLOAD_REMOVE_GENERIC_ERROR,
  PHOTO_UPLOAD_SELECT_LABEL,
} from "./vehicle-create.constants";
import { useVehicleCreateStore } from "./vehicle-create-store";

export interface PhotoUploadStepProps {
  /** What the plan allows, so the sentence and the limit always agree. */
  limitLabel: string;
  maximumPhotos: number;
  onBack: () => void;
  onContinue: () => void;
  /** Explains what the photos are when the dialog opens on a vehicle. */
  note?: string | undefined;
  upload?: typeof uploadPhoto;
  removeUpload?: typeof removePhotoUpload;
}

export function PhotoUploadStep({
  limitLabel,
  maximumPhotos,
  onBack,
  onContinue,
  note,
  removeUpload = removePhotoUpload,
  upload = uploadPhoto,
}: PhotoUploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<string | null>(null);
  const uploadControllers = useRef(new Map<string, AbortController>());
  const [dragActive, setDragActive] = useState(false);
  const [batchLimitRejectedCount, setBatchLimitRejectedCount] = useState(0);
  const [rejected, setRejected] = useState<RejectedPhoto[]>([]);
  const [stepError, setStepError] = useState<string | null>(null);
  const photos = useVehicleCreateStore((state) => state.photos);
  const mode = useVehicleCreateStore((state) => state.mode);
  const vehicleId = useVehicleCreateStore((state) => state.vehicleId);
  const replacePhoto = useVehicleCreateStore((state) => state.replacePhoto);
  const togglePhotoSelected = useVehicleCreateStore(
    (state) => state.togglePhotoSelected,
  );
  const choosing = mode !== NEW_UPLOAD_MODE;
  const selectedPhotos = photos.filter((photo) => photo.selected);
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

  async function removeSelectedPhoto(clientId: string) {
    uploadControllers.current.get(clientId)?.abort();
    uploadControllers.current.delete(clientId);
    const photo = photos.find((candidate) => candidate.clientId === clientId);
    if (
      !photo ||
      photo.source === PhotoSource.Existing ||
      photo.status !== PhotoUploadStatus.Uploaded ||
      photo.assetId === null
    ) {
      removePhoto(clientId);
      return;
    }
    updatePhoto(clientId, { error: null, status: PhotoUploadStatus.Removing });
    try {
      await removeUpload(photo.assetId);
      removePhoto(clientId);
    } catch (error) {
      updatePhoto(clientId, {
        error:
          error instanceof Error
            ? error.message
            : PHOTO_UPLOAD_REMOVE_GENERIC_ERROR,
        status: PhotoUploadStatus.Uploaded,
      });
    }
  }

  function acceptFiles(files: Iterable<File>) {
    setStepError(null);
    const selection = selectPhotoFiles(
      files,
      selectedPhotos.length,
      maximumPhotos,
    );
    setBatchLimitRejectedCount(selection.batchLimitRejectedCount);
    setRejected(selection.rejected);
    const items = selection.accepted.map((file) => createPhotoUploadItem(file));
    addPhotos(items);
    items.forEach((item) => void startUpload(item));
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) acceptFiles(event.target.files);
    event.target.value = "";
  }

  function chooseReplacement(clientId: string) {
    replaceTarget.current = clientId;
    replaceInputRef.current?.click();
  }

  /**
   * The new photo takes the failed photo's place and is uploaded to the same
   * vehicle. The failed original stays stored, so the failed batch's history
   * still points at it.
   */
  function handleReplacementChange(event: ChangeEvent<HTMLInputElement>) {
    const target = replaceTarget.current;
    const file = event.target.files?.[0];
    event.target.value = "";
    replaceTarget.current = null;
    if (!target || !file) return;
    setStepError(null);
    const selection = selectPhotoFiles([file], 0, 1);
    setBatchLimitRejectedCount(selection.batchLimitRejectedCount);
    setRejected(selection.rejected);
    const accepted = selection.accepted[0];
    if (!accepted) return;
    uploadControllers.current.get(target)?.abort();
    uploadControllers.current.delete(target);
    const replacement = createPhotoUploadItem(accepted);
    replacePhoto(target, replacement);
    void startUpload(replacement);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    acceptFiles(event.dataTransfer.files);
  }

  function handleContinue() {
    if (selectedPhotos.length === 0) {
      setStepError(
        choosing ? EXISTING_PHOTO_NONE_SELECTED_ERROR : PHOTO_UPLOAD_EMPTY_ERROR,
      );
      return;
    }
    if (selectedPhotos.length > maximumPhotos) {
      setStepError(existingPhotoSelectionLimitError(maximumPhotos));
      return;
    }
    if (
      !selectedPhotos.every(
        (photo) =>
          photo.status === PhotoUploadStatus.Uploaded && photo.error === null,
      )
    ) {
      setStepError(PHOTO_UPLOAD_INCOMPLETE_ERROR);
      return;
    }
    onContinue();
  }

  return (
    <section className="photo-upload-step">
      {note ? <p className="vehicle-create-note">{note}</p> : null}
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
        <input
          accept={PHOTO_UPLOAD_ACCEPT}
          aria-label={EXISTING_PHOTO_REPLACE_INPUT_LABEL}
          className="sc-visually-hidden"
          onChange={handleReplacementChange}
          ref={replaceInputRef}
          tabIndex={-1}
          type="file"
        />
      </div>
      <p className="photo-upload-step__limit">{limitLabel}</p>
      {batchLimitRejectedCount > 0 || rejected.length > 0 ? (
        <ul className="photo-upload-step__rejections" role="alert">
          {batchLimitRejectedCount > 0 ? (
            <li>
              {describeBatchLimitRejection(
                maximumPhotos,
                batchLimitRejectedCount,
              )}
            </li>
          ) : null}
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
            onRemove={() => void removeSelectedPhoto(photo.clientId)}
            onReplace={
              choosing ? () => chooseReplacement(photo.clientId) : undefined
            }
            onRetry={() => void startUpload(photo)}
            onToggleSelected={
              choosing ? () => togglePhotoSelected(photo.clientId) : undefined
            }
            photo={photo}
            position={choosing ? index + 1 : undefined}
          />
        ))}
      </ol>
      {stepError ? (
        <p className="photo-upload-step__error" role="alert">
          {stepError}
        </p>
      ) : null}
      <footer className="photo-upload-step__footer">
        <Button onClick={onBack}>
          {choosing ? EXISTING_PHOTOS_CANCEL_LABEL : PHOTO_UPLOAD_BACK_LABEL}
        </Button>
        <Button onClick={handleContinue} variant="primary">
          {PHOTO_UPLOAD_CONTINUE_LABEL}
        </Button>
      </footer>
    </section>
  );
}
