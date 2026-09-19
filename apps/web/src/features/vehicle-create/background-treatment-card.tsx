"use client";

import type { BackgroundTreatment } from "@studiocar/contracts";

import type { BackgroundTreatmentChoice } from "./background-treatment-choice.types";
import { CUSTOM_BACKGROUND_UNAVAILABLE_LABEL } from "./vehicle-create.constants";

export interface BackgroundTreatmentCardProps {
  choice: BackgroundTreatmentChoice;
  disabled?: boolean;
  onSelect: (value: BackgroundTreatment) => void;
  selected: boolean;
}

export function BackgroundTreatmentCard({
  choice,
  disabled = false,
  onSelect,
  selected,
}: BackgroundTreatmentCardProps) {
  return (
    <button
      aria-pressed={selected}
      className="background-treatment-card"
      disabled={choice.disabled || disabled}
      onClick={() => onSelect(choice.value)}
      title={choice.disabled ? CUSTOM_BACKGROUND_UNAVAILABLE_LABEL : undefined}
      type="button"
    >
      <span
        aria-hidden="true"
        className={`background-treatment-card__visual ${choice.visualClassName}`}
      >
        {choice.value === "CUSTOM" ? "+" : null}
      </span>
      <span>{choice.label}</span>
    </button>
  );
}
