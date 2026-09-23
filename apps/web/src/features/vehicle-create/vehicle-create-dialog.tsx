"use client";

import type {
  CreateVehicle,
  ProcessingOptions,
  StudioSelectionContext,
} from "@studiocar/contracts";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@studiocar/ui";
import { useEffect, useRef, useState, type ReactElement } from "react";

import { CustomizeTreatmentStep } from "./customize-treatment-step";
import { PhotoUploadStep } from "./photo-upload-step";
import { requestCreateVehicleDraft } from "./request-create-vehicle-draft";
import { requestUpdateVehicleDraft } from "./request-update-vehicle-draft";
import { ReviewProcessStep } from "./review-process-step";
import { studioSelectionHeading } from "./studio-selection-heading";
import { uploadPhoto } from "./upload-photo";
import { VehicleCreateStep } from "./vehicle-create-step";
import { useVehicleCreateStore } from "./vehicle-create-store";
import { VehicleDetailsForm } from "./vehicle-details-form";

export interface VehicleCreateDialogProps {
  /** What the plan allows, in a sentence built from the account's plan. */
  batchLimitLabel: string;
  /**
   * Opens the dialog, already open, on an existing vehicle: a new studio
   * version, a re-process, or a replacement. Without it the dialog creates a
   * new vehicle from its trigger.
   */
  context?: StudioSelectionContext;
  createDraft?: typeof requestCreateVehicleDraft;
  /** The plan's own limit, so the wizard stops where the server would. */
  maxImagesPerBatch: number;
  /** Called when the person leaves without processing. */
  onCancel?: () => void;
  onProcess: (
    vehicleId: string,
    assetIds: string[],
    options: ProcessingOptions,
    idempotencyKey: string,
  ) => Promise<void>;
  trigger?: ReactElement;
  updateDraft?: typeof requestUpdateVehicleDraft;
  upload?: typeof uploadPhoto;
}

function contextKey(context: StudioSelectionContext): string {
  return `${context.mode}:${context.vehicle.id}`;
}

export function VehicleCreateDialog({
  batchLimitLabel,
  context,
  createDraft = requestCreateVehicleDraft,
  maxImagesPerBatch,
  onCancel,
  onProcess,
  trigger,
  updateDraft = requestUpdateVehicleDraft,
  upload = uploadPhoto,
}: VehicleCreateDialogProps) {
  const [open, setOpen] = useState(context !== undefined);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID(),
  );
  // One key per dialog session: every retry of Process, and a double click,
  // replays the same batch instead of creating another.
  const [processingIdempotencyKey, setProcessingIdempotencyKey] = useState(
    () => crypto.randomUUID(),
  );
  const wizardSession = useRef(0);
  const initializedFor = useRef<string | null>(null);
  const step = useVehicleCreateStore((state) => state.step);
  const mode = useVehicleCreateStore((state) => state.mode);
  const vehicleId = useVehicleCreateStore((state) => state.vehicleId);
  const initialize = useVehicleCreateStore((state) => state.initialize);
  const reset = useVehicleCreateStore((state) => state.reset);
  const setDraft = useVehicleCreateStore((state) => state.setDraft);
  const setStep = useVehicleCreateStore((state) => state.setStep);

  // The server re-renders the page, and hands over a new context object,
  // whenever processing elsewhere finishes. Initializing once per vehicle and
  // mode keeps the person's choices through those refreshes.
  useEffect(() => {
    if (!context) return;
    const key = contextKey(context);
    if (initializedFor.current === key) return;
    initializedFor.current = key;
    initialize(context);
  }, [context, initialize]);

  const ready =
    !context || (mode === context.mode && vehicleId === context.vehicle.id);
  const heading = studioSelectionHeading(step, context?.mode);

  function closeWizard() {
    wizardSession.current += 1;
    initializedFor.current = null;
    setOpen(false);
    reset();
    setIdempotencyKey(crypto.randomUUID());
    setProcessingIdempotencyKey(crypto.randomUUID());
  }

  function cancel() {
    closeWizard();
    onCancel?.();
  }

  function changeOpen(nextOpen: boolean) {
    if (nextOpen) {
      setOpen(true);
      return;
    }
    cancel();
  }

  async function saveDetails(command: CreateVehicle) {
    const activeSession = wizardSession.current;
    if (vehicleId) {
      await updateDraft(vehicleId, command);
      if (wizardSession.current !== activeSession) return;
      setStep(VehicleCreateStep.Photos);
      return;
    }
    const result = await createDraft(command, idempotencyKey);
    if (wizardSession.current !== activeSession) return;
    setDraft(result.vehicle.id);
  }

  async function processPhotos(
    persistedVehicleId: string,
    assetIds: string[],
    options: ProcessingOptions,
  ) {
    const activeSession = wizardSession.current;
    await onProcess(
      persistedVehicleId,
      assetIds,
      options,
      processingIdempotencyKey,
    );
    if (wizardSession.current !== activeSession) return;
    closeWizard();
  }

  return (
    <Dialog onOpenChange={changeOpen} open={open}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        description={heading.description}
        eyebrow={heading.eyebrow}
        step={heading.step}
        title={heading.title}
      >
        {ready && step === VehicleCreateStep.Details ? (
          <VehicleDetailsForm onContinue={saveDetails} />
        ) : null}
        {ready && step === VehicleCreateStep.Photos ? (
          <PhotoUploadStep
            limitLabel={batchLimitLabel}
            maximumPhotos={maxImagesPerBatch}
            note={heading.photosNote}
            onBack={
              context ? cancel : () => setStep(VehicleCreateStep.Details)
            }
            onContinue={() => setStep(VehicleCreateStep.Customize)}
            upload={upload}
          />
        ) : null}
        {ready && step === VehicleCreateStep.Customize ? (
          <CustomizeTreatmentStep
            onBack={() => setStep(VehicleCreateStep.Photos)}
            onContinue={() => setStep(VehicleCreateStep.Review)}
          />
        ) : null}
        {ready && step === VehicleCreateStep.Review ? (
          <ReviewProcessStep
            onBack={() => setStep(VehicleCreateStep.Customize)}
            onProcess={processPhotos}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
