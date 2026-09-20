"use client";

import { Button, StatePanel } from "@studiocar/ui";

import {
  USAGE_BILLING_ERROR_DESCRIPTION,
  USAGE_BILLING_ERROR_TITLE,
  USAGE_BILLING_RETRY_LABEL,
} from "../../../../features/billing/usage-billing.constants";

export interface UsageBillingErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function UsageBillingError({ reset }: UsageBillingErrorProps) {
  return (
    <StatePanel
      action={<Button onClick={reset}>{USAGE_BILLING_RETRY_LABEL}</Button>}
      description={USAGE_BILLING_ERROR_DESCRIPTION}
      icon={<span aria-hidden="true">!</span>}
      title={USAGE_BILLING_ERROR_TITLE}
    />
  );
}
