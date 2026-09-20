import Image from "next/image";
import type { ReactNode } from "react";

import { DASHBOARD_VEHICLE_IMAGE_PATH } from "./dashboard.constants";

export interface DashboardQuickActionCardProps {
  action: ReactNode;
  description: string;
  imageLabel: string;
  status: ReactNode;
  title: string;
}

export function DashboardQuickActionCard({
  action,
  description,
  imageLabel,
  status,
  title,
}: DashboardQuickActionCardProps) {
  return (
    <article className="dashboard-action-card">
      <div className="dashboard-action-card__media">
        <Image
          alt=""
          aria-hidden="true"
          fill
          sizes="(max-width: 767px) 100vw, 33vw"
          src={DASHBOARD_VEHICLE_IMAGE_PATH}
        />
        <span>{imageLabel}</span>
      </div>
      <div className="dashboard-action-card__body">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <div className="dashboard-action-card__footer">
          {status}
          {action}
        </div>
      </div>
    </article>
  );
}
