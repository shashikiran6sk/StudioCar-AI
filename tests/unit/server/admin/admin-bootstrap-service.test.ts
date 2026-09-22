import { describe, expect, it, vi } from "vitest";

import { AdminBootstrapService } from "../../../../apps/web/src/server/admin/admin-bootstrap-service";

const now = new Date("2026-09-22T10:00:00.000Z");

function service(
  bootstrapEmail: string | undefined,
  bootstrap = vi.fn(),
  acceptForVerifiedEmail = vi.fn(async () => false),
) {
  const store = { bootstrap };
  const invitations = { acceptForVerifiedEmail };
  return {
    store,
    invitations,
    service: new AdminBootstrapService(store, invitations, { bootstrapEmail }),
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

describe("AdminBootstrapService invitations", () => {
  it("accepts a pending invitation for the verified address", async () => {
    const accept = vi.fn(async () => true);
    const { service: subject, store } = service(
      undefined,
      vi.fn(),
      accept,
    );

    await expect(
      subject.evaluate("user-1", "Invited@Example.com", now),
    ).resolves.toEqual({ kind: "BOOTSTRAPPED" });
    // The address is normalised before it is matched.
    expect(accept).toHaveBeenCalledWith({
      userId: "user-1",
      email: "invited@example.com",
      now,
    });
    // An accepted invitation makes the bootstrap question moot.
    expect(store.bootstrap).not.toHaveBeenCalled();
  });

  it("checks invitations before bootstrap, so an invited admin is still granted", async () => {
    const { service: subject, store } = service(
      "owner@example.com",
      vi.fn(async () => ({ kind: "ALREADY_COMPLETED" as const })),
      vi.fn(async () => true),
    );

    await expect(
      subject.evaluate("user-2", "invited@example.com", now),
    ).resolves.toEqual({ kind: "BOOTSTRAPPED" });
    expect(store.bootstrap).not.toHaveBeenCalled();
  });

  it("falls through to bootstrap when no invitation matches", async () => {
    const { service: subject, store } = service(
      "owner@example.com",
      vi.fn(async () => ({ kind: "BOOTSTRAPPED" as const })),
      vi.fn(async () => false),
    );

    await expect(
      subject.evaluate("user-3", "owner@example.com", now),
    ).resolves.toEqual({ kind: "BOOTSTRAPPED" });
    expect(store.bootstrap).toHaveBeenCalled();
  });
});
