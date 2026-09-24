import { describe, expect, it } from "vitest";

import { LOCAL_INFRASTRUCTURE } from "../../../packages/config/src/local-infrastructure";
import { refineLocalSecretIsolation } from "../../../packages/config/src/refine-local-secret-isolation";
import { refinementIssues } from "./environment-fixtures";

const COMMITTED = {
  SESSION_SECRET: LOCAL_INFRASTRUCTURE.sessionSecret,
  PROCESSING_DISPATCH_TOKEN: LOCAL_INFRASTRUCTURE.processingDispatchToken,
  EMAIL_DISPATCH_TOKEN: LOCAL_INFRASTRUCTURE.emailDispatchToken,
  LIFECYCLE_CLEANUP_TOKEN: LOCAL_INFRASTRUCTURE.lifecycleCleanupToken,
  STORAGE_CLEANUP_TOKEN: LOCAL_INFRASTRUCTURE.storageCleanupToken,
};

describe("refineLocalSecretIsolation", () => {
  it("accepts every committed value in Local", () => {
    expect(
      refinementIssues(refineLocalSecretIsolation, { APP_ENV: "local", ...COMMITTED }),
    ).toEqual([]);
  });

  it("refuses the committed session secret but not the local tokens in Development", () => {
    expect(
      refinementIssues(refineLocalSecretIsolation, {
        APP_ENV: "development",
        ...COMMITTED,
      }),
    ).toEqual([expect.stringMatching(/^SESSION_SECRET is the repository's committed/)]);
  });

  it("refuses every committed value in production", () => {
    expect(
      refinementIssues(refineLocalSecretIsolation, {
        APP_ENV: "production",
        ...COMMITTED,
      }),
    ).toHaveLength(5);
  });
});
