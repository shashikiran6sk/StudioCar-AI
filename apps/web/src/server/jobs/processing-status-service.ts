import type { ProcessingStatusApplication } from "./processing-status.types";
import type { ProcessingJobStatusRepositoryPort } from "./processing-status.types";
import { toJobStatus } from "./to-job-status";

export class ProcessingStatusService implements ProcessingStatusApplication {
  public constructor(
    private readonly jobs: ProcessingJobStatusRepositoryPort,
  ) {}

  public async getStatuses(
    userId: string,
    query: Parameters<ProcessingStatusApplication["getStatuses"]>[1],
  ): ReturnType<ProcessingStatusApplication["getStatuses"]> {
    const result = await this.jobs.findOwned(userId, query.ids);
    if (result.kind === "NOT_FOUND") return { ok: false, reason: "NOT_FOUND" };
    return {
      ok: true,
      response: { jobs: result.jobs.map(toJobStatus) },
    };
  }
}
