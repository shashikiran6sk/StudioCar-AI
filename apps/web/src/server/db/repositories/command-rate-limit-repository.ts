import type { PrismaClient } from "@studiocar/database-runtime";
import type { CommandRateLimitScope } from "@studiocar/database-runtime";

const COMMAND_RATE_LIMIT_LOCK_PREFIX = "command-rate-limit:";

export interface ConsumeCommandRateLimitCommand {
  userId: string;
  scope: CommandRateLimitScope;
  now: Date;
  windowStart: Date;
  maximumRequests: number;
}

export type ConsumeCommandRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAt: Date };

function calculateRetryAt(
  oldestEventAt: Date | null,
  now: Date,
  windowStart: Date,
): Date {
  const windowMilliseconds = now.getTime() - windowStart.getTime();
  return new Date((oldestEventAt ?? now).getTime() + windowMilliseconds);
}

export class PrismaCommandRateLimitRepository {
  public constructor(private readonly database: PrismaClient) {}

  public consume(
    command: ConsumeCommandRateLimitCommand,
  ): Promise<ConsumeCommandRateLimitResult> {
    return this.database.$transaction(async (transaction) => {
      const lockKey = `${COMMAND_RATE_LIMIT_LOCK_PREFIX}${command.scope}:${command.userId}`;
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`;

      const window = await transaction.commandRateLimitEvent.aggregate({
        where: {
          userId: command.userId,
          scope: command.scope,
          occurredAt: { gt: command.windowStart },
        },
        _count: true,
        _min: { occurredAt: true },
      });

      if (window._count >= command.maximumRequests) {
        return {
          allowed: false,
          retryAt: calculateRetryAt(
            window._min.occurredAt,
            command.now,
            command.windowStart,
          ),
        };
      }

      await transaction.commandRateLimitEvent.create({
        data: {
          userId: command.userId,
          scope: command.scope,
          occurredAt: command.now,
        },
      });

      return { allowed: true };
    });
  }
}
