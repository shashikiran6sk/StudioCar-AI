import {
  ImageAssetStatus,
  ProcessingJobStatus,
  VehicleStatus,
} from "../../../../packages/database-runtime/src";
import type {
  PortfolioJobRecord,
  PortfolioVehicleRecord,
} from "../../../../apps/web/src/server/db/repositories/portfolio-repository";

export const VEHICLE_ID = "4bb7fa89-c907-4458-9786-8aafc2235728";

export const WHITE_OPTIONS = {
  background: "PREMIUM_WHITE",
  crop: "MAINTAIN_COMPOSITION",
  enhancement: true,
  floor: "HORIZON",
  outputFormat: "WEBP",
  paddingPercent: 8,
  platePrivacy: true,
  quality: 90,
  shadow: "NATURAL",
};

export const DARK_OPTIONS = { ...WHITE_OPTIONS, background: "DARK_STUDIO" };

let sequence = 0;

function uuid(prefix: string): string {
  sequence += 1;
  return `${prefix}${String(sequence).padStart(7, "0")}-0000-4000-8000-000000000000`;
}

export interface JobFixture {
  assetId?: string;
  assetStatus?: ImageAssetStatus;
  batch: string;
  completedAt?: Date | null;
  createdAt: Date;
  displayOrder?: number;
  errorCode?: string | null;
  label?: string | null;
  options?: PortfolioJobRecord["options"];
  status?: ProcessingJobStatus;
}

/** A job as the portfolio repository selects it. */
export function portfolioJob(fixture: JobFixture): PortfolioJobRecord {
  const status = fixture.status ?? ProcessingJobStatus.COMPLETED;
  const assetId = fixture.assetId ?? uuid("a");
  const jobId = uuid("b");
  const completed = status === ProcessingJobStatus.COMPLETED;
  return {
    batchIdempotencyKey: fixture.batch,
    batchLabel: fixture.label ?? null,
    completedAt: completed
      ? (fixture.completedAt ?? fixture.createdAt)
      : null,
    createdAt: fixture.createdAt,
    displayOrder: fixture.displayOrder ?? 0,
    errorCode: fixture.errorCode ?? null,
    id: jobId,
    imageAsset: {
      height: 1080,
      id: assetId,
      mimeType: "image/jpeg",
      originalFilename: `${assetId}.jpg`,
      originalObjectKey: `private/${assetId}.jpg`,
      sizeBytes: 2_048n,
      status: fixture.assetStatus ?? ImageAssetStatus.UPLOADED,
      width: 1920,
    },
    options: fixture.options ?? WHITE_OPTIONS,
    processedAsset: completed
      ? {
          height: 720,
          id: uuid("c"),
          mimeType: "image/webp",
          objectKey: `private/${jobId}.webp`,
          previewObjectKey: `private/${jobId}-preview.webp`,
          width: 1280,
        }
      : null,
    status,
  };
}

/** Jobs are listed newest first, as the repository orders them. */
export function portfolioRecord(
  jobs: PortfolioJobRecord[],
  status: VehicleStatus = VehicleStatus.READY,
): PortfolioVehicleRecord {
  return {
    brand: "BMW",
    id: VEHICLE_ID,
    model: "X1",
    name: "2024 BMW X1",
    processingJobs: [...jobs].sort(
      (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
    ),
    status,
    stockId: "NL-3429",
    variant: null,
    year: 2024,
  };
}

export function fakeSigner() {
  return {
    signDownload: async (objectKey: string) => `https://signed.test/download/${objectKey}`,
    signInline: async (objectKey: string) => `https://signed.test/inline/${objectKey}`,
  };
}
