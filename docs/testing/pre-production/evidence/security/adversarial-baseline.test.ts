import { randomUUID } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaProcessingWorkerRepository } from "../../../../../packages/database-runtime/src/repositories/processing-worker-repository";
import { PrismaPortfolioRepository } from "../../../../../apps/web/src/server/db/repositories/portfolio-repository";
import { PortfolioService } from "../../../../../apps/web/src/server/portfolio/portfolio-service";
import { ProcessingJobExecutor } from "../../../../../workers/image-processing/src/execution/processing-job-executor";
import { FileStudioBackgroundSource } from "../../../../../workers/image-processing/src/execution/file-studio-background-source";
import { buildProcessingObjectKeys } from "../../../../../workers/image-processing/src/execution/build-processing-object-keys";
import { calculateSha256 } from "../../../../../workers/image-processing/src/execution/calculate-sha256";
import { ProcessingOutboxDispatcher } from "../../../../../packages/processing/src/processing-outbox-dispatcher";
import { PrismaProcessingOutboxRepository } from "../../../../../apps/web/src/server/db/repositories/processing-outbox-repository";
import { ProcessingWorker } from "../../../../../packages/processing/src/processing-worker";
import type { ImageProcessingProvider } from "../../../../../packages/processing/src/image-processing-provider.types";
import type { ClaimedProcessingJob, ProcessingJobExecutorPort } from "../../../../../packages/processing/src/processing-worker.types";
import type { ProcessingObjectStoragePort, StoredProcessingObject } from "../../../../../workers/image-processing/src/storage/processing-object-storage.types";
import { createClaimedJob } from "../../../../../tests/unit/workers/image-processing/test-support/create-claimed-job";
import { createCutout, encodeCutout } from "../../../../../tests/unit/workers/image-processing/test-support/create-cutout";

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) throw new Error("Disposable certification DATABASE_URL is required");
const database = createDatabaseClient({ connectionString, log: [] });
const owners: string[] = [];
const now = new Date("2099-10-01T00:00:00Z");
const options = { background: "PREMIUM_WHITE", floor: "HORIZON", crop: "MAINTAIN_COMPOSITION", enhancement: false, paddingPercent: 8, quality: 90 };
const backgrounds = new FileStudioBackgroundSource(path.resolve(import.meta.dirname,"../../../../../workers/image-processing/assets/backgrounds"));

afterAll(async () => {
  await database.user.deleteMany({ where: { id: { in: owners } } });
  await database.$disconnect();
});

async function fixture(count: number) {
  const user = await database.user.create({ data: { displayName: "Certification synthetic customer" } });
  owners.push(user.id);
  const vehicle = await database.vehicle.create({ data: { userId: user.id, name: "Certification car", status: "PROCESSING" } });
  const jobs = [];
  for (let index = 0; index < count; index += 1) {
    const id = randomUUID();
    const asset = await database.imageAsset.create({ data: {
      id, userId: user.id, vehicleId: vehicle.id, mimeType: "image/jpeg", originalFilename: `synthetic-${index}.jpg`,
      originalObjectKey: `users/${user.id}/assets/${id}/source.jpg`, sizeBytes: 1024, status: "UPLOADED", uploadExpiresAt: now,
    } });
    const job = await database.processingJob.create({ data: {
      userId: user.id, vehicleId: vehicle.id, imageAssetId: asset.id, provider: "LEONARDO", status: "QUEUED",
      idempotencyKey: randomUUID(), batchIdempotencyKey: vehicle.id, options, displayOrder: index,
    } });
    jobs.push(job);
  }
  return { user, vehicle, jobs };
}

function workerMessage(jobId: string) {
  return { type: "PROCESS_IMAGE", version: 1, jobId, enqueuedAt: now.toISOString() } satisfies Parameters<ProcessingWorker["process"]>[0];
}

