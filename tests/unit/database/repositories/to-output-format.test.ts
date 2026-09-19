import { describe, expect, it } from "vitest";

import { OutputFormat } from "../../../../packages/database/generated/prisma/client";
import { toOutputFormat } from "../../../../packages/database/src/repositories/to-output-format";

describe("toOutputFormat", () => {
  it("maps every processing output format", () => {
    expect(toOutputFormat("JPEG")).toBe(OutputFormat.JPEG);
    expect(toOutputFormat("PNG")).toBe(OutputFormat.PNG);
    expect(toOutputFormat("WEBP")).toBe(OutputFormat.WEBP);
  });
});
