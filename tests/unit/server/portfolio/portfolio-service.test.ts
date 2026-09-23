import {
  ImageAssetStatus,
  ProcessingJobStatus,
  VehicleStatus,
} from "../../../../packages/database-runtime/src";
import { describe, expect, it, vi } from "vitest";

import { createProcessingOptionsKey } from "../../../../packages/processing/src/create-processing-options-key";
import { ProcessingOptionsSchema } from "../../../../packages/contracts/src/processing";
import { PortfolioService } from "../../../../apps/web/src/server/portfolio/portfolio-service";
import {
  DARK_OPTIONS,
  VEHICLE_ID,
  WHITE_OPTIONS,
  fakeSigner,
  portfolioJob,
  portfolioRecord,
} from "./portfolio-record-test-data";

const WHITE_KEY = createProcessingOptionsKey(ProcessingOptionsSchema.parse(WHITE_OPTIONS));
const DARK_KEY = createProcessingOptionsKey(ProcessingOptionsSchema.parse(DARK_OPTIONS));
const DAY_ONE = new Date("2026-09-19T10:00:00.000Z");
const DAY_TWO = new Date("2026-09-20T10:00:00.000Z");
const DAY_THREE = new Date("2026-09-21T10:00:00.000Z");

function service(record: ReturnType<typeof portfolioRecord> | null) {
  const repository = { findOwned: vi.fn().mockResolvedValue(record) };
  const signer = fakeSigner();
  const signInline = vi.spyOn(signer, "signInline");
  const signDownload = vi.spyOn(signer, "signDownload");
  return {
    repository,
    service: new PortfolioService(repository, signer, { assetUrlTtlSeconds: 300 }),
    signDownload,
    signInline,
  };
}