async function executorFixture() {
  const source = await sharp({ create: { width: 1920, height: 1080, channels: 3, background: "#789abc" } }).jpeg().toBuffer();
  const job = createClaimedJob({ sizeBytes: BigInt(source.length), checksumSha256: calculateSha256(source) });
  const objects = new Map<string,StoredProcessingObject>([[job.originalObjectKey,{ bytes: source, contentType: "image/jpeg", metadata: {} }]]);
  let failStage = false;
  const storage: ProcessingObjectStoragePort = {
    getOptional: async key => objects.get(key) ?? null,
    getRequired: async key => { const object=objects.get(key); if (!object) throw new Error("missing synthetic object"); return object; },
    put: async input => {
      if (failStage && input.key === buildProcessingObjectKeys(job).providerCutout) { failStage=false; throw new Error("injected cutout staging failure"); }
      objects.set(input.key,{bytes:input.bytes,contentType:input.contentType,metadata:input.metadata});
    },
  };
  const cutout = await encodeCutout(createCutout());
  let calls = 0;
  const provider: ImageProcessingProvider = { key: "LEONARDO", removeBackground: async () => {
    calls+=1;
    return { ok: true, cutout: { bytes: cutout, width:640,height:400,contentType:"image/webp",providerRequestId:`synthetic-generation-${calls}`,providerLatencyMilliseconds:10 } };
  } };
  return { job, objects, calls:()=>calls, failStage:()=>{failStage=true;}, executor:new ProcessingJobExecutor(storage,provider,backgrounds,{ maximumInputBytes:5_000_000,maximumPixels:5_000_000,previewMaximumWidth:320 }) };
}

