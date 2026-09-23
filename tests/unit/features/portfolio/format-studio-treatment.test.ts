import { describe, expect, it } from "vitest";

import { formatStudioTreatment } from "../../../../apps/web/src/features/portfolio/format-studio-treatment";

describe("formatStudioTreatment", () => {
  it("names a studio treatment by background and floor", () => {
    expect(formatStudioTreatment({ background: "DARK_STUDIO", floor: "HORIZON" })).toBe(
      "Dark Studio · Standard floor",
    );
    expect(formatStudioTreatment({ background: "GREY_STUDIO", floor: "PLAIN" })).toBe(
      "Grey Studio · Plain background",
    );
  });

  it("does not describe a floor for the original background", () => {
    expect(formatStudioTreatment({ background: "ORIGINAL", floor: "HORIZON" })).toBe(
      "Original background",
    );
  });
});
