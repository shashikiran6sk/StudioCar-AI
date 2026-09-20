import type {
  LifecycleCleanupApplication,
  LifecycleCleanupOptions,
  LifecycleCleanupRepositoryPort,
  LifecycleCleanupResponse,
} from "./lifecycle-cleanup.types";

type Clock = () => Date;

export class LifecycleCleanupService implements LifecycleCleanupApplication {
  public constructor(
    private readonly repository: LifecycleCleanupRepositoryPort,
    private readonly options: LifecycleCleanupOptions,
    private readonly clock: Clock = () => new Date(),
  ) {}

  public async run(): Promise<LifecycleCleanupResponse> {
    const now = this.clock();
    const [
      sessions,
      oauthChallenges,
      phoneOtpChallenges,
      commandRateLimitEvents,
    ] = await Promise.all([
      this.repository.deleteExpiredSessions({
        cutoff: new Date(
          now.getTime() - this.options.sessionRetentionMilliseconds,
        ),
        batchSize: this.options.batchSize,
      }),
      this.repository.deleteExpiredOAuthChallenges({
        cutoff: new Date(
          now.getTime() - this.options.authChallengeRetentionMilliseconds,
        ),
        batchSize: this.options.batchSize,
      }),
      this.repository.deleteExpiredPhoneOtpChallenges({
        cutoff: new Date(
          now.getTime() - this.options.authChallengeRetentionMilliseconds,
        ),
        batchSize: this.options.batchSize,
      }),
      this.repository.deleteExpiredCommandRateLimitEvents({
        cutoff: new Date(
          now.getTime() - this.options.commandRateLimitRetentionMilliseconds,
        ),
        batchSize: this.options.batchSize,
      }),
    ]);

    return {
      sessions,
      oauthChallenges,
      phoneOtpChallenges,
      commandRateLimitEvents,
      total:
        sessions +
        oauthChallenges +
        phoneOtpChallenges +
        commandRateLimitEvents,
    };
  }
}
