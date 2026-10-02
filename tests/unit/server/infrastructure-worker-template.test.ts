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

function parameterDefault(template: string, name: string): number {
  const block = template.split(`  ${name}:\n`)[1]?.split(/\n  [A-Za-z]+:\n/)[0] ?? "";
  const match = /Default: (\d+)/.exec(block);
  if (!match?.[1]) throw new Error(`No numeric default for ${name}.`);
  return Number(match[1]);
}

describe("Leonardo worker deployment", () => {
  it("has one provider credential and no provider selection", () => {
    expect(workerTemplate).toContain(
      "LEONARDO_API_KEY: !Sub '{{resolve:secretsmanager:${LeonardoSecretArn}:SecretString:LEONARDO_API_KEY}}'",
    );
    for (const retired of [
      "BackgroundRemovalProvider",
      "BACKGROUND_REMOVAL_PROVIDER",
      "RemoveBgSecretArn",
      "REMOVEBG",
      "FAL_KEY",
      "BIREFNET",
    ]) {
      expect(workerTemplate).not.toContain(retired);
    }
  });

  it("lets an attempt finish composing and storing inside its lease, the Lambda and the queue visibility", () => {
    const lambdaTimeoutMilliseconds = parameterDefault(workerTemplate, "TimeoutSeconds") * 1_000;
    const leonardoMilliseconds = parameterDefault(workerTemplate, "LeonardoTimeoutMilliseconds");
    const leaseMilliseconds = parameterDefault(workerTemplate, "ClaimLeaseMilliseconds");
    const visibilityMilliseconds =
      parameterDefault(queueTemplate, "VisibilityTimeoutSeconds") * 1_000;

    expect(leonardoMilliseconds + 30_000).toBeLessThanOrEqual(lambdaTimeoutMilliseconds);
    expect(lambdaTimeoutMilliseconds).toBeLessThanOrEqual(leaseMilliseconds);
    expect(leaseMilliseconds).toBeLessThan(visibilityMilliseconds);
    expect(workerTemplate).toContain("IMAGE_WORKER_CLAIM_TTL_MS: !Ref ClaimLeaseMilliseconds");
    expect(workerTemplate).toContain("LEONARDO_TIMEOUT_MS: !Ref LeonardoTimeoutMilliseconds");
  });

  it("keeps Leonardo concurrency at the existing event-source bound", () => {
    expect(parameterDefault(workerTemplate, "MaximumConcurrency")).toBe(10);
    expect(parameterDefault(workerTemplate, "EventSourceBatchSize")).toBe(1);
  });

  it("alarms on the worker duration before the Lambda timeout", () => {
    expect(parameterDefault(workerTemplate, "WorkerDurationAlarmMilliseconds")).toBeLessThan(
      parameterDefault(workerTemplate, "TimeoutSeconds") * 1_000,
    );
  });
});

describe("provider observability", () => {
  const observabilityTemplate = readFileSync(
    resolve(process.cwd(), "../../infrastructure/aws/observability.yml"),
    "utf8",
  );

  it("alarms on the metrics the Leonardo adapter emits, and on no retired provider", () => {
    for (const metric of [
      "MetricName: ProviderRateLimitedResponseCount",
      "MetricName: ProviderServerErrorResponseCount",
      "MetricName: ProviderTimeoutCount",
      "MetricName: ProviderRequestCount",
      "MetricName: ProviderFailureCount",
    ]) {
      expect(observabilityTemplate).toContain(metric);
    }
    expect(observabilityTemplate).not.toMatch(/removebg|remove\.bg|RemoveBg/i);
  });
});
