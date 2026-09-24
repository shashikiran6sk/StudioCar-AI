import { describe, expect, it } from "vitest";

import { readRemoveBgErrorCode } from "../../../../../workers/image-processing/src/providers/read-remove-bg-error-code";

describe("readRemoveBgErrorCode", () => {
  it("reads the first machine-readable provider error code", async () => {
    const response = new Response(
      JSON.stringify({
        errors: [
          {
            code: "unknown_foreground",
            title: "provider detail that must not reach the UI",
          },
        ],
      }),
    );

    await expect(readRemoveBgErrorCode(response)).resolves.toBe(
      "unknown_foreground",
    );
  });

  it.each([
    "not-json",
    JSON.stringify({}),
    JSON.stringify({ errors: [] }),
    JSON.stringify({ errors: [{ title: "Missing code" }] }),
    JSON.stringify({ errors: [{ code: 123 }] }),
  ])("rejects malformed provider error bodies", async (body) => {
    await expect(
      readRemoveBgErrorCode(new Response(body)),
    ).resolves.toBeNull();
  });
});
