import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  LOCAL_INFRASTRUCTURE,
  LOCAL_SERVICE_HOSTNAMES,
} from "../../../packages/config/src/local-infrastructure";

const repositoryRoot = path.resolve(import.meta.dirname, "../../..");
const read = (relative: string): string =>
  readFileSync(path.join(repositoryRoot, relative), "utf8");

const COMPOSE_SERVICE_PATTERN = /^ {2}([a-z][a-z0-9-]*):$/;
const COMPOSE_PROFILES_PATTERN = /^ {4}profiles: \[([^\]]*)\]$/;

/** The compose services, in file order, that the given profile starts. */
function composeServicesInProfile(compose: string, profile: string): string[] {
  const services: string[] = [];
  let service: string | undefined;
  for (const line of compose.split("\n")) {
    service = COMPOSE_SERVICE_PATTERN.exec(line)?.[1] ?? service;
    const profiles = COMPOSE_PROFILES_PATTERN.exec(line)?.[1];
    if (
      service !== undefined &&
      profiles?.split(",").map((name) => name.trim()).includes(profile)
    ) {
      services.push(service);
    }
  }
  return services;
}

/**
 * The compose file and the dispatch ticker cannot import TypeScript, so they
 * carry the local values literally. These checks keep them in step with the
 * one canonical description.
 */
describe("LOCAL_INFRASTRUCTURE", () => {
  const compose = read("infrastructure/local/docker-compose.yml");

  it("matches the credentials the compose services are created with", () => {
    expect(compose).toContain(`POSTGRES_USER: ${LOCAL_INFRASTRUCTURE.databaseUser}`);
    expect(compose).toContain(
      `POSTGRES_PASSWORD: ${LOCAL_INFRASTRUCTURE.databasePassword}`,
    );
    expect(compose).toContain(`POSTGRES_DB: ${LOCAL_INFRASTRUCTURE.databaseName}`);
    expect(compose).toContain(
      `MINIO_ROOT_USER: ${LOCAL_INFRASTRUCTURE.emulatorAccessKeyId}`,
    );
    expect(compose).toContain(
      `MINIO_ROOT_PASSWORD: ${LOCAL_INFRASTRUCTURE.emulatorSecretAccessKey}`,
    );
    expect(compose).toContain(`S3_BUCKET: ${LOCAL_INFRASTRUCTURE.storageBucket}`);
    expect(compose).toContain(`AWS_REGION: ${LOCAL_INFRASTRUCTURE.awsRegion}`);
  });

  it("matches the dispatcher's token, which the application must accept", () => {
    expect(compose).toContain(
      `\${PROCESSING_DISPATCH_TOKEN:-${LOCAL_INFRASTRUCTURE.processingDispatchToken}}`,
    );
  });

  it("runs no mail service, email worker, or email setting", () => {
    expect(compose).not.toMatch(/mailpit|email|EMAIL_|RESEND/i);
  });

  it("matches the only queue ElasticMQ creates", () => {
    const queues = read("infrastructure/local/elasticmq.conf");

    expect(queues).toContain(`${LOCAL_INFRASTRUCTURE.imageQueueName} {`);
    expect(queues).not.toContain("email");
    expect(LOCAL_INFRASTRUCTURE.imageQueueUrl).toBe(
      `${LOCAL_INFRASTRUCTURE.queueEndpoint}/000000000000/${LOCAL_INFRASTRUCTURE.imageQueueName}`,
    );
  });

  it("builds its database address from its own parts", () => {
    const url = new URL(LOCAL_INFRASTRUCTURE.databaseUrl);

    expect(url.username).toBe(LOCAL_INFRASTRUCTURE.databaseUser);
    expect(url.password).toBe(LOCAL_INFRASTRUCTURE.databasePassword);
    expect(url.pathname).toBe(`/${LOCAL_INFRASTRUCTURE.databaseName}`);
  });

  it("uses local tokens long enough to satisfy every token rule", () => {
    for (const token of [
      LOCAL_INFRASTRUCTURE.sessionSecret,
      LOCAL_INFRASTRUCTURE.processingDispatchToken,
      LOCAL_INFRASTRUCTURE.lifecycleCleanupToken,
      LOCAL_INFRASTRUCTURE.storageCleanupToken,
    ]) {
      expect(token.length).toBeGreaterThanOrEqual(32);
    }
  });

  it("runs only the image worker and dispatcher under APP_ENV=development", () => {
    expect(composeServicesInProfile(compose, "development")).toEqual([
      "image-worker",
      "dispatcher",
    ]);
    expect(composeServicesInProfile(compose, "infra")).toContain("elasticmq");
  });

  it("knows the compose service hosts as local", () => {
    for (const host of ["postgres", "minio", "elasticmq", "localhost"]) {
      expect(LOCAL_SERVICE_HOSTNAMES.has(host)).toBe(true);
    }
  });
});
