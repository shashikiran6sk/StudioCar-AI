import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { MAX_PORTFOLIO_VERSIONS } from "../../../../packages/contracts/src/portfolio";
import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";
import { PrismaProcessingWorkerRepository } from "../../../../packages/database-runtime/src/repositories/processing-worker-repository";
import { ProcessingProvider } from "../../../../packages/database-runtime/generated/prisma/client";
import { PrismaPortfolioRepository } from "../../../../apps/web/src/server/db/repositories/portfolio-repository";
import { PrismaProcessingJobRepository } from "../../../../apps/web/src/server/db/repositories/processing-job-repository";
import { ProcessingJobService } from "../../../../apps/web/src/server/jobs/processing-job-service";
import { groupStudioVersions } from "../../../../apps/web/src/server/portfolio/group-studio-versions";
import {
  TREATMENT_MATRIX_SIZE,
  createTreatmentMatrix,
} from "../../../support/studio-treatment-matrix";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const OWNER_EMAIL = "treatment-matrix@integration.studiocar.test";
const NOW = new Date("2099-09-20T00:00:00.000Z");
const CLAIM_EXPIRES_AT = new Date("2099-09-20T00:05:00.000Z");

/**
 * Every case of the Customize-treatment matrix through the real boundary:
 * the application service, the reservation transaction, the outbox row, the
 * worker's claim, and the portfolio's versions — one vehicle, one photo,
 * 96 batches, as the QA run makes them.
 */
databaseDescribe("studio treatment matrix against PostgreSQL", () => {
  let database: ReturnType<typeof createDatabaseClient>;

  beforeAll(async () => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    await database.user.deleteMany({ where: { primaryEmail: OWNER_EMAIL } });
  });

  afterAll(async () => {
    await database.user.deleteMany({ where: { primaryEmail: OWNER_EMAIL } });
    await database.$disconnect();
  });

  it("carries every switch, background, floor and label from request to worker to portfolio", async () => {
    const cases = createTreatmentMatrix();
    expect(cases).toHaveLength(TREATMENT_MATRIX_SIZE);

    const owner = await database.user.create({ data: { primaryEmail: OWNER_EMAIL } });
    const vehicle = await database.vehicle.create({
      data: { name: "Treatment matrix vehicle", status: "READY", userId: owner.id },
    });
    const assetId = randomUUID();
    await database.imageAsset.create({
      data: {
        id: assetId,
        mimeType: "image/jpeg",
        originalFilename: "rapid.jpg",
        originalObjectKey: `users/${owner.id}/vehicles/${vehicle.id}/assets/${assetId}/original/source.jpg`,
        sizeBytes: 1_024,
        status: "UPLOADED",
        uploadExpiresAt: new Date("2099-09-19T23:55:00.000Z"),
        uploadedAt: new Date("2099-09-19T23:50:00.000Z"),
        userId: owner.id,
        vehicleId: vehicle.id,
      },
    });
    const dispatched: string[] = [];
    const service = new ProcessingJobService(
      new PrismaProcessingJobRepository(database),
      {
        dispatch: (request) => {
          dispatched.push(...(request?.jobIds ?? []));
          return Promise.resolve({ claimed: 0, failed: 0, published: 0 });
        },
      },
      ProcessingProvider.REMOVEBG,
      {
        resolve: () =>
          Promise.resolve({
            allowanceBillingPeriodKey: null,
            imageCapacity: 1_000,
            maxImagesPerBatch: 20,
          }),
      },
      () => NOW,
    );
    const workers = new PrismaProcessingWorkerRepository(database);

    for (const testCase of cases) {
      const result = await service.createBatch(owner.id, `matrix-${testCase.id}`, {
        assetIds: [assetId],
        label: testCase.label,
        options: testCase.options,
        vehicleId: vehicle.id,
      });
      if (!result.ok) throw new Error(`${testCase.id} was refused: ${result.reason}`);
      const jobId = result.response.jobs[0]?.jobId;
      if (!jobId) throw new Error(`${testCase.id} reserved no job.`);
      expect(dispatched.at(-1)).toBe(jobId);

      const stored = await database.processingJob.findUniqueOrThrow({
        select: { batchLabel: true, outboxMessage: { select: { id: true } } },
        where: { id: jobId },
      });
      expect(stored.batchLabel).toBe(testCase.label);
      expect(stored.outboxMessage).not.toBeNull();

      // What the dispatcher records once the queue has the message.
      await database.processingJob.update({
        data: { queuedAt: NOW, status: "QUEUED" },
        where: { id: jobId },
      });
      await database.processingOutboxMessage.update({
        data: { publishedAt: NOW, queueMessageId: `queue-${jobId}` },
        where: { jobId },
      });
      const claim = await workers.claimJob({
        claimExpiresAt: CLAIM_EXPIRES_AT,
        jobId,
        now: NOW,
        workerId: "treatment-matrix-worker",
      });
      if (claim.kind !== "CLAIMED") throw new Error(`${testCase.id} was not claimed: ${claim.kind}`);
      expect(claim.job.options).toEqual(testCase.options);

      // The worker's outcome, so the next batch may start and the version
      // appears in the portfolio.
      await database.processedAsset.create({
        data: {
          height: 720,
          jobId,
          mimeType: "image/jpeg",
          objectKey: `private/${jobId}/processed.jpg`,
          outputFormat: "JPEG",
          previewObjectKey: `private/${jobId}/preview.webp`,
          sizeBytes: 2_048,
          userId: owner.id,
          vehicleId: vehicle.id,
          width: 1_280,
        },
      });
      await database.processingJob.update({
        data: { completedAt: NOW, status: "COMPLETED" },
        where: { id: jobId },
      });
      await database.vehicle.update({ data: { status: "READY" }, where: { id: vehicle.id } });
    }

    const record = await new PrismaPortfolioRepository(database).findOwned(
      owner.id,
      vehicle.id,
    );
    if (!record) throw new Error("Expected the vehicle's portfolio.");
    const versions = groupStudioVersions(record.processingJobs);
    expect(versions).toHaveLength(TREATMENT_MATRIX_SIZE);
    expect(MAX_PORTFOLIO_VERSIONS).toBeGreaterThanOrEqual(TREATMENT_MATRIX_SIZE);
    expect(new Set(versions.map((version) => version.label))).toEqual(
      new Set(cases.map((testCase) => testCase.label)),
    );
    for (const version of versions) {
      const testCase = cases.find(({ label }) => label === version.label);
      expect(version.options).toEqual(testCase?.options);
    }
  }, 120_000);
});
