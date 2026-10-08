import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { SQSClient } from "@aws-sdk/client-sqs";
import { createDatabaseClient } from "../../packages/database-runtime/src/client";
import { CommandRateLimitScope, ProcessingProvider } from "../../packages/database-runtime/generated/prisma/client";
import { ProcessingOptionsSchema } from "../../packages/contracts/src/processing";
import { ProcessingOutboxDispatcher } from "../../packages/processing/src/processing-outbox-dispatcher";
import { measureStage, PerformanceStage, logger, monitoringContext } from "../../packages/observability/src/index";
import { PrismaProcessingJobRepository } from "../../apps/web/src/server/db/repositories/processing-job-repository";
import { PrismaProcessingOutboxRepository } from "../../apps/web/src/server/db/repositories/processing-outbox-repository";
import { PrismaSessionRepository } from "../../apps/web/src/server/db/repositories/session-repository";
import { PrismaUsageBillingRepository } from "../../apps/web/src/server/db/repositories/usage-billing-repository";
import { PrismaPlanConfigRepository } from "../../apps/web/src/server/db/repositories/plan-config-repository";
import { PrismaCommandRateLimitRepository } from "../../apps/web/src/server/db/repositories/command-rate-limit-repository";
import { DEFAULT_PLAN_CATALOG } from "../../apps/web/src/server/plans/default-plan-catalog";
import { toPlanCatalogEntry } from "../../apps/web/src/server/plans/to-plan-catalog-entry";
import { UsageBillingService } from "../../apps/web/src/server/billing/usage-billing-service";
import { ProcessingJobService } from "../../apps/web/src/server/jobs/processing-job-service";
import { SqsProcessingQueue } from "../../apps/web/src/server/jobs/sqs-processing-queue";
import { CommandRateLimiter } from "../../apps/web/src/server/security/command-rate-limiter";
import { SessionService } from "../../apps/web/src/server/auth/session-service";
import { withRouteMonitoring } from "../../apps/web/src/server/observability/with-route-monitoring";
import { handleCreateProcessingBatch } from "../../apps/web/src/server/jobs/create-processing-batch-handler";

vi.mock("next/server", () => ({ after: vi.fn() }));
const DATABASE_NAME = "studiocar_perf";
const SQS_DELAY_MS = 10;
const SAMPLES = 5;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Set DATABASE_URL to the isolated benchmark database.");
const target = new URL(databaseUrl);
if (!["127.0.0.1", "localhost"].includes(target.hostname) || target.pathname !== `/${DATABASE_NAME}`) {
  throw new Error("This benchmark requires the isolated local studiocar_perf database.");
}
const database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
const sessions = new SessionService(new PrismaSessionRepository(database));
const catalog = new PrismaPlanConfigRepository(database);
const billing = new UsageBillingService(new PrismaUsageBillingRepository(database), {
  list: async () => {
    const rows = await catalog.findActive();
    return rows.length ? rows.map(toPlanCatalogEntry) : DEFAULT_PLAN_CATALOG;
  },
});
const ownerIds: string[] = [];
beforeAll(() => vi.spyOn(logger, "log").mockReturnValue(true));
afterAll(async () => {
  await database.creditAllocation.deleteMany({ where: { userId: { in: ownerIds } } });
  await database.creditLedger.deleteMany({ where: { userId: { in: ownerIds } } });
  await database.user.deleteMany({ where: { id: { in: ownerIds } } });
  await database.$disconnect();
  vi.restoreAllMocks();
});

