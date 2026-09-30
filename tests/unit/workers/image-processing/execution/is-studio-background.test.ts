import { expect, it } from "vitest";

import { isStudioBackground } from "../../../../../workers/image-processing/src/execution/is-studio-background";

it.each(["PREMIUM_WHITE", "GREY_STUDIO", "DARK_STUDIO"] as const)("treats %s as a studio background", (background) => {
  expect(isStudioBackground(background)).toBe(true);
});

it("keeps the original photo out of the studio", () => {
  expect(isStudioBackground("ORIGINAL")).toBe(false);
});
