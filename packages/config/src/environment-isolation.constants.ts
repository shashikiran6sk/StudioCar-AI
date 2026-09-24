/**
 * Name segments that declare which environment owns a bucket, queue, or
 * database. A production resource must carry a production segment and no
 * other; Development refuses any resource carrying one. Together these make a
 * copied production name fail in Development, and a copied Development name
 * fail in production, without guessing from anything vaguer than a declared
 * segment.
 */
export const PRODUCTION_NAME_SEGMENTS: readonly string[] = [
  "prod",
  "production",
  "prd",
];

export const NON_PRODUCTION_NAME_SEGMENTS: readonly string[] = [
  "local",
  "dev",
  "development",
  "test",
  "testing",
  "staging",
  "stage",
  "sandbox",
  "qa",
  "ci",
];

/** Hostnames AWS S3 and SQS are served from. */
export const AWS_SERVICE_HOSTNAME_SUFFIX = ".amazonaws.com";
export const HTTPS_PROTOCOL = "https:";
