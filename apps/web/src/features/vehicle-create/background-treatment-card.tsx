"use client";

import type { BackgroundTreatment } from "@studiocar/contracts";

import type { BackgroundTreatmentChoice } from "./background-treatment-choice.types";

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
      disabled={disabled}
      onClick={() => onSelect(choice.value)}
      type="button"
    >
      <span
        aria-hidden="true"
        className={`background-treatment-card__visual ${choice.visualClassName}`}
      />
      <span>{choice.label}</span>
    </button>
  );
}