describe("Additional adversarial baseline against exact main", () => {
  it("SEC-DISC-001 FREE ORIGINAL processing must cap delivered output to preview dimensions", async () => {
    const f = await executorFixture();
    const job = { ...f.job, options: { ...f.job.options, background: "ORIGINAL" }, subscriptionPlanKey: null } satisfies ClaimedProcessingJob;
    const result = await f.executor.execute(job);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected rendered output");
    console.info(JSON.stringify({scenario:"SEC-DISC-001",plan:"FREE",sourceWidth:1920,outputWidth:result.output.width,previewCap:320,providerCalls:f.calls()}));
    expect(result.output.width).toBeLessThanOrEqual(320);
  });

  it("LEONARDO-DISC-001 staging failure after successful provider call must not pay twice", async () => {
    const f = await executorFixture();
    f.failStage();
    const first = await f.executor.execute(f.job);
    expect(first.ok).toBe(false);
    const retry = await f.executor.execute({ ...f.job, attemptNumber:2 });
    expect(retry.ok).toBe(true);
    console.info(JSON.stringify({scenario:"LEONARDO-DISC-001",attempts:2,successfulProviderCalls:f.calls(),durableCutoutAfterFirst:false}));
    expect(f.calls()).toBe(1);
  });

  it("SEC-DISC-002 downgrade must refuse signing historical HQ object", async () => {
    const f = await fixture(1);
    const job = f.jobs[0];
    if (!job) throw new Error("fixture missing job");
    const repository = new PrismaProcessingWorkerRepository(database);
    const subscription = await database.planSubscription.create({ data: { userId:f.user.id,planKey:"STUDIO_PRO",status:"ACTIVE",source:"MANUAL_ADMIN",currentPeriodStart:new Date("2099-09-01"),currentPeriodEnd:new Date("2099-11-01") } });
    const claim = await repository.claimJob({ jobId:job.id,workerId:"cert-worker",provider:"LEONARDO",now,claimExpiresAt:new Date(now.getTime()+180000) });
    expect(claim.kind).toBe("CLAIMED");
    await repository.completeJob({ jobId:job.id,workerId:"cert-worker",attemptNumber:1,completedAt:now,providerLatencyMilliseconds:10,providerRequestId:"synthetic-paid-generation",usageBillingPeriodKey:"2099-10",usageIdempotencyKey:job.id,output:{ objectKey:`private/${job.id}/hq.webp`,previewObjectKey:`private/${job.id}/preview.webp`,width:1920,height:1080,mimeType:"image/webp",outputFormat:"WEBP",sizeBytes:1024n,checksumSha256:"a".repeat(64) } });
    await database.planSubscription.update({ where:{ id:subscription.id },data:{status:"CANCELLED"} });
    const signed: string[] = [];
    const service = new PortfolioService(new PrismaPortfolioRepository(database),{
      signInline:async key=>{signed.push(key);return `https://synthetic.invalid/${key}`;},
      signDownload:async key=>{signed.push(key);return `https://synthetic.invalid/${key}`;},
    },{assetUrlTtlSeconds:300});
    const result = await service.get(f.user.id,f.vehicle.id);
    console.info(JSON.stringify({scenario:"SEC-DISC-002",subscriptionStatus:"CANCELLED",hqSigningCalls:signed.filter(key=>key.endsWith("hq.webp")).length,deliveredWidth:result?.images[0]?.width}));
    expect(signed.filter(key=>key.endsWith("hq.webp"))).toHaveLength(0);
  });

  it("ASYNC-DISC-002 published exhausted job must reach a terminal state without another source-queue delivery", async () => {
    const f = await fixture(1);
    const job = f.jobs[0];
    if (!job) throw new Error("fixture missing job");
    await database.processingJob.update({where:{id:job.id},data:{attemptCount:4,maxAttempts:5}});
    await database.processingOutboxMessage.create({data:{jobId:job.id,publishedAt:now,queueMessageId:"synthetic-fifth-delivery"}});
    const repository = new PrismaProcessingWorkerRepository(database);
    await repository.claimJob({jobId:job.id,workerId:"crashed-final-worker",provider:"LEONARDO",now,claimExpiresAt:new Date(now.getTime()+180000)});
    let publications=0;
    const dispatcher=new ProcessingOutboxDispatcher(new PrismaProcessingOutboxRepository(database),{
      publish:async()=>{publications+=1;return {messageId:"synthetic-recovery"};},
    },{batchSize:20,claimTtlMilliseconds:30000,retryBaseMilliseconds:1000,retryMaximumMilliseconds:60000},()=>new Date(now.getTime()+24*60*60*1000));
    const dispatch=await dispatcher.dispatch({jobIds:[job.id]});
    const stuck=await database.processingJob.findUniqueOrThrow({where:{id:job.id}});
    console.info(JSON.stringify({scenario:"ASYNC-DISC-002",simulatedSourceQueueDeliveriesRemaining:0,ageAfterLeaseHours:24,attemptCount:stuck.attemptCount,status:stuck.status,dispatch,publications}));
    expect(stuck.status).toBe("FAILED");
  });

  it("ASYNC-DISC-001 twenty jobs with two invalid sources complete 18 outputs once and retain partial failure", async () => {
    const f = await fixture(20);
    const failed = new Set(f.jobs.slice(7,9).map(job=>job.id));
    let providerCalls=0;
    const executor: ProcessingJobExecutorPort = { providerKey:"LEONARDO",execute:async job=>{
      if (failed.has(job.id)) return {ok:false,failure:{stage:"SOURCE",kind:"INVALID_IMAGE",errorMessage:"Synthetic corrupt source",providerLatencyMilliseconds:null,providerRequestId:null,retryAfterMilliseconds:null}};
      providerCalls+=1;
      return {ok:true,providerLatencyMilliseconds:10,providerRequestId:`synthetic-${job.id}`,output:{objectKey:`private/${job.id}/output.webp`,previewObjectKey:`private/${job.id}/preview.webp`,width:640,height:400,mimeType:"image/webp",outputFormat:"WEBP",sizeBytes:1024n,checksumSha256:"a".repeat(64)}};
    } };
    const worker = new ProcessingWorker(new PrismaProcessingWorkerRepository(database),executor,{claimTtlMilliseconds:180000,retryBaseMilliseconds:1000,retryMaximumMilliseconds:60000},()=>now);
    const results=await Promise.all(f.jobs.map(job=>worker.process(workerMessage(job.id))));
    const duplicates=await Promise.all(f.jobs.map(job=>worker.process(workerMessage(job.id))));
    const vehicle=await database.vehicle.findUniqueOrThrow({where:{id:f.vehicle.id}});
    const outputs=await database.processedAsset.count({where:{userId:f.user.id}});
    const usage=await database.usageEvent.count({where:{userId:f.user.id,type:"BACKGROUND_REMOVAL_COMPLETED"}});
    console.info(JSON.stringify({scenario:"ASYNC-DISC-001",jobs:20,completed:results.filter(result=>result.kind==="COMPLETED").length,failed:results.filter(result=>result.kind==="FAILED").length,outputs,usage,providerCalls,duplicateIgnored:duplicates.filter(result=>result.kind==="IGNORED").length,vehicleState:vehicle.status}));
    expect(outputs).toBe(18);expect(usage).toBe(18);expect(providerCalls).toBe(18);expect(vehicle.status).toBe("PARTIALLY_FAILED");expect(duplicates.every(result=>result.kind==="IGNORED")).toBe(true);
  });
});
