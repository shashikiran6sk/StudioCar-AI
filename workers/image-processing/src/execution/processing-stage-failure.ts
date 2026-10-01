import type { ProcessingExecutionFailure } from "@studiocar/processing";

/** Stops a job at a pipeline stage with an already classified failure. */
export class ProcessingStageFailure extends Error {
  public constructor(public readonly failure: ProcessingExecutionFailure) {
    super(failure.errorMessage);
    this.name = "ProcessingStageFailure";
  }
}
