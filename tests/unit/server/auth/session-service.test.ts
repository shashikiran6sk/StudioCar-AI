import { describe, expect, it, vi } from "vitest";

import {
  createSecureSessionToken,
  hashSessionToken,
  SessionService,
  type ActiveSession,
  type SessionStore,
} from "../../../../apps/web/src/server/auth/session-service";

const now = new Date("2026-09-18T12:00:00.000Z");
const currentToken = "a".repeat(43);
const nextToken = "b".repeat(43);

function activeSession(id = "session-1"): ActiveSession {
  return {
    id,
    userId: "user-1",
    expiresAt: new Date("2026-10-18T12:00:00.000Z"),
    user: {
      id: "user-1",
      displayName: "Studio Dealer",
      primaryEmail: "dealer@studiocar.test",
      primaryPhone: null,
    },
  };
}

function sessionStore(): SessionStore {
  return {
    create: vi.fn(async () => activeSession()),
    findActiveByTokenHash: vi.fn(async () => activeSession()),
    rotate: vi.fn(async () => activeSession("session-2")),
    revokeByTokenHash: vi.fn(async () => true),
    revokeAllForUser: vi.fn(async () => 2),
  };
}

describe("SessionService", () => {
  it("issues a high-entropy token but stores only its hash", async () => {
    const store = sessionStore();
    const service = new SessionService(store, {
      now: () => now,
      generateToken: () => currentToken,
      ttlMs: 60_000,
    });

    const issued = await service.issue("user-1");

    expect(issued.token).toBe(currentToken);
    expect(issued.expiresAt).toEqual(new Date("2026-09-18T12:01:00.000Z"));
    expect(store.create).toHaveBeenCalledWith({
      userId: "user-1",
      tokenHash: hashSessionToken(currentToken),
      expiresAt: issued.expiresAt,
    });
    expect(JSON.stringify(vi.mocked(store.create).mock.calls)).not.toContain(currentToken);
  });

  it("rejects malformed tokens without touching persistence", async () => {
    const store = sessionStore();
    const service = new SessionService(store, { now: () => now });

    await expect(service.authenticate("not-a-session-token")).resolves.toBeNull();
    expect(store.findActiveByTokenHash).not.toHaveBeenCalled();
  });

  it("rotates an active session using a fresh hash", async () => {
    const store = sessionStore();
    const service = new SessionService(store, {
      now: () => now,
      generateToken: () => nextToken,
      ttlMs: 60_000,
    });

    const rotated = await service.rotate(currentToken);

    expect(rotated?.token).toBe(nextToken);
    expect(store.rotate).toHaveBeenCalledWith({
      currentSessionId: "session-1",
      userId: "user-1",
      tokenHash: hashSessionToken(nextToken),
      expiresAt: new Date("2026-09-18T12:01:00.000Z"),
      now,
    });
  });

  it("generates URL-safe 256-bit tokens and stable SHA-256 hashes", () => {
    const token = createSecureSessionToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hashSessionToken(token)).toMatch(/^[a-f0-9]{64}$/);
  });
});
