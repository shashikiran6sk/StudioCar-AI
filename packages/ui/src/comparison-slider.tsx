"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

const DEFAULT_AFTER_LABEL = "Processed";
const DEFAULT_BEFORE_LABEL = "Original";
const DEFAULT_SPLIT = 50;
const MAXIMUM_SPLIT = 100;
const MINIMUM_SPLIT = 0;

type ComparisonStyle = CSSProperties & {
  "--sc-comparison-split": string;
};

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
  afterLabel = DEFAULT_AFTER_LABEL,
  before,
  beforeLabel = DEFAULT_BEFORE_LABEL,
  defaultValue = DEFAULT_SPLIT,
  label,
  summary,
}: ComparisonSliderProps) {
  const [split, setSplit] = useState(
    Math.min(Math.max(defaultValue, MINIMUM_SPLIT), MAXIMUM_SPLIT),
  );
  const style: ComparisonStyle = { "--sc-comparison-split": `${String(split)}%` };

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
        max={MAXIMUM_SPLIT}
        min={MINIMUM_SPLIT}
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
