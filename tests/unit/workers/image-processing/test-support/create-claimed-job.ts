import type { ClaimedProcessingJob } from "../../../../../packages/processing/src/processing-worker.types";

const JOB_ID = "77777777-7777-4777-8777-777777777777";
const USER_ID = "11111111-1111-4111-8111-111111111111";
const VEHICLE_ID = "22222222-2222-4222-8222-222222222222";
const ASSET_ID = "33333333-3333-4333-8333-333333333333";

export function createClaimedJob(
  overrides: Partial<ClaimedProcessingJob> = {},
): ClaimedProcessingJob {
  return {
    attemptNumber: 1,
    checksumSha256: null,
    id: JOB_ID,
    imageAssetId: ASSET_ID,
    mimeType: "image/jpeg",
    options: {
      backgroundId: "PREMIUM_WHITE",
      floorId: "WHITE_STUDIO",
      crop: "MAINTAIN_COMPOSITION",
      enhancement: true,
      outputFormat: "JPEG",
      paddingPercent: 8,
      platePrivacy: false,
      quality: 90,
      shadow: "NATURAL",
    },
    originalObjectKey: `users/${USER_ID}/vehicles/${VEHICLE_ID}/assets/${ASSET_ID}/original/source.jpg`,
    provider: "REMOVEBG",
    sizeBytes: 0n,
    userId: USER_ID,
    vehicleId: VEHICLE_ID,
    ...overrides,
  };
}
