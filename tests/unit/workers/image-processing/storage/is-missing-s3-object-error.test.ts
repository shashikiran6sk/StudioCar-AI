import { NoSuchKey, S3ServiceException } from "@aws-sdk/client-s3";
import { describe, expect, it } from "vitest";

import { isMissingS3ObjectError } from "../../../../../workers/image-processing/src/storage/is-missing-s3-object-error";

describe("isMissingS3ObjectError", () => {
  it("recognizes typed and HTTP 404 S3 failures only", () => {
    expect(
      isMissingS3ObjectError(
        new NoSuchKey({ message: "missing", $metadata: {} }),
      ),
    ).toBe(true);
    expect(
      isMissingS3ObjectError(
        new S3ServiceException({
          message: "missing",
          name: "NotFound",
          $fault: "client",
          $metadata: { httpStatusCode: 404 },
        }),
      ),
    ).toBe(true);
    expect(isMissingS3ObjectError(new Error("network"))).toBe(false);
  });
});
