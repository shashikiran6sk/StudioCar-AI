import type {
  CommandRateLimitScope,
  ConsumeCommandRateLimitCommand,
  ConsumeCommandRateLimitResult,
} from "@studiocar/database";

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
