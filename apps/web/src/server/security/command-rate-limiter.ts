import {
  MILLISECONDS_PER_SECOND,
  MINIMUM_RETRY_AFTER_SECONDS,
} from "./command-rate-limiter.constants";
import type {
  CommandRateLimitDecision,
  CommandRateLimiterPort,
  CommandRateLimitPolicy,
  CommandRateLimitRepositoryPort,
} from "./command-rate-limiter.types";

type Clock = () => Date;

function retryAfterSeconds(retryAt: Date, now: Date): number {
  return Math.max(
    MINIMUM_RETRY_AFTER_SECONDS,
    Math.ceil(
      (retryAt.getTime() - now.getTime()) / MILLISECONDS_PER_SECOND,
    ),
  );
}

export class CommandRateLimiter implements CommandRateLimiterPort {
  public constructor(
    private readonly repository: CommandRateLimitRepositoryPort,
    private readonly policy: CommandRateLimitPolicy,
    private readonly clock: Clock = () => new Date(),
  ) {}

  public async consume(userId: string): Promise<CommandRateLimitDecision> {
    const now = this.clock();
    const result = await this.repository.consume({
      userId,
      scope: this.policy.scope,
      now,
      windowStart: new Date(now.getTime() - this.policy.windowMilliseconds),
      maximumRequests: this.policy.maximumRequests,
    });

    if (result.allowed) return result;

    return {
      allowed: false,
      retryAfterSeconds: retryAfterSeconds(result.retryAt, now),
    };
  }
}
