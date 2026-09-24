import { describe, expect, it } from "vitest";

import { selectPhotoFiles } from "../../../../apps/web/src/features/vehicle-create/select-photo-files";

function image(filename: string): File {
  return new File(["image"], filename, { type: "image/jpeg" });
}

describe("selectPhotoFiles", () => {
  it("accepts a selection exactly at the batch limit", () => {
    const files = Array.from({ length: 5 }, (_, index) =>
      image(`image-${String(index + 1)}.jpg`),
    );

    const result = selectPhotoFiles(files, 0, 5);

    expect(result.accepted).toEqual(files);
    expect(result.batchLimitRejectedCount).toBe(0);
    expect(result.rejected).toEqual([]);
  });

  it("partially accepts a selection and counts one excess image", () => {
    const files = Array.from({ length: 6 }, (_, index) =>
      image(`image-${String(index + 1)}.jpg`),
    );

    const result = selectPhotoFiles(files, 0, 5);

    expect(result.accepted).toEqual(files.slice(0, 5));
    expect(result.batchLimitRejectedCount).toBe(1);
    expect(result.rejected).toEqual([]);
  });

  it("accepts two selections when three images already occupy a five-image batch", () => {
    const files = [image("side.jpg"), image("rear.jpg")];

    const result = selectPhotoFiles(files, 3, 5);

    expect(result.accepted).toEqual(files);
    expect(result.batchLimitRejectedCount).toBe(0);
  });

  it("preserves partial acceptance when a selection exceeds the remaining capacity", () => {
    const files = [
      image("front.jpg"),
      image("side.jpg"),
      image("rear.jpg"),
      image("interior.jpg"),
    ];

    const result = selectPhotoFiles(files, 3, 5);

    expect(result.accepted).toEqual(files.slice(0, 2));
    expect(result.batchLimitRejectedCount).toBe(2);
  });

  it("aggregates every excess image in a large selection", () => {
    const files = Array.from({ length: 15 }, (_, index) =>
      image(`image-${String(index + 1)}.jpg`),
    );

    const result = selectPhotoFiles(files, 0, 5);

    expect(result.accepted).toEqual(files.slice(0, 5));
    expect(result.batchLimitRejectedCount).toBe(10);
    expect(result.rejected).toEqual([]);
  });

  it("keeps file-specific validation separate from the batch-limit count", () => {
    const valid = image("front.jpg");
    const unsupported = new File(["text"], "notes.txt", { type: "text/plain" });
    const excess = image("rear.jpg");

    const result = selectPhotoFiles([valid, unsupported, excess], 2, 3);

    expect(result.accepted).toEqual([valid]);
    expect(result.batchLimitRejectedCount).toBe(1);
    expect(result.rejected).toEqual([
      {
        filename: "notes.txt",
        reason: "Only JPG, JPEG, PNG, and WEBP images are supported.",
      },
    ]);
  });
});
