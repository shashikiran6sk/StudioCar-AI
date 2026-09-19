import type { JobStatus } from "@studiocar/contracts";

export function jobStatusIsTerminal(status: JobStatus): boolean {
  return (
    status.state === "COMPLETED" ||
    status.state === "FAILED" ||
    status.state === "CANCELLED"
  );
}
