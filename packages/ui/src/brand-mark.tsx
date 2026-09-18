import type { HTMLAttributes } from "react";

import { cx } from "./utils";

export interface BrandMarkProps extends HTMLAttributes<HTMLSpanElement> {
  inverted?: boolean;
  withName?: boolean;
}

export function BrandMark({ className, inverted = false, withName = false, ...props }: BrandMarkProps) {
  return (
    <span className={cx("sc-brand", inverted && "sc-brand--inverted", className)} {...props}>
      <span aria-hidden="true" className="sc-brand__mark">
        SC
      </span>
      {withName ? <span className="sc-brand__name">StudioCar AI</span> : null}
    </span>
  );
}

