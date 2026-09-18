"use client";

import type { ButtonHTMLAttributes } from "react";

import { cx } from "./utils";

export interface ToggleOptionProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onChange"> {
  checked: boolean;
  description?: string;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}

export function ToggleOption({
  checked,
  className,
  description,
  disabled,
  label,
  onCheckedChange,
  ...props
}: ToggleOptionProps) {
  return (
    <button
      aria-checked={checked}
      className={cx("sc-toggle-option", className)}
      disabled={disabled}
      onClick={() => {
        onCheckedChange(!checked);
      }}
      role="switch"
      type="button"
      {...props}
    >
      <span className="sc-toggle-option__copy">
        <span className="sc-toggle-option__label">{label}</span>
        {description ? <span className="sc-toggle-option__description">{description}</span> : null}
      </span>
      <span aria-hidden="true" className="sc-toggle-option__track">
        <span className="sc-toggle-option__thumb" />
      </span>
    </button>
  );
}
