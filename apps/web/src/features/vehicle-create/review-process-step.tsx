"use client";

import {
  MAX_PROCESSING_BATCH_LABEL_LENGTH,
  type CreateProcessingBatch,
} from "@studiocar/contracts";
import { Button, Field } from "@studiocar/ui";
import Image from "next/image";
import { useRef, useState } from "react";

import { formatBackgroundTreatment } from "./format-background-treatment";
import { formatCropMode } from "./format-crop-mode";
import { formatFloorStyle } from "./format-floor-style";
import { STUDIO_SCENE_BACKGROUNDS } from "./processing-option.constants";
import { formatPhotoCount } from "./format-photo-count";
import { ProcessingBatchRequestError } from "./processing-batch-request-error";
import {
  REVIEW_BACKGROUND_LABEL,
  REVIEW_BATCH_LABEL_HINT,
  REVIEW_BATCH_LABEL_LABEL,
  REVIEW_COMPOSITION_LABEL,
  REVIEW_FLOOR_LABEL,
  REVIEW_BACK_LABEL,
  REVIEW_CREDIT_LABEL,
  REVIEW_DISABLED_LABEL,
  REVIEW_ENABLED_LABEL,
  REVIEW_ENHANCEMENT_LABEL,
  REVIEW_ESTIMATED_USAGE_LABEL,
  REVIEW_IMAGE_LABEL,
  REVIEW_PLATE_PRIVACY_LABEL,
  REVIEW_PRESERVATION_NOTE,
  REVIEW_PROCESS_ERROR,
  REVIEW_PROCESS_LABEL,
  REVIEW_PROCESS_PENDING_LABEL,
} from "./vehicle-create.constants";
import { toProcessingBatchCommand } from "./to-processing-batch-command";
import { useVehicleCreateStore } from "./vehicle-create-store";
import { vehicleReviewMetadata } from "./vehicle-review-metadata";

export interface ReviewProcessStepProps {
  onBack: () => void;
  onProcess: (command: CreateProcessingBatch) => Promise<void>;
}

export function ReviewProcessStep({
  onBack,
  onProcess,
}: ReviewProcessStepProps) {
  const batchLabel = useVehicleCreateStore((state) => state.batchLabel);
  const setBatchLabel = useVehicleCreateStore((state) => state.setBatchLabel);
  const details = useVehicleCreateStore((state) => state.details);
  const options = useVehicleCreateStore((state) => state.options);
  const photos = useVehicleCreateStore((state) => state.photos);
  const vehicleId = useVehicleCreateStore((state) => state.vehicleId);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // State updates land after the event, so a second click in the same frame
  // would still see `pending` as false; the ref closes that gap.
  const submitting = useRef(false);
  const selectedPhotos = photos.filter((photo) => photo.selected);
  const firstPhoto = selectedPhotos[0];
  const assetIds = selectedPhotos.flatMap((photo) =>
    photo.assetId ? [photo.assetId] : [],
  );

  async function processPhotos() {
    if (submitting.current) return;
    if (
      !vehicleId ||
      assetIds.length === 0 ||
      assetIds.length !== selectedPhotos.length
    ) {
      setError(REVIEW_PROCESS_ERROR);
      return;
    }
    submitting.current = true;
    setError(null);
    setPending(true);
    try {
      await onProcess(
        toProcessingBatchCommand(vehicleId, assetIds, options, batchLabel),
      );
    } catch (caught) {
      setError(
        caught instanceof ProcessingBatchRequestError
          ? caught.message
          : REVIEW_PROCESS_ERROR,
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <section className="review-process-step">
      <div className="review-process-step__summary">
        {firstPhoto ? (
          <Image
            alt={firstPhoto.filename}
            className="review-process-step__image"
            height={132}
            src={firstPhoto.previewUrl}
            unoptimized
            width={190}
          />
        ) : null}
        <div className="review-process-step__details">
          <div>
            <h3>{details.name}</h3>
            <p>{vehicleReviewMetadata(details)}</p>
          </div>
          <dl className="review-process-step__facts">
            <div>
              <dt>{REVIEW_IMAGE_LABEL}</dt>
              <dd>{formatPhotoCount(selectedPhotos.length)}</dd>
            </div>
            <div>
              <dt>{REVIEW_PLATE_PRIVACY_LABEL}</dt>
              <dd>
                {options.platePrivacy
                  ? REVIEW_ENABLED_LABEL
                  : REVIEW_DISABLED_LABEL}
              </dd>
            </div>
            <div>
              <dt>{REVIEW_BACKGROUND_LABEL}</dt>
              <dd>{formatBackgroundTreatment(options.background)}</dd>
            </div>
            {STUDIO_SCENE_BACKGROUNDS.includes(options.background) ? (
              <div>
                <dt>{REVIEW_FLOOR_LABEL}</dt>
                <dd>{formatFloorStyle(options.floor)}</dd>
              </div>
            ) : null}
            <div>
              <dt>{REVIEW_ENHANCEMENT_LABEL}</dt>
              <dd>
                {options.enhancement
                  ? REVIEW_ENABLED_LABEL
                  : REVIEW_DISABLED_LABEL}
              </dd>
            </div>
            <div>
              <dt>{REVIEW_COMPOSITION_LABEL}</dt>
              <dd>{formatCropMode(options.crop)}</dd>
            </div>
          </dl>
          <Field
            disabled={pending}
            hint={REVIEW_BATCH_LABEL_HINT}
            label={REVIEW_BATCH_LABEL_LABEL}
            maxLength={MAX_PROCESSING_BATCH_LABEL_LENGTH}
            onChange={(event) => setBatchLabel(event.target.value)}
            value={batchLabel}
          />
          <div className="review-process-step__usage">
            <span>{REVIEW_ESTIMATED_USAGE_LABEL}</span>
            <strong>
              {String(selectedPhotos.length)} {REVIEW_CREDIT_LABEL}
            </strong>
          </div>
        </div>
      </div>
      <p className="vehicle-create-note">{REVIEW_PRESERVATION_NOTE}</p>
      {error ? (
        <p className="review-process-step__error" role="alert">
          {error}
        </p>
      ) : null}
      <footer className="vehicle-create-step-footer">
        <Button disabled={pending} onClick={onBack}>
          {REVIEW_BACK_LABEL}
        </Button>
        <Button disabled={pending} onClick={() => void processPhotos()} variant="blue">
          {pending ? REVIEW_PROCESS_PENDING_LABEL : REVIEW_PROCESS_LABEL}
        </Button>
      </footer>
    </section>
  );
}
