import { describe, expect, it } from "vitest";

import { parseImageWorkerEnvironment } from "../../../../../packages/config/src/environment";
import { LeonardoProvider } from "../../../../../workers/image-processing/src/providers/leonardo-provider";
import { createImageProcessingProvider } from "../../../../../workers/image-processing/src/runtime/create-image-processing-provider";

const environment = parseImageWorkerEnvironment({
  APP_ENV: "development",
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/studiocar_test",
  AWS_REGION: "ap-south-1",
  S3_BUCKET: "studiocar-assets-test",
  LEONARDO_API_KEY: "leonardo-key",
});

describe("createImageProcessingProvider", () => {
  it("creates the Leonardo adapter behind the provider port", () => {
    const provider = createImageProcessingProvider(environment, () =>
      Promise.resolve("https://source.example/image.jpg"),
    );
    expect(provider).toBeInstanceOf(LeonardoProvider);
    expect(provider.key).toBe("LEONARDO");
  });
});
