import { randomBytes } from "node:crypto";
import type { AuthUser } from "@studiocar/contracts";

import { hashAuthSecret } from "./hash-auth-secret";

const SESSION_TOKEN_BYTES = 32;
const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const DEFAULT_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1_000;

export type SessionUser = AuthUser;

export interface ActiveSession {
  id: string;
  userId: string;
  expiresAt: Date;
  user: SessionUser;
}

export interface SessionStore {
  create(command: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<ActiveSession>;
  findActiveByTokenHash(tokenHash: string, now: Date): Promise<ActiveSession | null>;
  rotate(command: {
    currentSessionId: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    now: Date;
  }): Promise<ActiveSession | null>;
  revokeByTokenHash(tokenHash: string, revokedAt: Date): Promise<boolean>;
  revokeAllForUser(userId: string, revokedAt: Date): Promise<number>;
}

export interface IssuedSession {
  token: string;
  expiresAt: Date;
  session: ActiveSession;
}

export interface PreparedSession {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface SessionServiceOptions {
  now?: () => Date;
  generateToken?: () => string;
  ttlMs?: number;
}

export function createSecureSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return hashAuthSecret(token);
}

function isSessionToken(token: string): boolean {
  return SESSION_TOKEN_PATTERN.test(token);
}

export class SessionService {
  private readonly now: () => Date;
  private readonly generateToken: () => string;
  private readonly ttlMs: number;

  public constructor(
    private readonly store: SessionStore,
    options: SessionServiceOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.generateToken = options.generateToken ?? createSecureSessionToken;
    this.ttlMs = options.ttlMs ?? DEFAULT_SESSION_TTL_MS;

    if (!Number.isSafeInteger(this.ttlMs) || this.ttlMs <= 0) {
      throw new RangeError("Session TTL must be a positive safe integer.");
    }
  }

  public async issue(userId: string): Promise<IssuedSession> {
    const prepared = this.prepareIssue();
    const session = await this.store.create({
      userId,
      tokenHash: prepared.tokenHash,
      expiresAt: prepared.expiresAt,
    });

    return {
      token: prepared.token,
      expiresAt: prepared.expiresAt,
      session,
    };
  }

  public prepareIssue(): PreparedSession {
    const token = this.nextToken();
    return {
      token,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(this.now().getTime() + this.ttlMs),
    };
  }

  public async authenticate(token: string): Promise<ActiveSession | null> {
    if (!isSessionToken(token)) return null;
    return this.store.findActiveByTokenHash(hashSessionToken(token), this.now());
  }

  public async rotate(token: string): Promise<IssuedSession | null> {
    const current = await this.authenticate(token);
    if (!current) return null;

    const now = this.now();
    const nextToken = this.nextToken();
    const expiresAt = new Date(now.getTime() + this.ttlMs);
    const session = await this.store.rotate({
      currentSessionId: current.id,
      userId: current.userId,
      tokenHash: hashSessionToken(nextToken),
      expiresAt,
      now,
    });

    return session ? { token: nextToken, expiresAt, session } : null;
  }

  public async logout(token: string): Promise<boolean> {
    if (!isSessionToken(token)) return false;
    return this.store.revokeByTokenHash(hashSessionToken(token), this.now());
  }

  public async logoutEverywhere(userId: string): Promise<number> {
    return this.store.revokeAllForUser(userId, this.now());
  }

  private nextToken(): string {
    const token = this.generateToken();

    if (!isSessionToken(token)) {
      throw new Error("Session token generator returned an invalid token.");
    }

    return token;
  }
}
