"use client";

import { Button, StatePanel } from "@studiocar/ui";

const INVENTORY_ERROR_TITLE = "Inventory could not be loaded";
const INVENTORY_ERROR_DESCRIPTION =
  "Your vehicles are safe. Try loading the inventory again.";
const INVENTORY_RETRY_LABEL = "Try again";

export interface InventoryErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function InventoryError({ reset }: InventoryErrorProps) {
  return (
    <StatePanel
      action={<Button onClick={reset}>{INVENTORY_RETRY_LABEL}</Button>}
      description={INVENTORY_ERROR_DESCRIPTION}
      icon={<span aria-hidden="true">!</span>}
      title={INVENTORY_ERROR_TITLE}
      tone="error"
    />
  );
}
