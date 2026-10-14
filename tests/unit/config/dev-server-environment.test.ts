import { describe, expect, it } from "vitest";

import { parseDevServerEnvironment } from "../../../packages/config/src/dev-server-environment";

describe("development browser origin configuration", () => {
  it("allows no extra hosts unless explicitly configured", () => {
    expect(parseDevServerEnvironment({})).toEqual({ DEV_ALLOWED_ORIGINS: [] });
    expect(parseDevServerEnvironment({ DEV_ALLOWED_ORIGINS: "" })).toEqual({ DEV_ALLOWED_ORIGINS: [] });
  });

  it("parses only the configured exact hosts", () => {
    expect(parseDevServerEnvironment({ DEV_ALLOWED_ORIGINS: " tunnel.example, other.example " }))
      .toEqual({ DEV_ALLOWED_ORIGINS: ["tunnel.example", "other.example"] });
  });

  it.each(["*.trycloudflare.com", "https://tunnel.example", "tunnel.example:443", "tunnel.example/path", "user@tunnel.example", "tunnel..example", "-tunnel.example", "tunnel.example?query=1"])("rejects an unsafe host pattern %s", (value) => {
    expect(() => parseDevServerEnvironment({ DEV_ALLOWED_ORIGINS: value })).toThrow(/exact hostnames/);
  });
});
