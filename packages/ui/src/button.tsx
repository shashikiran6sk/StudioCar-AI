import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cx } from "./utils";

export type ButtonVariant = "primary" | "blue" | "secondary" | "ghost" | "danger";
export type ButtonSize = "default" | "small" | "marketing" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, size = "default", type = "button", variant = "secondary", ...props },
  ref,
) {
  return (
    <button
      className={cx("sc-button", `sc-button--${variant}`, `sc-button--${size}`, className)}
      ref={ref}
      type={type}
      {...props}
    />
  );
});

