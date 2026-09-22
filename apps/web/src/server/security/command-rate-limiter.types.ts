import type { CommandRateLimitScope } from "@studiocar/database-runtime";
import type { ConsumeCommandRateLimitCommand, ConsumeCommandRateLimitResult } from "../db/repositories/command-rate-limit-repository";

export interface CommandRateLimitRepositoryPort {
  consume(
    command: ConsumeCommandRateLimitCommand,
  ): Promise<ConsumeCommandRateLimitResult>;
}

export interface CommandRateLimitPolicy {
  scope: CommandRateLimitScope;
  maximumRequests: number;
  windowMilliseconds: number;
}

export type CommandRateLimitDecision =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export interface CommandRateLimiterPort {
  consume(userId: string): Promise<CommandRateLimitDecision>;
}
