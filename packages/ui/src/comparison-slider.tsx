"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

export interface ComparisonSliderProps {
  after: ReactNode;
  afterLabel?: string;
  before: ReactNode;
  beforeLabel?: string;
  defaultValue?: number;
  label: string;
  summary?: string;
}

export function ComparisonSlider({
  after,
  afterLabel = "Processed",
  before,
  beforeLabel = "Original",
  defaultValue = 50,
  label,
  summary,
}: ComparisonSliderProps) {
  const [split, setSplit] = useState(Math.min(Math.max(defaultValue, 0), 100));
  const style = { "--sc-comparison-split": `${String(split)}%` } as CSSProperties;

  return (
    <div className="sc-comparison" style={style}>
      <div className="sc-comparison__layer sc-comparison__layer--before">{before}</div>
      <div className="sc-comparison__layer sc-comparison__layer--after">{after}</div>
      <span className="sc-comparison__label sc-comparison__label--before">{beforeLabel}</span>
      <span className="sc-comparison__label sc-comparison__label--after">{afterLabel}</span>
      <span aria-hidden="true" className="sc-comparison__divider">
        <span className="sc-comparison__handle">↔</span>
      </span>
      <input
        aria-label={label}
        className="sc-comparison__range"
        max="100"
        min="0"
        onChange={(event) => {
          setSplit(event.currentTarget.valueAsNumber);
        }}
        type="range"
        value={split}
      />
      {summary ? <span className="sc-comparison__summary">{summary}</span> : null}
    </div>
  );
}
