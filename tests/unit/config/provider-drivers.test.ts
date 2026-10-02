import { describe, expect, it } from "vitest";

import {
  GoogleAuthDriverSchema,
  PhoneOtpDriverSchema,
  QueueTarget,
  StorageTarget,
  WorkerRuntime,
} from "../../../packages/config/src/provider-drivers";

describe("provider drivers", () => {
  it("offers a fake and a real driver for each sign-in method", () => {
    expect(GoogleAuthDriverSchema.options).toEqual(["google", "fake"]);
    expect(PhoneOtpDriverSchema.options).toEqual(["msg91", "fake"]);
  });

  it("offers no background-removal selection: Leonardo is the only provider", async () => {
    const drivers: Record<string, unknown> = await import(
      "../../../packages/config/src/provider-drivers"
    );
    expect(Object.keys(drivers)).not.toContain("BackgroundRemovalProviderSchema");
  });

  it("refuses a driver that does not exist", () => {
    expect(GoogleAuthDriverSchema.safeParse("github").success).toBe(false);
  });

  it("names the infrastructure targets", () => {
    expect(Object.values(StorageTarget)).toEqual(["local-emulator", "aws-s3"]);
    expect(Object.values(QueueTarget)).toEqual(["local-emulator", "aws-sqs"]);
    expect(Object.values(WorkerRuntime)).toEqual(["local", "deployed"]);
  });
});
