"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogTrigger,
  type ButtonVariant,
} from "@studiocar/ui";
import { useState } from "react";

import {
  BILLING_UNAVAILABLE_BODY,
  BILLING_UNAVAILABLE_CLOSE_LABEL,
  BILLING_UNAVAILABLE_DESCRIPTION,
  BILLING_UNAVAILABLE_TITLE,
} from "./usage-billing.constants";

export interface BillingUnavailableActionProps {
  label: string;
  planName?: string;
  variant?: ButtonVariant;
}

export function BillingUnavailableAction({
  label,
  planName,
  variant = "blue",
}: BillingUnavailableActionProps) {
  const [open, setOpen] = useState(false);
  const title = planName
    ? `${BILLING_UNAVAILABLE_TITLE}: ${planName}`
    : BILLING_UNAVAILABLE_TITLE;

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button variant={variant}>{label}</Button>
      </DialogTrigger>
      <DialogContent
        description={BILLING_UNAVAILABLE_DESCRIPTION}
        footer={
          <Button onClick={() => setOpen(false)} variant="primary">
            {BILLING_UNAVAILABLE_CLOSE_LABEL}
          </Button>
        }
        title={title}
      >
        <p className="billing-unavailable__message">{BILLING_UNAVAILABLE_BODY}</p>
        <p className="billing-unavailable__assurance">
          {BILLING_UNAVAILABLE_DESCRIPTION}
        </p>
      </DialogContent>
    </Dialog>
  );
}
