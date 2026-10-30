import type { HTMLAttributes } from "react";

import { cx } from "./utils";

/**
 * The squircle mark: a photo frame split by the before-and-after chevron. The
 * split is cut out with the even-odd rule, so the surface behind shows through
 * on any background.
 */
const BRAND_MARK_PATH =
  "M16 2C26.6 2 30 5.4 30 16C30 26.6 26.6 30 16 30C5.4 30 2 26.6 2 16C2 5.4 5.4 2 16 2Z" +
  "M11.91 8.81L14.98 8.81L17.77 16L14.98 23.19L11.91 23.19C9.24 23.19 7.57 21.52 7.57 18.85L7.57 13.15C7.57 10.48 9.24 8.81 11.91 8.81Z" +
  "M16.51 8.81L20.09 8.81C22.76 8.81 24.43 10.48 24.43 13.15L24.43 18.85C24.43 21.52 22.76 23.19 20.09 23.19L16.51 23.19L19.31 16Z";
const BRAND_MARK_VIEW_BOX = "0 0 32 32";
const BRAND_NAME_LIGHT = "Studio";
const BRAND_NAME_BOLD = "Car";
const BRAND_NAME_SUFFIX = "AI";

export interface BrandMarkProps extends HTMLAttributes<HTMLSpanElement> {
  inverted?: boolean;
  withName?: boolean;
}

export function BrandMark({ className, inverted = false, withName = false, ...props }: BrandMarkProps) {
  return (
    <span className={cx("sc-brand", inverted && "sc-brand--inverted", className)} {...props}>
      <svg
        aria-hidden="true"
        className="sc-brand__mark"
        focusable="false"
        viewBox={BRAND_MARK_VIEW_BOX}
      >
        <path d={BRAND_MARK_PATH} fill="currentColor" fillRule="evenodd" />
      </svg>
      {withName ? (
        <span className="sc-brand__name">
          <span className="sc-brand__name-light">{BRAND_NAME_LIGHT}</span>
          {BRAND_NAME_BOLD}{" "}
          <span className="sc-brand__name-suffix">{BRAND_NAME_SUFFIX}</span>
        </span>
      ) : null}
    </span>
  );
}
