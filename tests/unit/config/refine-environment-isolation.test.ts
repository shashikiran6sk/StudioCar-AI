import { describe, expect, it } from "vitest";

import { refineEnvironmentIsolation } from "../../../packages/config/src/refine-environment-isolation";
import { refinementIssues } from "./environment-fixtures";

describe("refineEnvironmentIsolation", () => {
  it("applies database, storage, queue, and secret isolation together", () => {
    expect(
      refinementIssues(refineEnvironmentIsolation, {
        APP_ENV: "production",
        DATABASE_URL: "postgresql://app:secret@localhost:5432/studiocar",
        S3_BUCKET: "studiocar-local",
        SQS_IMAGE_QUEUE_URL: "http://localhost:9324/000000000000/studiocar-images",
        SESSION_SECRET: "local-development-session-secret-000000",
      }),
    ).toEqual([
      expect.stringMatching(/DATABASE_URL must not address a local database/),
      expect.stringMatching(/S3_BUCKET must not be the local bucket/),
      expect.stringMatching(/SQS_IMAGE_QUEUE_URL must be an AWS SQS queue/),
      expect.stringMatching(/SESSION_SECRET is the repository's committed/),
    ]);
  });

  it("finds nothing to refuse in a consistent configuration", () => {
    expect(
      refinementIssues(refineEnvironmentIsolation, {
        APP_ENV: "local",
        DATABASE_URL: "postgresql://studiocar:studiocar@localhost:5432/studiocar",
        S3_BUCKET: "studiocar-local",
        S3_ENDPOINT: "http://localhost:9000",
      }),
    ).toEqual([]);
  });
});
