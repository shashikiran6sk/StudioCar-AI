import { describe, expect, it } from "vitest";

import { isLocalServiceUrl } from "../../../packages/config/src/is-local-service-url";

describe("isLocalServiceUrl", () => {
  it.each([
    "http://localhost:9000",
    "http://127.0.0.1:9324",
    "http://127.10.0.1:9324",
    "http://[::1]:3000",
    "http://minio:9000",
    "http://elasticmq:9324/000000000000/studiocar-images",
    "postgresql://studiocar:studiocar@postgres:5432/studiocar",
    "postgresql://studiocar:studiocar@host.docker.internal:5432/studiocar",
  ])("treats %s as local", (value) => {
    expect(isLocalServiceUrl(value)).toBe(true);
  });

  it.each([
    "https://s3.ap-south-1.amazonaws.com",
    "postgresql://u:p@db.studiocar.example:5432/studiocar",
    "http://localhost.attacker.example",
    "not a url",
  ])("treats %s as not local", (value) => {
    expect(isLocalServiceUrl(value)).toBe(false);
  });
});
