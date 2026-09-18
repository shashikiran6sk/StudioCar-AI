import type { HTMLAttributes } from "react";

import { cx } from "./utils";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function Skeleton({ className, label = "Loading", ...props }: SkeletonProps) {
  return (
    <div aria-label={label} className={cx("sc-skeleton", className)} role="status" {...props}>
      <span className="sc-visually-hidden">{label}</span>
    </div>
  );
}

