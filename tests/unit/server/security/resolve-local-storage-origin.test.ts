import { describe, expect, it } from "vitest";

import { resolveLocalStorageOrigin } from "../../../../apps/web/src/server/security/resolve-local-storage-origin";

describe("resolveLocalStorageOrigin", () => {
  it("returns the Local profile's MinIO origin", () => {
    expect(resolveLocalStorageOrigin({ APP_ENV: "local" })).toBe(
      "http://localhost:9000",
    );
  });

  it("returns an explicitly configured local endpoint's origin", () => {
    expect(
      resolveLocalStorageOrigin({
        APP_ENV: "local",
        S3_ENDPOINT: "http://127.0.0.1:9100/some/path",
      }),
    ).toBe("http://127.0.0.1:9100");
  });

  it("adds nothing for AWS storage, which the policy already allows", () => {
    expect(resolveLocalStorageOrigin({ APP_ENV: "development" })).toBeUndefined();
    expect(
      resolveLocalStorageOrigin({
        APP_ENV: "production",
        S3_ENDPOINT: "https://s3.ap-south-1.amazonaws.com",
      }),
    ).toBeUndefined();
  });

  it("never trusts an arbitrary remote endpoint", () => {
    expect(
      resolveLocalStorageOrigin({
        APP_ENV: "development",
        S3_ENDPOINT: "https://storage.attacker.example",
      }),
    ).toBeUndefined();
  });
});
