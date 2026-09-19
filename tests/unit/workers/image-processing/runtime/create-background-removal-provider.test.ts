import { describe, expect, it } from "vitest";

import { parseImageWorkerEnvironment } from "../../../../../packages/config/src/environment";
import { createBackgroundRemovalProvider } from "../../../../../workers/image-processing/src/runtime/create-background-removal-provider";

const baseEnvironment = {
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/studiocar_test",
  AWS_REGION: "ap-south-1",
  S3_BUCKET: "studiocar-assets-test",
  BACKGROUND_REMOVAL_PROVIDER: "removebg",
  REMOVEBG_API_KEY: "remove-bg-key",
} satisfies Record<string, string>;

describe("createBackgroundRemovalProvider", () => {
  it("creates the configured remove.bg adapter", () => {
    const provider = createBackgroundRemovalProvider(
      parseImageWorkerEnvironment(baseEnvironment),
    );

    expect(provider.key).toBe("REMOVEBG");
  });

  it.each([
    ["fal", { FAL_KEY: "fal-key" }, "fal.ai"],
    [
      "birefnet",
      { SELF_HOSTED_BIREFNET_ENDPOINT: "https://birefnet.example" },
      "BiRefNet",
    ],
  ])("fails closed for an unimplemented %s adapter", (key, credential, message) => {
    const environment = parseImageWorkerEnvironment({
      ...baseEnvironment,
      ...credential,
      BACKGROUND_REMOVAL_PROVIDER: key,
      REMOVEBG_API_KEY: undefined,
    });

    expect(() => createBackgroundRemovalProvider(environment)).toThrow(message);
  });
});
