import { describe, expect, it } from "vitest";

import { OutputFormat } from "../../../../packages/database-runtime/generated/prisma/client";
import { toOutputFormat } from "../../../../packages/database-runtime/src/repositories/to-output-format";

describe("toOutputFormat", () => {
  it("records every processed image as WebP", () => {
    expect(toOutputFormat("WEBP")).toBe(OutputFormat.WEBP);
  });

  it("keeps the historical formats readable in the column", () => {
    expect(Object.values(OutputFormat)).toEqual(["JPEG", "PNG", "WEBP"]);
  });
});
