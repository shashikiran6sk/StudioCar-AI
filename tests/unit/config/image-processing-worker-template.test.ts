import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(import.meta.dirname, "../../..");
const template = readFileSync(
  path.join(repositoryRoot, "infrastructure/aws/image-processing-worker.yml"),
  "utf8",
);

/** The lines of the IAM statement that begins with the given Sid. */
function statement(sid: string): string {
  const lines = template.split("\n");
  const start = lines.findIndex((line) => line.trim() === `- Sid: ${sid}`);
  if (start === -1) return "";
  const next = lines.findIndex(
    (line, index) => index > start && line.trim().startsWith("- Sid: "),
  );
  return lines.slice(start, next === -1 ? undefined : next).join("\n");
}

describe("image-processing worker template", () => {
  it("lets the worker tell an absent private object from denied storage", () => {
    const listing = statement("DistinguishMissingPrivateImages");

    expect(listing).toContain("Action: s3:ListBucket");
    expect(listing).toContain(
      "Resource: !Sub arn:${AWS::Partition}:s3:::${ImageBucketName}\n",
    );
    expect(listing).toContain("s3:prefix: users/*");
  });

  it("keeps object reads and writes within the tenant prefix", () => {
    const objects = statement("ReadWritePrivateImages");

    expect(objects).toContain(
      "Resource: !Sub arn:${AWS::Partition}:s3:::${ImageBucketName}/users/*",
    );
    expect(objects).not.toContain("s3:DeleteObject");
  });
});
