import type { ProcessingFailureReason } from "@studiocar/contracts";

/** What each failure reason tells the person, and what to do next. */
export const PROCESSING_FAILURE_MESSAGES: Readonly<
  Record<ProcessingFailureReason, string>
> = {
  BACKGROUND_REMOVAL_FAILED:
    "We couldn't separate the vehicle from its background. Re-process, or replace it with a clearer photo.",
  CANCELLED: "Processing was cancelled before this photo finished.",
  NON_CAR_IMAGE:
    "A vehicle could not be detected in this image. Please upload a clear image of a car.",
  PROCESSING_FAILED:
    "The studio image couldn't be created. Re-process to try again.",
  SERVICE_UNAVAILABLE:
    "Background removal was unavailable after several attempts. Re-process to try again.",
  UNUSABLE_IMAGE:
    "This photo couldn't be read. It may be damaged or in an unsupported format. Replace it with another photo.",
};
