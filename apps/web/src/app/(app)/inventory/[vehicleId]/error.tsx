"use client";

import { Button, StatePanel } from "@studiocar/ui";

const PORTFOLIO_ERROR_TITLE = "Portfolio could not be loaded";
const PORTFOLIO_ERROR_DESCRIPTION =
  "Your images are safe. Try loading this portfolio again.";
const PORTFOLIO_RETRY_LABEL = "Try again";

export interface VehiclePortfolioErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function VehiclePortfolioError({ reset }: VehiclePortfolioErrorProps) {
  return (
    <StatePanel
      action={<Button onClick={reset}>{PORTFOLIO_RETRY_LABEL}</Button>}
      description={PORTFOLIO_ERROR_DESCRIPTION}
      icon={<span aria-hidden="true">!</span>}
      title={PORTFOLIO_ERROR_TITLE}
      tone="error"
    />
  );
}
