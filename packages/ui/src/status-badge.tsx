import type { HTMLAttributes } from "react";

import { cx } from "./utils";

export type StatusTone = "completed" | "processing" | "failed" | "warning" | "favourite" | "archived";

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: StatusTone;
}

export function StatusBadge({ children, className, status, ...props }: StatusBadgeProps) {
  return (
    <span className={cx("sc-status", `sc-status--${status}`, className)} {...props}>
      <span aria-hidden="true" className="sc-status__dot" />
      {children}
    </span>
  );
}

