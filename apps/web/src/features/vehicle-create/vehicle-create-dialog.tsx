"use client";

import type { CreateVehicle, ProcessingOptions } from "@studiocar/contracts";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@studiocar/ui";
import { useRef, useState, type ReactElement } from "react";

import { CustomizeTreatmentStep } from "./customize-treatment-step";
import { PhotoUploadStep } from "./photo-upload-step";
import { requestCreateVehicleDraft } from "./request-create-vehicle-draft";
import { requestUpdateVehicleDraft } from "./request-update-vehicle-draft";
import { ReviewProcessStep } from "./review-process-step";
import { uploadPhoto } from "./upload-photo";
import {
  VEHICLE_CREATE_DESCRIPTION,
  VEHICLE_CREATE_EYEBROW,
  VEHICLE_CREATE_TOTAL_STEPS,
} from "./vehicle-create.constants";
import { VehicleCreateStep } from "./vehicle-create-step";
import { vehicleCreateStepTitle } from "./vehicle-create-step-title";
import { useVehicleCreateStore } from "./vehicle-create-store";
import { VehicleDetailsForm } from "./vehicle-details-form";

export interface VehicleCreateDialogProps {
  createDraft?: typeof requestCreateVehicleDraft;
  onProcess: (
    vehicleId: string,
    assetIds: string[],
    options: ProcessingOptions,
    idempotencyKey: string,
  ) => Promise<void>;
  trigger: ReactElement;
  updateDraft?: typeof requestUpdateVehicleDraft;
  upload?: typeof uploadPhoto;
}

export function VehicleCreateDialog({
  createDraft = requestCreateVehicleDraft,
  onProcess,
  trigger,
  updateDraft = requestUpdateVehicleDraft,
  upload = uploadPhoto,
}: VehicleCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID(),
  );
  const [processingIdempotencyKey, setProcessingIdempotencyKey] = useState(
    () => crypto.randomUUID(),
  );
  const wizardSession = useRef(0);
  const step = useVehicleCreateStore((state) => state.step);
  const vehicleId = useVehicleCreateStore((state) => state.vehicleId);
  const reset = useVehicleCreateStore((state) => state.reset);
  const setDraft = useVehicleCreateStore((state) => state.setDraft);
  const setStep = useVehicleCreateStore((state) => state.setStep);

  function closeWizard() {
    wizardSession.current += 1;
    setOpen(false);
    reset();
    setIdempotencyKey(crypto.randomUUID());
    setProcessingIdempotencyKey(crypto.randomUUID());
  }

  function changeOpen(nextOpen: boolean) {
    if (nextOpen) {
      setOpen(true);
      return;
    }
    closeWizard();
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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        description={VEHICLE_CREATE_DESCRIPTION}
        eyebrow={VEHICLE_CREATE_EYEBROW}
        step={{ current: step, total: VEHICLE_CREATE_TOTAL_STEPS }}
        title={vehicleCreateStepTitle(step)}
      >
        {step === VehicleCreateStep.Details ? (
          <VehicleDetailsForm onContinue={saveDetails} />
        ) : null}
        {step === VehicleCreateStep.Photos ? (
          <PhotoUploadStep
            onBack={() => setStep(VehicleCreateStep.Details)}
            onContinue={() => setStep(VehicleCreateStep.Customize)}
            upload={upload}
          />
        ) : null}
        {step === VehicleCreateStep.Customize ? (
          <CustomizeTreatmentStep
            onBack={() => setStep(VehicleCreateStep.Photos)}
            onContinue={() => setStep(VehicleCreateStep.Review)}
          />
        ) : null}
        {step === VehicleCreateStep.Review ? (
          <ReviewProcessStep
            onBack={() => setStep(VehicleCreateStep.Customize)}
            onProcess={processPhotos}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
