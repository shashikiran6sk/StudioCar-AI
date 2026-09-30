import { describe, expect, it } from "vitest";

import { createLeonardoRequest } from "../../../../../workers/image-processing/src/providers/create-leonardo-request";

const SOURCE = "https://bucket.s3.ap-south-1.amazonaws.com/users/u/source.jpg?X-Amz-Signature=s";

describe("createLeonardoRequest", () => {
  it("asks Leonardo for a private, ephemeral transparent car with its own car shadow", () => {
    expect(createLeonardoRequest(SOURCE, "auto")).toEqual({
      model: "remove-bg",
      public: false,
      ephemeral: true,
      parameters: {
        size: "auto",
        type: "car",
        format: "webp",
        channels: "rgba",
        crop: false,
        shadow_type: "car",
        semitransparency: true,
        guidances: {
          image_reference: [{ image: { type: "URL", url: SOURCE } }],
        },
      },
    });
  });

  it.each(["preview", "auto"] as const)("changes only the size for %s", (size) => {
    const request = createLeonardoRequest(SOURCE, size);
    expect(request.parameters.size).toBe(size);
    expect({ ...request.parameters, size: "auto" }).toEqual(
      createLeonardoRequest(SOURCE, "auto").parameters,
    );
  });

  it("never asks Leonardo to choose a background", () => {
    const body = JSON.stringify(createLeonardoRequest(SOURCE, "preview"));
    expect(body).not.toContain("background_image_reference");
    expect(body).not.toContain("background");
  });
});
