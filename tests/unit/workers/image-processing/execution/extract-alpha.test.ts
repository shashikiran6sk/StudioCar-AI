import { expect, it } from "vitest";

import { extractAlpha } from "../../../../../workers/image-processing/src/execution/extract-alpha";

it("reads the fourth channel of RGBA", () => {
  const data = Buffer.from([1, 2, 3, 40, 5, 6, 7, 250]);
  expect(Array.from(extractAlpha({ channels: 4, data, height: 1, width: 2 }))).toEqual([40, 250]);
});

it("treats RGB as fully opaque", () => {
  const data = Buffer.from([1, 2, 3, 4, 5, 6]);
  expect(Array.from(extractAlpha({ channels: 3, data, height: 1, width: 2 }))).toEqual([255, 255]);
});
