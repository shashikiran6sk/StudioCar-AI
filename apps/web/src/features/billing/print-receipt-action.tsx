"use client";

import { Button } from "@studiocar/ui";

export function PrintReceiptAction() {
  return <Button onClick={() => window.print()} variant="secondary">Print Receipt</Button>;
}
