"use client";

import { Button, StatePanel } from "@studiocar/ui";

import {
  DASHBOARD_ERROR_DESCRIPTION,
  DASHBOARD_ERROR_TITLE,
  DASHBOARD_RETRY_LABEL,
} from "../../../features/dashboard/dashboard.constants";

export interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ reset }: DashboardErrorProps) {
  return (
    <StatePanel
      action={<Button onClick={reset}>{DASHBOARD_RETRY_LABEL}</Button>}
      description={DASHBOARD_ERROR_DESCRIPTION}
      icon={<span aria-hidden="true">!</span>}
      title={DASHBOARD_ERROR_TITLE}
    />
  );
}
