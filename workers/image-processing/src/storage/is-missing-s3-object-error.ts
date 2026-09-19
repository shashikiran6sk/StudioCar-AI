import { NoSuchKey, S3ServiceException } from "@aws-sdk/client-s3";

export function isMissingS3ObjectError(error: unknown): boolean {
  return (
    error instanceof NoSuchKey ||
    (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404)
  );
}
