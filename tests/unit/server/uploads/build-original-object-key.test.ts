import { describe, expect, it } from "vitest";

import { buildOriginalObjectKey } from "../../../../apps/web/src/server/uploads/build-original-object-key";

describe("buildOriginalObjectKey", () => {
  it("uses immutable tenant, vehicle, and asset segments", () => {
    expect(
      buildOriginalObjectKey("user-1", "vehicle-1", "asset-1", "image/jpeg"),
    ).toBe(
      "users/user-1/vehicles/vehicle-1/assets/asset-1/original/source.jpg",
    );
  });
});