describe("PortfolioService", () => {
  it("signs only keys returned by the owned repository", async () => {
    const job = portfolioJob({ batch: "white", createdAt: DAY_ONE });
    const { repository, service: portfolio, signDownload, signInline } = service(
      portfolioRecord([job]),
    );

    const result = await portfolio.get("owner-1", VEHICLE_ID);

    expect(repository.findOwned).toHaveBeenCalledWith("owner-1", VEHICLE_ID);
    expect(signInline).toHaveBeenCalledWith(
      job.imageAsset.originalObjectKey,
      "image/jpeg",
      300,
    );
    expect(signDownload).toHaveBeenCalledWith(
      job.processedAsset?.objectKey,
      "image/webp",
      "processed-01.webp",
      300,
    );
    expect(result).toMatchObject({
      attention: null,
      canCreateVersion: true,
      id: VEHICLE_ID,
      selectedVersionId: WHITE_KEY,
      status: "COMPLETED",
      versions: [{ completedAt: DAY_ONE.toISOString(), id: WHITE_KEY, imageCount: 1 }],
    });
    expect(result?.images[0]?.originalUrl).toBe(
      `https://signed.test/inline/${job.imageAsset.originalObjectKey}`,
    );
  });

  it("does not sign anything when the portfolio is not owned or ready", async () => {
    const { service: portfolio, signDownload, signInline } = service(null);

    await expect(portfolio.get("owner-1", VEHICLE_ID)).resolves.toBeNull();
    expect(signInline).not.toHaveBeenCalled();
    expect(signDownload).not.toHaveBeenCalled();
  });

  it("keeps a completed version after another treatment is created", async () => {
    const { service: portfolio } = service(
      portfolioRecord([
        portfolioJob({ batch: "white", createdAt: DAY_ONE, displayOrder: 0 }),
        portfolioJob({ batch: "white", createdAt: DAY_ONE, displayOrder: 1 }),
        portfolioJob({ batch: "dark", createdAt: DAY_TWO, options: DARK_OPTIONS }),
      ]),
    );

    const newest = await portfolio.get("owner-1", VEHICLE_ID);
    expect(newest?.versions.map((version) => [version.id, version.imageCount])).toEqual([
      [DARK_KEY, 1],
      [WHITE_KEY, 2],
    ]);
    expect(newest?.selectedVersionId).toBe(DARK_KEY);
    expect(newest?.images).toHaveLength(1);

    const earlier = await portfolio.get("owner-1", VEHICLE_ID, WHITE_KEY);
    expect(earlier?.selectedVersionId).toBe(WHITE_KEY);
    expect(earlier?.images).toHaveLength(2);
  });

  it("shows a vehicle still processing its new batch with its earlier version", async () => {
    const { service: portfolio } = service(
      portfolioRecord(
        [
          portfolioJob({ batch: "white", createdAt: DAY_ONE }),
          portfolioJob({
            batch: "dark",
            createdAt: DAY_TWO,
            options: DARK_OPTIONS,
            status: ProcessingJobStatus.QUEUED,
          }),
        ],
        VehicleStatus.PROCESSING,
      ),
    );

    await expect(portfolio.get("owner-1", VEHICLE_ID)).resolves.toMatchObject({
      attention: null,
      canCreateVersion: false,
      images: [expect.any(Object)],
      selectedVersionId: WHITE_KEY,
      status: "PROCESSING",
    });
  });

  it("names the newest batch's failed images with user-facing reasons", async () => {
    const { service: portfolio } = service(
      portfolioRecord(
        [
          portfolioJob({ batch: "white", createdAt: DAY_ONE }),
          portfolioJob({
            batch: "dark",
            createdAt: DAY_TWO,
            displayOrder: 0,
            options: DARK_OPTIONS,
          }),
          portfolioJob({
            batch: "dark",
            createdAt: DAY_TWO,
            displayOrder: 1,
            errorCode: "PROVIDER_TIMEOUT",
            options: DARK_OPTIONS,
            status: ProcessingJobStatus.FAILED,
          }),
          portfolioJob({
            assetStatus: ImageAssetStatus.INVALID,
            batch: "dark",
            createdAt: DAY_TWO,
            displayOrder: 2,
            errorCode: "INVALID_IMAGE",
            options: DARK_OPTIONS,
            status: ProcessingJobStatus.FAILED,
          }),
        ],
        VehicleStatus.PARTIALLY_FAILED,
      ),
    );

    const result = await portfolio.get("owner-1", VEHICLE_ID);

    expect(result?.status).toBe("NEEDS_ATTENTION");
    expect(result?.attention).toMatchObject({
      imageCount: 3,
      options: { background: "DARK_STUDIO" },
    });
    expect(
      result?.attention?.failedImages.map((image) => [
        image.displayOrder,
        image.reason,
        image.replaceRequired,
      ]),
    ).toEqual([
      [1, "SERVICE_UNAVAILABLE", false],
      [2, "UNUSABLE_IMAGE", true],
    ]);
    expect(JSON.stringify(result)).not.toContain("PROVIDER_TIMEOUT");
  });

  it("reports no attention once a later batch has succeeded", async () => {
    const { service: portfolio } = service(
      portfolioRecord([
        portfolioJob({
          batch: "first",
          createdAt: DAY_ONE,
          errorCode: "PROVIDER_TIMEOUT",
          status: ProcessingJobStatus.FAILED,
        }),
        portfolioJob({ batch: "retry", createdAt: DAY_TWO }),
      ]),
    );

    await expect(portfolio.get("owner-1", VEHICLE_ID)).resolves.toMatchObject({
      attention: null,
      status: "COMPLETED",
    });
  });

  describe("getStudioSelection", () => {
    it("starts a new version from the chosen version's photos and treatment", async () => {
      const front = portfolioJob({ batch: "white", createdAt: DAY_ONE, displayOrder: 0 });
      const side = portfolioJob({ batch: "white", createdAt: DAY_ONE, displayOrder: 1 });
      const { service: portfolio } = service(
        portfolioRecord([
          front,
          side,
          portfolioJob({ batch: "dark", createdAt: DAY_TWO, options: DARK_OPTIONS }),
        ]),
      );

      const context = await portfolio.getStudioSelection("owner-1", VEHICLE_ID, {
        mode: "CREATE_VARIANT",
        versionId: WHITE_KEY,
      });

      expect(context).toMatchObject({
        mode: "CREATE_VARIANT",
        options: { background: "PREMIUM_WHITE", floor: "HORIZON" },
        vehicle: { id: VEHICLE_ID, name: "2024 BMW X1" },
      });
      expect(
        context?.images.map((image) => [image.assetId, image.selected, image.failureReason]),
      ).toEqual([
        [front.imageAsset.id, true, null],
        [side.imageAsset.id, true, null],
      ]);
    });

    it("defaults a new version to the most recently completed one", async () => {
      const { service: portfolio } = service(
        portfolioRecord([
          portfolioJob({ batch: "white", createdAt: DAY_ONE }),
          portfolioJob({ batch: "dark", createdAt: DAY_TWO, options: DARK_OPTIONS }),
        ]),
      );

      await expect(
        portfolio.getStudioSelection("owner-1", VEHICLE_ID, {
          mode: "CREATE_VARIANT",
          versionId: null,
        }),
      ).resolves.toMatchObject({ options: { background: "DARK_STUDIO" } });
    });

    it("restores the failed batch for Re-process with only usable failures selected", async () => {
      const succeeded = portfolioJob({
        batch: "dark",
        createdAt: DAY_TWO,
        displayOrder: 0,
        options: DARK_OPTIONS,
      });
      const failed = portfolioJob({
        batch: "dark",
        createdAt: DAY_TWO,
        displayOrder: 1,
        errorCode: "PROVIDER_5XX",
        options: DARK_OPTIONS,
        status: ProcessingJobStatus.FAILED,
      });
      const unreadable = portfolioJob({
        assetStatus: ImageAssetStatus.INVALID,
        batch: "dark",
        createdAt: DAY_TWO,
        displayOrder: 2,
        errorCode: "INVALID_IMAGE",
        options: DARK_OPTIONS,
        status: ProcessingJobStatus.FAILED,
      });
      const { service: portfolio } = service(
        portfolioRecord(
          [
            portfolioJob({ batch: "white", createdAt: DAY_ONE }),
            succeeded,
            failed,
            unreadable,
          ],
          VehicleStatus.PARTIALLY_FAILED,
        ),
      );

      const context = await portfolio.getStudioSelection("owner-1", VEHICLE_ID, {
        mode: "REPROCESS_FAILED",
        versionId: null,
      });

      expect(context?.options.background).toBe("DARK_STUDIO");
      expect(
        context?.images.map((image) => ({
          assetId: image.assetId,
          reason: image.failureReason,
          replaceRequired: image.replaceRequired,
          selected: image.selected,
        })),
      ).toEqual([
        {
          assetId: succeeded.imageAsset.id,
          reason: null,
          replaceRequired: false,
          selected: false,
        },
        {
          assetId: failed.imageAsset.id,
          reason: "PROCESSING_FAILED",
          replaceRequired: false,
          selected: true,
        },
        {
          assetId: unreadable.imageAsset.id,
          reason: "UNUSABLE_IMAGE",
          replaceRequired: true,
          selected: false,
        },
      ]);
    });

    it("identifies the failed image for Replace", async () => {
      const unreadable = portfolioJob({
        assetStatus: ImageAssetStatus.INVALID,
        batch: "first",
        createdAt: DAY_ONE,
        errorCode: "UNSUPPORTED_IMAGE_FORMAT",
        status: ProcessingJobStatus.FAILED,
      });
      const { service: portfolio } = service(
        portfolioRecord([unreadable], VehicleStatus.PARTIALLY_FAILED),
      );

      const context = await portfolio.getStudioSelection("owner-1", VEHICLE_ID, {
        mode: "REPLACE_FAILED",
        versionId: null,
      });

      expect(context?.mode).toBe("REPLACE_FAILED");
      expect(context?.images).toEqual([
        expect.objectContaining({
          assetId: unreadable.imageAsset.id,
          failureReason: "UNUSABLE_IMAGE",
          replaceRequired: true,
          selected: false,
        }),
      ]);
    });

    it("offers no Re-process when nothing needs attention", async () => {
      const { service: portfolio } = service(
        portfolioRecord([portfolioJob({ batch: "white", createdAt: DAY_ONE })]),
      );

      await expect(
        portfolio.getStudioSelection("owner-1", VEHICLE_ID, {
          mode: "REPROCESS_FAILED",
          versionId: null,
        }),
      ).resolves.toBeNull();
    });

    it("opens nothing while the vehicle is processing", async () => {
      const { service: portfolio, signInline } = service(
        portfolioRecord(
          [portfolioJob({ batch: "white", createdAt: DAY_ONE })],
          VehicleStatus.PROCESSING,
        ),
      );

      await expect(
        portfolio.getStudioSelection("owner-1", VEHICLE_ID, {
          mode: "CREATE_VARIANT",
          versionId: null,
        }),
      ).resolves.toBeNull();
      expect(signInline).not.toHaveBeenCalled();
    });

    it("starts a new version from the latest batch when none has completed", async () => {
      const failed = portfolioJob({
        batch: "first",
        createdAt: DAY_THREE,
        errorCode: "PROVIDER_TIMEOUT",
        status: ProcessingJobStatus.FAILED,
      });
      const { service: portfolio } = service(
        portfolioRecord([failed], VehicleStatus.PARTIALLY_FAILED),
      );

      const context = await portfolio.getStudioSelection("owner-1", VEHICLE_ID, {
        mode: "CREATE_VARIANT",
        versionId: null,
      });

      expect(context?.images).toEqual([
        expect.objectContaining({ assetId: failed.imageAsset.id, selected: true }),
      ]);
    });
  });
});
