import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workerTemplate = readFileSync(
  resolve(process.cwd(), "../../infrastructure/aws/image-processing-worker.yml"),
  "utf8",
);
const queueTemplate = readFileSync(
  resolve(process.cwd(), "../../infrastructure/aws/image-processing-queue.yml"),
  "utf8",
);

describe("worker deployment throughput defaults", () => {
  it("isolates expensive records and does not wait to fill a batch", () => {
    expect(workerTemplate).toContain("Default: 1");
    expect(workerTemplate).toContain("Default: 0");
    expect(workerTemplate).toContain("BatchSize: !Ref EventSourceBatchSize");
    expect(workerTemplate).toContain(
      "MaximumBatchingWindowInSeconds: !Ref EventSourceMaximumBatchingWindowSeconds",
    );
  });

  it("keeps queue visibility above the source worker timeout", () => {
    expect(queueTemplate).toContain("Default: 900");
    expect(queueTemplate).toContain("Description: Must exceed the Lambda timeout");
  });

  it("allows missing-object detection on only the image bucket", () => {
    const detectionPolicy = workerTemplate.split(
      "- Sid: DetectMissingPrivateImages",
    )[1]?.split("- Sid: ReadWritePrivateImages")[0];
    expect(detectionPolicy).toContain("Effect: Allow");
    expect(detectionPolicy).toContain("- s3:ListBucket");
    expect(detectionPolicy).toContain(
      "Resource: !Sub arn:${AWS::Partition}:s3:::${ImageBucketName}",
    );
    expect(detectionPolicy).not.toContain("Condition:");
    expect(detectionPolicy).not.toContain("s3:*");
    expect(workerTemplate).toContain(
      "Resource: !Sub arn:${AWS::Partition}:s3:::${ImageBucketName}/users/*",
    );
  });
});
