import { describe, expect, it } from "vitest";

import { metadata } from "../../../../apps/web/src/app/(auth)/layout";

describe("authentication layout metadata", () => {
  it("keeps login and authentication errors out of search indexes", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
