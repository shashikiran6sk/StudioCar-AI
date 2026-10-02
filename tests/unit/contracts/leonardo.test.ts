import { describe, expect, it } from "vitest";

import {
  LeonardoImageUrlSchema,
  LeonardoResponseSchema,
  LeonardoSizeSchema,
} from "../../../packages/contracts/src/leonardo";

/** The shape of a real Sync response (preview size), with its URL replaced. */
const SYNC_RESPONSE = {
  generateSync: {
    id: "1f1bd66e-a239-63b0-b0d2-67feb1c0e328",
    blockedCount: 0,
    cost: { amount: "0.0269", unit: "DOLLARS" },
    results: [
      {
        contentType: "image/webp",
        url: "https://leonardoai-generations-temporary-assets-prod.s3.us-east-1.amazonaws.com/ephemeral/remove-bg_-0.webp?X-Amz-Signature=placeholder",
        dataB64: null,
        width: 620,
        height: 403,
      },
    ],
  },
};

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

  it("reads the generation inside the Sync API's generateSync envelope", () => {
    expect(LeonardoResponseSchema.parse(SYNC_RESPONSE)).toEqual({
      id: "1f1bd66e-a239-63b0-b0d2-67feb1c0e328",
      blockedCount: 0,
      cost: { amount: "0.0269", unit: "DOLLARS" },
      results: [
        {
          contentType: "image/webp",
          url: SYNC_RESPONSE.generateSync.results[0]?.url,
          width: 620,
          height: 403,
        },
      ],
    });
  });

  it("drops malformed cost reports instead of discarding the paid result", () => {
    for (const cost of [
      { amount: "secret", unit: "DOLLARS" },
      { amount: -1, unit: "CREDITS" },
      { amount: 1, unit: "unknown" },
      null,
    ]) {
      const parsed = LeonardoResponseSchema.safeParse({ ...RESULT, cost });
      expect(parsed.success).toBe(true);
      expect(parsed.data?.cost ?? null).toBeNull();
    }
  });

  it("reads missing, null or mistyped optional fields as absent", () => {
    const parsed = LeonardoResponseSchema.parse({
      id: null,
      blockedCount: "0",
      results: [
        {
          url: RESULT.results[0]?.url,
          contentType: null,
          width: "620",
          height: -1,
          nsfw: null,
          blocked: "no",
          dataB64: null,
        },
      ],
    });
    const [result] = parsed.results;
    expect(parsed.id ?? null).toBeNull();
    expect(parsed.blockedCount ?? null).toBeNull();
    expect(result?.url).toBe(RESULT.results[0]?.url);
    for (const field of [
      result?.contentType,
      result?.width,
      result?.height,
      result?.nsfw,
      result?.blocked,
    ]) {
      expect(field ?? null).toBeNull();
    }
  });

  it("parses empty, moderated and URL-less results so the adapter can classify them", () => {
    for (const results of [[], [{ nsfw: true }], [{ blocked: true }], [{}]]) {
      expect(LeonardoResponseSchema.safeParse({ ...RESULT, results }).success).toBe(
        true,
      );
    }
  });

  it("reads an absent results array as no results", () => {
    expect(LeonardoResponseSchema.parse({ id: "generation" }).results).toEqual([]);
    expect(LeonardoResponseSchema.parse({ generateSync: {} }).results).toEqual([]);
  });

  it("refuses bodies that are not a generation", () => {
    for (const body of [null, "text", [RESULT], { results: "x" }, { generateSync: { results: 1 } }]) {
      expect(LeonardoResponseSchema.safeParse(body).success).toBe(false);
    }
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
