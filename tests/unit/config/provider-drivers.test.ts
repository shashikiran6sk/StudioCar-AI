import { describe, expect, it } from "vitest";

import {
  BackgroundRemovalProviderSchema,
  EmailDriverSchema,
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

  it("keeps the existing email and background-removal choices", () => {
    expect(EmailDriverSchema.options).toEqual(["resend", "mailpit"]);
    expect(BackgroundRemovalProviderSchema.options).toEqual([
      "removebg",
      "fal",
      "birefnet",
    ]);
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
