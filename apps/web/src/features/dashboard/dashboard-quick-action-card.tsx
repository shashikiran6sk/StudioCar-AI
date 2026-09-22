import Image from "next/image";
import type { ReactNode } from "react";

export interface DashboardQuickActionCardProps {
  action: ReactNode;
  description: string;
  imageAlt: string;
  imageLabel: string;
  imagePath: string;
  status: ReactNode;
  title: string;
}

export function DashboardQuickActionCard({
  action,
  description,
  imageAlt,
  imageLabel,
  imagePath,
  status,
  title,
}: DashboardQuickActionCardProps) {
  return (
    <article className="dashboard-action-card">
      <div className="dashboard-action-card__media">
        <Image
          alt={imageAlt}
          fill
          sizes="(max-width: 767px) 100vw, 33vw"
          src={imagePath}
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
