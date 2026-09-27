import { expect, it } from "vitest";
import {
  LeonardoResponseSchema,
  LeonardoSizeSchema,
} from "../../../packages/contracts/src/leonardo";

it("validates optional dimensions/cost and refuses invalid result contracts", () => {
  const result = {
    id: "generation",
    results: [
      { url: "https://cdn.example/image.webp", contentType: "image/webp" },
    ],
  };
  expect(LeonardoResponseSchema.safeParse(result).success).toBe(true);
  expect(
    LeonardoResponseSchema.safeParse({
      ...result,
      cost: { amount: "0.1047", unit: "DOLLARS" },
    }).success,
  ).toBe(true);
  for (const cost of [
    { amount: "secret", unit: "DOLLARS" },
    { amount: -1, unit: "CREDITS" },
    { amount: 1, unit: "unknown" },
  ]) {
    expect(LeonardoResponseSchema.safeParse({ ...result, cost }).success).toBe(
      false,
    );
  }
  expect(
    LeonardoResponseSchema.safeParse({ ...result, results: [] }).success,
  ).toBe(false);
  expect(
    LeonardoResponseSchema.safeParse({
      ...result,
      results: [
        { url: "https://user:secret@cdn.example/a", contentType: "image/webp" },
      ],
    }).success,
  ).toBe(false);
  expect(LeonardoSizeSchema.options).toEqual(["preview", "full", "50MP"]);
});
