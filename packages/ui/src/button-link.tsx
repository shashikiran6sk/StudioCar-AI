import type { AnchorHTMLAttributes } from "react";

import type { ButtonSize, ButtonVariant } from "./button";
import { cx } from "./utils";

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export function ButtonLink({
  className,
  size = "default",
  variant = "secondary",
  ...props
}: ButtonLinkProps) {
  return (
    <a
      className={cx(
        "sc-button",
        `sc-button--${variant}`,
        `sc-button--${size}`,
        className,
      )}
      {...props}
    />
  );
}
