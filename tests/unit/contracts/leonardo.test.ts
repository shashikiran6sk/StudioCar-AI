import { describe, expect, it } from "vitest";

import {
  LeonardoImageUrlSchema,
  LeonardoResponseSchema,
  LeonardoSizeSchema,
} from "../../../packages/contracts/src/leonardo";

const RESULT = {
  id: "generation",
  results: [{ url: "https://cdn.example/image.webp", contentType: "image/webp" }],
};

describe("Leonardo contracts", () => {
  it("offers only the two plan-driven sizes", () => {
    expect(LeonardoSizeSchema.options).toEqual(["preview", "auto"]);
  });

  it("accepts a result with optional dimensions and cost", () => {
    expect(LeonardoResponseSchema.safeParse(RESULT).success).toBe(true);
    expect(
      LeonardoResponseSchema.safeParse({
        ...RESULT,
        cost: { amount: "0.1047", unit: "DOLLARS" },
        results: [{ ...RESULT.results[0], width: 30, height: 20 }],
      }).success,
    ).toBe(true);
  });

  it("refuses malformed cost reports", () => {
    for (const cost of [
      { amount: "secret", unit: "DOLLARS" },
      { amount: -1, unit: "CREDITS" },
      { amount: 1, unit: "unknown" },
    ]) {
      expect(LeonardoResponseSchema.safeParse({ ...RESULT, cost }).success).toBe(
        false,
      );
    }
  });

  it("parses empty, moderated and URL-less results so the adapter can classify them", () => {
    for (const results of [[], [{ nsfw: true }], [{ blocked: true }], [{}]]) {
      expect(LeonardoResponseSchema.safeParse({ ...RESULT, results }).success).toBe(
        true,
      );
    }
  });

  it("refuses responses without a generation id or results array", () => {
    expect(LeonardoResponseSchema.safeParse({ results: [] }).success).toBe(false);
    expect(LeonardoResponseSchema.safeParse({ id: "generation" }).success).toBe(false);
    expect(LeonardoResponseSchema.safeParse({ id: "", results: [] }).success).toBe(false);
  });

  it("accepts only HTTPS result URLs without embedded credentials", () => {
    expect(LeonardoImageUrlSchema.safeParse("https://cdn.example/a").success).toBe(true);
    for (const url of [
      "http://cdn.example/a",
      "https://user:secret@cdn.example/a",
      "ftp://cdn.example/a",
      "not a url",
    ]) {
      expect(LeonardoImageUrlSchema.safeParse(url).success).toBe(false);
    }
  });
});
