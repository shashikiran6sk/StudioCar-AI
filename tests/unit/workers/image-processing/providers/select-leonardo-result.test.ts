import { expect, it } from "vitest";

import { selectLeonardoResult } from "../../../../../workers/image-processing/src/providers/select-leonardo-result";

const URL = "https://cdn.example/cutout.webp";

it("selects the single result with its declared dimensions", () => {
  expect(
    selectLeonardoResult([{ contentType: "image/webp", height: 20, url: URL, width: 30 }]),
  ).toEqual({ ok: true, height: 20, url: URL, width: 30 });
  expect(selectLeonardoResult([{ url: URL }])).toEqual({
    ok: true,
    height: null,
    url: URL,
    width: null,
  });
});

it("accepts the WebP type in any case", () => {
  expect(selectLeonardoResult([{ contentType: "IMAGE/WEBP", url: URL }]).ok).toBe(true);
});

it.each([
  [[], "INVALID_RESPONSE"],
  [[{ url: URL }, { url: URL }], "INVALID_RESPONSE"],
  [[{}], "INVALID_RESPONSE"],
  [[{ url: "" }], "INVALID_RESPONSE"],
  [[{ url: "http://cdn.example/a.webp" }], "INVALID_RESPONSE"],
  [[{ url: "not a url" }], "INVALID_RESPONSE"],
  [[{ contentType: "image/png", url: URL }], "INVALID_OUTPUT"],
  [[{ nsfw: true, url: URL }], "CONTENT_BLOCKED"],
  [[{ blocked: true }], "CONTENT_BLOCKED"],
])("refuses %j as %s", (results, category) => {
  expect(selectLeonardoResult(results)).toEqual({ ok: false, category });
});

it("treats explicit false moderation flags as an ordinary result", () => {
  expect(selectLeonardoResult([{ blocked: false, nsfw: false, url: URL }]).ok).toBe(true);
});