it.each([1, 5, 20])("records %i-image acceptance separately from last queue acknowledgement", async (size) => {
  for (let sample = 0; sample < SAMPLES; sample += 1) {
    const owner = await database.user.create({ data: {} });
    ownerIds.push(owner.id);
    const now = new Date();
    await database.creditLedger.create({ data: { userId: owner.id, type: "PURCHASE_GRANT", amount: 100, referenceId: owner.id } });
    const issued = await sessions.issue(owner.id);
    const vehicle = await database.vehicle.create({ data: { userId: owner.id, name: "Local performance fixture" } });
    const assetIds = Array.from({ length: size }, () => randomUUID());
    await database.imageAsset.createMany({ data: assetIds.map((id, displayOrder) => ({
      id, userId: owner.id, vehicleId: vehicle.id, status: "UPLOADED", displayOrder,
      originalObjectKey: `users/${owner.id}/${id}`, originalFilename: "fixture.jpg", mimeType: "image/jpeg",
      sizeBytes: 1024, uploadExpiresAt: now, uploadedAt: now,
    })) });
    let publishedAt = 0;
    let sends = 0;
    const queue = new SqsProcessingQueue(new SQSClient({ region: "us-east-1" }), "https://sqs.test/local", async () => {
      await delay(SQS_DELAY_MS);
      sends += 1;
      publishedAt = performance.now();
      return { MessageId: randomUUID(), $metadata: {} };
    }, async (command) => {
      await delay(SQS_DELAY_MS);
      sends += 1;
      publishedAt = performance.now();
      return { Successful: (command.input.Entries ?? []).map((entry) => {
        if (!entry.Id) throw new Error("Missing mock entry ID");
        return { Id: entry.Id, MessageId: randomUUID(), MD5OfMessageBody: "mock" };
      }), Failed: [], $metadata: {} };
    });
    const dispatcher = new ProcessingOutboxDispatcher(new PrismaProcessingOutboxRepository(database), queue, {
      batchSize: 20, claimTtlMilliseconds: 60_000, retryBaseMilliseconds: 1000, retryMaximumMilliseconds: 60_000,
    });
    let postResponse: (() => Promise<void>) | undefined;
    const service = new ProcessingJobService(new PrismaProcessingJobRepository(database), {
      schedule: (request) => {
        const context = monitoringContext.getStore();
        postResponse = async () => {
          if (!context) throw new Error("Missing request monitoring context");
          await monitoringContext.run(context, () => measureStage(PerformanceStage.DISPATCH, () => dispatcher.dispatch(request)));
        };
      },
    }, ProcessingProvider.LEONARDO, {
      resolve: async (userId) => {
        const plan = await billing.getCurrentPlan(userId, now);
        return { imageCapacity: plan.imageCapacity, maxImagesPerBatch: plan.maxImagesPerBatch,
        };
      },
    });
    const limiter = new CommandRateLimiter(new PrismaCommandRateLimitRepository(database), {
      scope: CommandRateLimitScope.PROCESSING_BATCH, maximumRequests: 100, windowMilliseconds: 60_000,
    });
    const route = withRouteMonitoring("/api/jobs", async (request) => {
      const session = await measureStage(PerformanceStage.AUTHENTICATION, () => sessions.authenticate(issued.token));
      return handleCreateProcessingBatch(request, session, service, limiter);
    });
    const start = performance.now();
    const response = await route(new Request("https://app.test/api/jobs", { method: "POST",
      headers: { origin: "https://app.test", "content-type": "application/json", "idempotency-key": randomUUID() },
      body: JSON.stringify({ vehicleId: vehicle.id, assetIds, options: ProcessingOptionsSchema.parse({}) }),
    }));
    const responseMs = performance.now() - start;
    expect(response.status).toBe(202);
    expect(sends).toBe(0);
    const completed = vi.mocked(logger.log).mock.calls.findLast((call) => call[1] === "http_request_completed");
    const acceptanceTimings = structuredClone(completed?.[2]?.timings);
    if (!postResponse) throw new Error("Dispatch was not scheduled");
    await postResponse();
    expect(sends).toBe(Math.ceil(size / 10));
    process.stdout.write(`${JSON.stringify({ size, sample, responseMs, lastSqsAckMs: publishedAt - start, sends, acceptanceTimings, timings: completed?.[2]?.timings })}\n`);
  }
}, 30_000);
