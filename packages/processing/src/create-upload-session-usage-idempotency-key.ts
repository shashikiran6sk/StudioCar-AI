const UPLOAD_SESSION_USAGE_PREFIX = "usage:upload-session";

export function createUploadSessionUsageIdempotencyKey(
  batchIdempotencyKey: string,
): string {
  return `${UPLOAD_SESSION_USAGE_PREFIX}:${batchIdempotencyKey}`;
}
