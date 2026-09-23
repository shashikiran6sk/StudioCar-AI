"use client";

import type { ProcessingOptions } from "@studiocar/contracts";
import { Button } from "@studiocar/ui";
import Image from "next/image";
import { useState } from "react";

import { buildProcessingOptions } from "../studio-treatment/build-processing-options";
import {
  BACKGROUND_LABELS,
  STUDIO_FLOOR_LABELS,
} from "../studio-treatment/studio-treatment.constants";
import { formatPhotoCount } from "./format-photo-count";
import {
  REVIEW_BACKGROUND_LABEL,
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
import { useVehicleCreateStore } from "./vehicle-create-store";
import { vehicleReviewMetadata } from "./vehicle-review-metadata";

export interface ReviewProcessStepProps {
  onBack: () => void;
  onProcess: (
    vehicleId: string,
    assetIds: string[],
    options: ProcessingOptions,
  ) => Promise<void>;
}

export function ReviewProcessStep({
  onBack,
  onProcess,
}: ReviewProcessStepProps) {
  const details = useVehicleCreateStore((state) => state.details);
  const settings = useVehicleCreateStore((state) => state.settings);
  const studio = useVehicleCreateStore((state) => state.studio);
  const studioBackgroundEnabled = useVehicleCreateStore(
    (state) => state.studioBackgroundEnabled,
  );
  const options = buildProcessingOptions({
    settings,
    studio,
    studioBackgroundEnabled,
  });
  const photos = useVehicleCreateStore((state) => state.photos);
  const vehicleId = useVehicleCreateStore((state) => state.vehicleId);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const firstPhoto = photos[0];
  const assetIds = photos.flatMap((photo) =>
    photo.assetId ? [photo.assetId] : [],
  );

  async function processPhotos() {
    if (!vehicleId || !options || assetIds.length !== photos.length) {
      setError(REVIEW_PROCESS_ERROR);
      return;
    }
    setError(null);
    setPending(true);
    try {
      await onProcess(vehicleId, assetIds, options);
    } catch {
      setError(REVIEW_PROCESS_ERROR);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="review-process-step">
      <div className="review-process-step__summary">
        {firstPhoto ? (
          <Image
            alt={firstPhoto.file.name}
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
              <dd>{formatPhotoCount(photos.length)}</dd>
            </div>
            <div>
              <dt>{REVIEW_PLATE_PRIVACY_LABEL}</dt>
              <dd>
                {settings.platePrivacy
                  ? REVIEW_ENABLED_LABEL
                  : REVIEW_DISABLED_LABEL}
              </dd>
            </div>
            <div>
              <dt>{REVIEW_BACKGROUND_LABEL}</dt>
              <dd>
                {BACKGROUND_LABELS[options?.backgroundId ?? "ORIGINAL"]}
              </dd>
            </div>
            {options && options.backgroundId !== "ORIGINAL" ? (
              <div>
                <dt>{REVIEW_FLOOR_LABEL}</dt>
                <dd>{STUDIO_FLOOR_LABELS[options.floorId]}</dd>
              </div>
            ) : null}
            <div>
              <dt>{REVIEW_ENHANCEMENT_LABEL}</dt>
              <dd>
                {settings.enhancement
                  ? REVIEW_ENABLED_LABEL
                  : REVIEW_DISABLED_LABEL}
              </dd>
            </div>
          </dl>
          <div className="review-process-step__usage">
            <span>{REVIEW_ESTIMATED_USAGE_LABEL}</span>
            <strong>
              {String(photos.length)} {REVIEW_CREDIT_LABEL}
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
