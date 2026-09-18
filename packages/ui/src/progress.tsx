import type { HTMLAttributes } from "react";

import { cx } from "./utils";

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  max?: number;
  value?: number;
  valueLabel?: string;
}

export function Progress({ className, label, max = 100, value, valueLabel, ...props }: ProgressProps) {
  const safeValue = value === undefined ? undefined : Math.min(Math.max(value, 0), max);
  const width =
    safeValue === undefined ? undefined : `${String((safeValue / max) * 100)}%`;

  return (
    <div className={cx("sc-progress", className)} {...props}>
      <div className="sc-progress__labels">
        <span>{label}</span>
        {valueLabel ? <span>{valueLabel}</span> : null}
      </div>
      <div
        aria-label={label}
        aria-valuemax={safeValue === undefined ? undefined : max}
        aria-valuemin={safeValue === undefined ? undefined : 0}
        aria-valuenow={safeValue}
        className={cx("sc-progress__track", safeValue === undefined && "sc-progress__track--pending")}
        role="progressbar"
      >
        {safeValue === undefined ? null : <span className="sc-progress__fill" style={{ width }} />}
      </div>
    </div>
  );
}
