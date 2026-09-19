import { describe, expect, it } from "vitest";

import { hexSha256ToBase64 } from "../../../../apps/web/src/server/uploads/hex-sha256-to-base64";

describe("hexSha256ToBase64", () => {
  it("encodes the digest format required by S3 checksum headers", () => {
    expect(hexSha256ToBase64("00".repeat(32))).toBe(
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    );
  });
});
