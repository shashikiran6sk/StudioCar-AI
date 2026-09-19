import { describe, expect, it } from "vitest";

import { readResponseJson } from "../../../../apps/web/src/features/auth/read-response-json";

describe("readResponseJson", () => {
  it("returns parsed JSON without assuming its shape", async () => {
    const payload = await readResponseJson(
      new Response(JSON.stringify({ status: "ready" })),
    );

    expect(payload).toEqual({ status: "ready" });
  });

  it("returns null for a non-JSON response", async () => {
    expect(await readResponseJson(new Response("not-json"))).toBeNull();
  });
});
