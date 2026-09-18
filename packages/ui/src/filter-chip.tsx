import type { ButtonHTMLAttributes } from "react";

import { cx } from "./utils";

export interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function FilterChip({ active = false, className, type = "button", ...props }: FilterChipProps) {
  return (
    <button
      aria-pressed={active}
      className={cx("sc-filter", active && "sc-filter--active", className)}
      type={type}
      {...props}
    />
  );
}

