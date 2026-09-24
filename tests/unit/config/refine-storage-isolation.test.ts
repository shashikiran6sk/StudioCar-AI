import { describe, expect, it } from "vitest";

import { refineStorageIsolation } from "../../../packages/config/src/refine-storage-isolation";
import { refinementIssues } from "./environment-fixtures";

describe("refineStorageIsolation", () => {
  it("keeps Local on MinIO", () => {
    expect(
      refinementIssues(refineStorageIsolation, {
        APP_ENV: "local",
        S3_BUCKET: "studiocar-local",
        S3_ENDPOINT: "http://localhost:9000",
      }),
    ).toEqual([]);

    for (const endpoint of [undefined, "https://s3.ap-south-1.amazonaws.com"]) {
      expect(
        refinementIssues(refineStorageIsolation, {
          APP_ENV: "local",
          S3_BUCKET: "studiocar-local",
          S3_ENDPOINT: endpoint,
        }),
      ).toEqual([expect.stringMatching(/must address local MinIO/)]);
    }
  });

  it.each(["development", "production"] as const)(
    "refuses MinIO and a localhost endpoint in %s",
    (appEnvironment) => {
      const bucket =
        appEnvironment === "production" ? "studiocar-prod-images" : "studiocar-dev-images";
      for (const endpoint of ["http://localhost:9000", "http://minio:9000"]) {
        expect(
          refinementIssues(refineStorageIsolation, {
            APP_ENV: appEnvironment,
            S3_BUCKET: bucket,
            S3_ENDPOINT: endpoint,
          }),
        ).toEqual([expect.stringMatching(/local MinIO is refused/)]);
      }
    },
  );

  it.each(["development", "production"] as const)(
    "refuses the local bucket and emulator key in %s",
    (appEnvironment) => {
      expect(
        refinementIssues(refineStorageIsolation, {
          APP_ENV: appEnvironment,
          S3_BUCKET: "studiocar-local",
          S3_ACCESS_KEY_ID: "studiocarlocal",
        }),
      ).toEqual([
        expect.stringMatching(/local emulator key/),
        expect.stringMatching(/must not be the local bucket/),
      ]);
    },
  );

  it("refuses a production bucket in Development", () => {
    expect(
      refinementIssues(refineStorageIsolation, {
        APP_ENV: "development",
        S3_BUCKET: "studiocar-prod-images",
      }),
    ).toEqual([expect.stringMatching(/Development must use its own/)]);
  });

  it("accepts a Development bucket reached through AWS", () => {
    expect(
      refinementIssues(refineStorageIsolation, {
        APP_ENV: "development",
        S3_BUCKET: "studiocar-dev-images",
        S3_ENDPOINT: "https://s3.ap-south-1.amazonaws.com",
      }),
    ).toEqual([]);
  });

  it("requires production to use a bucket that declares production ownership", () => {
    expect(
      refinementIssues(refineStorageIsolation, {
        APP_ENV: "production",
        S3_BUCKET: "studiocar-images",
      }),
    ).toEqual([expect.stringMatching(/declare production ownership/)]);
    expect(
      refinementIssues(refineStorageIsolation, {
        APP_ENV: "production",
        S3_BUCKET: "studiocar-prod-images",
      }),
    ).toEqual([]);
  });

  it("refuses a Development bucket in production", () => {
    expect(
      refinementIssues(refineStorageIsolation, {
        APP_ENV: "production",
        S3_BUCKET: "studiocar-dev-images",
      }),
    ).toEqual([
      expect.stringMatching(/declare production ownership/),
      expect.stringMatching(/declares a non-production environment/),
    ]);
  });

  it("ignores a runtime without storage", () => {
    expect(refinementIssues(refineStorageIsolation, { APP_ENV: "production" })).toEqual(
      [],
    );
  });
});
