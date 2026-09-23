/**
 * A refusal the processing endpoint explained, such as a plan limit or a
 * vehicle that is still processing. Its message is written for the user, so
 * the dialog can show it; any other failure gets the generic message.
 */
export class ProcessingBatchRequestError extends Error {
  public override readonly name = "ProcessingBatchRequestError";
}
