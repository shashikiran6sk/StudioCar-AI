import { describe, expect, it } from "vitest";

import { toRemoveBgShadowType } from "../../../../../workers/image-processing/src/providers/to-remove-bg-shadow-type";

describe("toRemoveBgShadowType", () => {
  it("maps normalized shadow choices to provider values", () => {
    expect(toRemoveBgShadowType("NONE")).toBe("none");
    expect(toRemoveBgShadowType("NATURAL")).toBe("car");
    expect(toRemoveBgShadowType("STUDIO")).toBe("3D");
  });
});
