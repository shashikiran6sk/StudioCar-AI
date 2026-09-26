import { expect, it } from "vitest";
import { readRemoveBgCredits } from "../../../../../workers/image-processing/src/providers/read-remove-bg-credits";
it.each(["0", "0.25", "1", "2.5"])(
  "accepts reported fractional credits %s",
  (value) => {
    expect(
      readRemoveBgCredits(new Headers({ "x-credits-charged": value })),
    ).toBe(Number(value));
  },
);
it.each(["", "-1", "NaN", "Infinity", "1 credit", "1e999"])(
  "drops malformed credits %s",
  (value) => {
    expect(
      readRemoveBgCredits(new Headers({ "x-credits-charged": value })),
    ).toBeUndefined();
  },
);
