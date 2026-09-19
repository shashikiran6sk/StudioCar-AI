import { describe, expect, it } from "vitest";

import { readRemoveBgRequestId } from "../../../../../workers/image-processing/src/providers/read-remove-bg-request-id";

describe("readRemoveBgRequestId", () => {
  it("reads a bounded provider request identifier", () => {
    expect(
      readRemoveBgRequestId(
        new Headers({ "x-request-id": ` ${"r".repeat(300)} ` }),
      ),
    ).toHaveLength(255);
    expect(readRemoveBgRequestId(new Headers())).toBeNull();
  });
});
