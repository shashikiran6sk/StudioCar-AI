import { describe, expect, it } from "vitest";
import { resolvePlateBrandingPaths } from "../../../../../workers/image-processing/src/runtime/resolve-plate-branding-paths";

describe("packaged plate assets", () => {
  it("uses assets beside a deployed handler", () => {
    expect(resolvePlateBrandingPaths("file:///var/task/handler.mjs", () => true)).toEqual({
      assets: "/var/task/assets/plate-branding", detector: "/var/task/plate-detector.mjs",
    });
  });
  it("finds repository assets when the handler runs from dist", () => {
    expect(resolvePlateBrandingPaths("file:///worker/dist/local.mjs", () => false)).toEqual({
      assets: "/worker/assets/plate-branding", detector: "/worker/dist/plate-detector.mjs",
    });
  });
});
