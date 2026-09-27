import { expect, it } from "vitest";
import { createLeonardoRequest } from "../../../../../workers/image-processing/src/providers/create-leonardo-request";

it.each(["preview", "full", "50MP"] satisfies ("preview" | "full" | "50MP")[])(
  "changes only the requested resolution for %s",
  (size) => {
    expect(
      createLeonardoRequest("https://source.example/a.jpg", size),
    ).toMatchObject({
      parameters: {
        size,
        type: "car",
        format: "webp",
        channels: "rgba",
        shadow_type: "none",
        semitransparency: true,
      },
      ephemeral: true,
      public: false,
    });
  },
);
