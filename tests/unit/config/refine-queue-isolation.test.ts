import { describe, expect, it } from "vitest";

import { refineQueueIsolation } from "../../../packages/config/src/refine-queue-isolation";
import { refinementIssues } from "./environment-fixtures";

const LOCAL_QUEUE = "http://localhost:9324/000000000000/studiocar-images";
const AWS_QUEUE = "https://sqs.ap-south-1.amazonaws.com/123456789012/studiocar-images";

describe("refineQueueIsolation", () => {
  it("keeps Local on ElasticMQ", () => {
    expect(
      refinementIssues(refineQueueIsolation, {
        APP_ENV: "local",
        SQS_ENDPOINT: "http://localhost:9324",
        SQS_IMAGE_QUEUE_URL: LOCAL_QUEUE,
      }),
    ).toEqual([]);
    expect(
      refinementIssues(refineQueueIsolation, {
        APP_ENV: "local",
        SQS_IMAGE_QUEUE_URL: AWS_QUEUE,
      }),
    ).toEqual([expect.stringMatching(/must address local ElasticMQ/)]);
  });

  it("keeps Development on AWS SQS", () => {
    expect(
      refinementIssues(refineQueueIsolation, {
        APP_ENV: "development",
        SQS_IMAGE_QUEUE_URL: AWS_QUEUE,
      }),
    ).toEqual([]);
    for (const queueUrl of [
      LOCAL_QUEUE,
      "http://elasticmq:9324/000000000000/studiocar-images",
    ]) {
      expect(
        refinementIssues(refineQueueIsolation, {
          APP_ENV: "development",
          SQS_IMAGE_QUEUE_URL: queueUrl,
        }),
      ).toEqual([expect.stringMatching(/in development; local ElasticMQ is refused/)]);
    }
  });

  it("refuses a production queue in Development", () => {
    expect(
      refinementIssues(refineQueueIsolation, {
        APP_ENV: "development",
        SQS_IMAGE_QUEUE_URL:
          "https://sqs.ap-south-1.amazonaws.com/123456789012/studiocar-prod-images",
      }),
    ).toEqual([expect.stringMatching(/names a production queue/)]);
  });

  it("refuses ElasticMQ and localhost queues in production", () => {
    for (const queueUrl of [
      LOCAL_QUEUE,
      "http://elasticmq:9324/000000000000/studiocar-images",
    ]) {
      expect(
        refinementIssues(refineQueueIsolation, {
          APP_ENV: "production",
          SQS_IMAGE_QUEUE_URL: queueUrl,
        }),
      ).toEqual([expect.stringMatching(/local ElasticMQ is refused/)]);
    }
  });

  it("refuses a local endpoint and emulator key beside AWS queues in production", () => {
    expect(
      refinementIssues(refineQueueIsolation, {
        APP_ENV: "production",
        SQS_ENDPOINT: "http://localhost:9324",
        SQS_ACCESS_KEY_ID: "studiocarlocal",
        SQS_IMAGE_QUEUE_URL: AWS_QUEUE,
      }),
    ).toEqual([
      expect.stringMatching(/SQS_ENDPOINT must be an AWS SQS queue/),
      expect.stringMatching(/local emulator key/),
    ]);
  });

  it("refuses a non-production queue name and a plain-http queue in production", () => {
    expect(
      refinementIssues(refineQueueIsolation, {
        APP_ENV: "production",
        SQS_IMAGE_QUEUE_URL:
          "https://sqs.ap-south-1.amazonaws.com/123456789012/studiocar-dev-images",
      }),
    ).toEqual([expect.stringMatching(/declares a non-production environment/)]);
    expect(
      refinementIssues(refineQueueIsolation, {
        APP_ENV: "production",
        SQS_IMAGE_QUEUE_URL: "http://queue.studiocar.example/images",
      }),
    ).toEqual([expect.stringMatching(/SQS_IMAGE_QUEUE_URL must be an AWS SQS queue/)]);
  });
});
