import { describe, expect, it, vi } from "vitest";

import { AdminBootstrapService } from "../../../../apps/web/src/server/admin/admin-bootstrap-service";

const now = new Date("2026-09-22T10:00:00.000Z");

function service(bootstrapEmail: string | undefined, bootstrap = vi.fn()) {
  const store = { bootstrap };
  return {
    store,
    service: new AdminBootstrapService(store, { bootstrapEmail }),
  };
}

describe("AdminBootstrapService", () => {
  it("grants when a configured email matches a Google-verified one", async () => {
    const { service: subject, store } = service(
      "owner@example.com",
      vi.fn(async () => ({ kind: "BOOTSTRAPPED" as const })),
    );

    await expect(
      subject.evaluate("user-1", "owner@example.com", now),
    ).resolves.toEqual({ kind: "BOOTSTRAPPED" });
    expect(store.bootstrap).toHaveBeenCalledWith("user-1", now);
  });

  it("matches case and surrounding whitespace insensitively", async () => {
    const { service: subject, store } = service(
      "  Owner@Example.COM ",
      vi.fn(async () => ({ kind: "BOOTSTRAPPED" as const })),
    );

    await subject.evaluate("user-1", "OWNER@example.com", now);

    expect(store.bootstrap).toHaveBeenCalled();
  });

  it("does nothing for a different verified email", async () => {
    const { service: subject, store } = service("owner@example.com");

    await expect(
      subject.evaluate("user-2", "someone-else@example.com", now),
    ).resolves.toBeNull();
    expect(store.bootstrap).not.toHaveBeenCalled();
  });

  it("does nothing when no bootstrap email is configured", async () => {
    const { service: subject, store } = service(undefined);

    await expect(
      subject.evaluate("user-1", "owner@example.com", now),
    ).resolves.toBeNull();
    expect(store.bootstrap).not.toHaveBeenCalled();
  });

  it("does not treat a Gmail alias as the configured address", async () => {
    const { service: subject, store } = service("owner@gmail.com");

    await expect(
      subject.evaluate("user-1", "o.wner@gmail.com", now),
    ).resolves.toBeNull();
    expect(store.bootstrap).not.toHaveBeenCalled();
  });

  it("defers to the store once the one-time grant is spent", async () => {
    const { service: subject } = service(
      "owner@example.com",
      vi.fn(async () => ({ kind: "ALREADY_COMPLETED" as const })),
    );

    await expect(
      subject.evaluate("user-1", "owner@example.com", now),
    ).resolves.toEqual({ kind: "ALREADY_COMPLETED" });
  });
});
