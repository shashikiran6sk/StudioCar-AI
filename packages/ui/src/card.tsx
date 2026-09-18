import type { HTMLAttributes } from "react";

import { cx } from "./utils";

export type CardTone = "default" | "subtle" | "dark";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
}

export function Card({ className, tone = "default", ...props }: CardProps) {
  return <div className={cx("sc-card", `sc-card--${tone}`, className)} {...props} />;
}

