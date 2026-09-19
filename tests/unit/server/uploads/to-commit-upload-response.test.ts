import { describe, expect, it } from "vitest";

import { toCommitUploadResponse } from "../../../../apps/web/src/server/uploads/to-commit-upload-response";
import { createUploadTestAsset } from "./create-upload-test-asset";

describe("toCommitUploadResponse", () => {
  it("serializes only fully uploaded image assets", () => {
    expect(
      toCommitUploadResponse(
        createUploadTestAsset({ status: "UPLOADED", width: 20, height: 10 }),
      ),
    ).toMatchObject({ status: "UPLOADED", width: 20, height: 10 });
    expect(toCommitUploadResponse(createUploadTestAsset())).toBeNull();
  });
});
