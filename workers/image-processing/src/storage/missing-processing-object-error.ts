import { MISSING_OBJECT_MESSAGE } from "./s3-processing-object-storage.constants";

export class MissingProcessingObjectError extends Error {
  public constructor() {
    super(MISSING_OBJECT_MESSAGE);
    this.name = "MissingProcessingObjectError";
  }
}
