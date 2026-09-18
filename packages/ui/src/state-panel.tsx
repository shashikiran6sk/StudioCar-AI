import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "./utils";

export type StatePanelTone = "empty" | "success" | "error" | "warning";

export interface StatePanelProps extends HTMLAttributes<HTMLDivElement> {
  action?: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
  tone?: StatePanelTone;
}

export function StatePanel({
  action,
  className,
  description,
  icon,
  title,
  tone = "empty",
  ...props
}: StatePanelProps) {
  return (
    <div className={cx("sc-state-panel", `sc-state-panel--${tone}`, className)} {...props}>
      <span aria-hidden="true" className="sc-state-panel__icon">
        {icon}
      </span>
      <h2 className="sc-state-panel__title">{title}</h2>
      <p className="sc-state-panel__description">{description}</p>
      {action ? <div className="sc-state-panel__action">{action}</div> : null}
    </div>
  );
}

