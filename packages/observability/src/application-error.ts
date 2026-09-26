import {
  SAFE_ERROR_MESSAGE,
  type ApplicationErrorCode,
} from "./monitoring.constants";

export class ApplicationError extends Error {
  public constructor(
    public readonly code: ApplicationErrorCode,
    cause: unknown,
  ) {
    super(SAFE_ERROR_MESSAGE, { cause });
    this.name = "ApplicationError";
  }
}
