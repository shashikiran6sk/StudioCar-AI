"use client";

import Image from "next/image";

import {
  STUDIO_CHOICE_PREVIEW_HEIGHT,
  STUDIO_CHOICE_PREVIEW_WIDTH,
} from "./vehicle-create.constants";

export interface StudioChoiceCardProps {
  disabled?: boolean;
  label: string;
  onSelect: () => void;
  previewPath: string;
  selected: boolean;
  /** Floors are shown wider, cropped to the platform. */
  variant: "background" | "floor";
}

/** One studio background or floor, previewed from a bundled image. */
export function StudioChoiceCard({
  disabled = false,
  label,
  onSelect,
  previewPath,
  selected,
  variant,
}: StudioChoiceCardProps) {
  return (
    <button
      aria-pressed={selected}
      className={`studio-choice-card studio-choice-card--${variant}`}
      disabled={disabled}
      onClick={onSelect}
      type="button"
    >
      <Image
        alt=""
        aria-hidden="true"
        className="studio-choice-card__preview"
        height={STUDIO_CHOICE_PREVIEW_HEIGHT}
        src={previewPath}
        width={STUDIO_CHOICE_PREVIEW_WIDTH}
      />
      {selected ? (
        <span aria-hidden="true" className="studio-choice-card__check">
          ✓
        </span>
      ) : null}
      <span className="studio-choice-card__label">{label}</span>
    </button>
  );
}
