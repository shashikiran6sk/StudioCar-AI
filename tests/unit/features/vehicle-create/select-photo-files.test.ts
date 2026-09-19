import { describe, expect, it } from "vitest";

import { selectPhotoFiles } from "../../../../apps/web/src/features/vehicle-create/select-photo-files";

describe("selectPhotoFiles", () => {
  it("keeps valid files while rejecting unsupported and excess selections individually", () => {
    const valid = new File(["image"], "front.jpg", { type: "image/jpeg" });
    const unsupported = new File(["text"], "notes.txt", { type: "text/plain" });
    const excess = new File(["image"], "rear.png", { type: "image/png" });

    const result = selectPhotoFiles([valid, unsupported, excess], 2, 3);

    expect(result.accepted).toEqual([valid]);
    expect(result.rejected).toHaveLength(2);
    expect(result.rejected.map((item) => item.filename)).toEqual([
      "notes.txt",
      "rear.png",
    ]);
  });
});
