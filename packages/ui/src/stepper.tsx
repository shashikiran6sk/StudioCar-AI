import type { HTMLAttributes } from "react";

import { cx } from "./utils";

export interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  current: number;
  total: number;
}

export function Stepper({ className, current, total, ...props }: StepperProps) {
  const safeCurrent = Math.min(Math.max(current, 1), total);

  return (
    <div
      aria-label={`Step ${String(safeCurrent)} of ${String(total)}`}
      className={cx("sc-stepper", className)}
      role="img"
      {...props}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          aria-hidden="true"
          className={cx("sc-stepper__bar", index < safeCurrent && "sc-stepper__bar--active")}
          key={index}
        />
      ))}
    </div>
  );
}
