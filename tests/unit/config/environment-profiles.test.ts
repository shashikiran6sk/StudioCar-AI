import { describe, expect, it } from "vitest";

import {
  ENVIRONMENT_PROFILES,
  getEnvironmentProfile,
} from "../../../packages/config/src/environment-profiles";

describe("environment profiles", () => {
  it("runs Local entirely on the developer's machine except remove.bg", () => {
    expect(getEnvironmentProfile("local")).toMatchObject({
      googleAuthDriver: { default: "fake" },
      phoneOtpDriver: { default: "fake" },
      emailDriver: { default: "mailpit" },
      backgroundRemovalProvider: { default: "removebg" },
      storage: "local-emulator",
      processingQueue: { default: "local-emulator", allowed: ["local-emulator"] },
      emailQueue: { default: "local-emulator", allowed: ["local-emulator"] },
      workerRuntime: "local",
    });
  });

  it("gives Development real external boundaries and local queues", () => {
    expect(getEnvironmentProfile("development")).toMatchObject({
      googleAuthDriver: { default: "google", allowed: ["google"] },
      phoneOtpDriver: { default: "msg91", allowed: ["msg91"] },
      emailDriver: { default: "mailpit" },
      backgroundRemovalProvider: { default: "removebg" },
      storage: "aws-s3",
      processingQueue: { default: "local-emulator" },
      emailQueue: { default: "local-emulator" },
      workerRuntime: "local",
    });
  });

  it("keeps Development able to move its queues to AWS later", () => {
    const development = getEnvironmentProfile("development");

    expect(development.processingQueue.allowed).toContain("aws-sqs");
    expect(development.emailQueue.allowed).toContain("aws-sqs");
  });

  it("deploys production and allows no local adapter", () => {
    expect(getEnvironmentProfile("production")).toEqual({
      googleAuthDriver: { default: "google", allowed: ["google"] },
      phoneOtpDriver: { default: "msg91", allowed: ["msg91"] },
      emailDriver: { default: "resend", allowed: ["resend"] },
      backgroundRemovalProvider: {
        default: "removebg",
        allowed: ["removebg", "fal", "birefnet"],
      },
      storage: "aws-s3",
      processingQueue: { default: "aws-sqs", allowed: ["aws-sqs"] },
      emailQueue: { default: "aws-sqs", allowed: ["aws-sqs"] },
      workerRuntime: "deployed",
    });
  });

  it("allows the fake drivers in Local only", () => {
    for (const [environment, profile] of Object.entries(ENVIRONMENT_PROFILES)) {
      const allowsFake =
        profile.googleAuthDriver.allowed.some((driver) => driver === "fake") ||
        profile.phoneOtpDriver.allowed.some((driver) => driver === "fake");
      expect(allowsFake, environment).toBe(environment === "local");
    }
  });

  it("always defaults to a driver the same profile allows", () => {
    for (const profile of Object.values(ENVIRONMENT_PROFILES)) {
      for (const selection of [
        profile.googleAuthDriver,
        profile.phoneOtpDriver,
        profile.emailDriver,
        profile.backgroundRemovalProvider,
        profile.processingQueue,
        profile.emailQueue,
      ]) {
        expect(selection.allowed).toContain(selection.default);
      }
    }
  });
});
