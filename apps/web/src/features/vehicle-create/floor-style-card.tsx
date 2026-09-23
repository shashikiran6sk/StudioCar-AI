"use client";

import type { FloorStyle } from "@studiocar/contracts";

import type { FloorStyleChoice } from "./floor-style-choice.types";

export interface FloorStyleCardProps {
  choice: FloorStyleChoice;
  disabled?: boolean;
  onSelect: (value: FloorStyle) => void;
  selected: boolean;
}

/** One floor a studio background can stand the vehicle on. */
export function FloorStyleCard({
  choice,
  disabled = false,
  onSelect,
  selected,
}: FloorStyleCardProps) {
  return (
    <button
      aria-pressed={selected}
      className="background-treatment-card floor-style-card"
      disabled={disabled}
      onClick={() => onSelect(choice.value)}
      type="button"
    >
      <span
        aria-hidden="true"
        className={`background-treatment-card__visual floor-style-card__visual ${choice.visualClassName}`}
      />
      <span>{choice.label}</span>
    </button>
  );
}
