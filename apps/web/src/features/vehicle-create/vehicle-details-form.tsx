"use client";

import type { CreateVehicle } from "@studiocar/contracts";
import { Button, Field, TextareaField } from "@studiocar/ui";
import { useState, type FormEvent } from "react";

import { parseVehicleDetails } from "./parse-vehicle-details";
import {
  VEHICLE_DETAILS_CONTINUE_LABEL,
  VEHICLE_DETAILS_GENERIC_ERROR,
  VEHICLE_DETAILS_LABELS,
  VEHICLE_DETAILS_PENDING_LABEL,
  VEHICLE_DETAILS_PLACEHOLDERS,
  VEHICLE_DETAILS_STEP_LABEL,
  VEHICLE_NOTES_MAX_LENGTH,
} from "./vehicle-create.constants";
import { useVehicleCreateStore } from "./vehicle-create-store";

export interface VehicleDetailsFormProps {
  onContinue: (command: CreateVehicle) => Promise<void>;
}

export function VehicleDetailsForm({ onContinue }: VehicleDetailsFormProps) {
  const details = useVehicleCreateStore((state) => state.details);
  const setDetailsField = useVehicleCreateStore(
    (state) => state.setDetailsField,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = parseVehicleDetails(details);
    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      return;
    }
    setFieldErrors({});
    setPending(true);
    try {
      await onContinue(parsed.command);
    } catch {
      setFormError(VEHICLE_DETAILS_GENERIC_ERROR);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="vehicle-details-form" onSubmit={handleSubmit}>
      <div className="vehicle-details-form__grid">
        <div className="vehicle-details-form__wide">
          <Field
            error={fieldErrors["name"]?.[0]}
            label={VEHICLE_DETAILS_LABELS.name}
            onChange={(event) => setDetailsField("name", event.target.value)}
            placeholder={VEHICLE_DETAILS_PLACEHOLDERS.name}
            required
            value={details.name}
          />
        </div>
        <Field
          error={fieldErrors["brand"]?.[0]}
          label={VEHICLE_DETAILS_LABELS.brand}
          onChange={(event) => setDetailsField("brand", event.target.value)}
          placeholder={VEHICLE_DETAILS_PLACEHOLDERS.brand}
          value={details.brand}
        />
        <Field
          error={fieldErrors["model"]?.[0]}
          label={VEHICLE_DETAILS_LABELS.model}
          onChange={(event) => setDetailsField("model", event.target.value)}
          placeholder={VEHICLE_DETAILS_PLACEHOLDERS.model}
          value={details.model}
        />
        <Field
          error={fieldErrors["variant"]?.[0]}
          label={VEHICLE_DETAILS_LABELS.variant}
          onChange={(event) => setDetailsField("variant", event.target.value)}
          placeholder={VEHICLE_DETAILS_PLACEHOLDERS.variant}
          value={details.variant}
        />
        <Field
          error={fieldErrors["year"]?.[0]}
          inputMode="numeric"
          label={VEHICLE_DETAILS_LABELS.year}
          onChange={(event) => setDetailsField("year", event.target.value)}
          placeholder={VEHICLE_DETAILS_PLACEHOLDERS.year}
          value={details.year}
        />
        <Field
          error={fieldErrors["stockId"]?.[0]}
          label={VEHICLE_DETAILS_LABELS.stockId}
          onChange={(event) => setDetailsField("stockId", event.target.value)}
          placeholder={VEHICLE_DETAILS_PLACEHOLDERS.stockId}
          value={details.stockId}
        />
        <Field
          error={fieldErrors["internalId"]?.[0]}
          label={VEHICLE_DETAILS_LABELS.internalId}
          onChange={(event) =>
            setDetailsField("internalId", event.target.value)
          }
          placeholder={VEHICLE_DETAILS_PLACEHOLDERS.internalId}
          value={details.internalId}
        />
        <div className="vehicle-details-form__wide">
          <TextareaField
            error={fieldErrors["notes"]?.[0]}
            label={VEHICLE_DETAILS_LABELS.notes}
            maxLength={VEHICLE_NOTES_MAX_LENGTH}
            onChange={(event) => setDetailsField("notes", event.target.value)}
            placeholder={VEHICLE_DETAILS_PLACEHOLDERS.notes}
            value={details.notes}
          />
        </div>
      </div>
      {formError ? (
        <p className="vehicle-details-form__error" role="alert">
          {formError}
        </p>
      ) : null}
      <footer className="vehicle-details-form__footer">
        <span>{VEHICLE_DETAILS_STEP_LABEL}</span>
        <Button disabled={pending} type="submit" variant="primary">
          {pending
            ? VEHICLE_DETAILS_PENDING_LABEL
            : VEHICLE_DETAILS_CONTINUE_LABEL}
        </Button>
      </footer>
    </form>
  );
}
