import type {
  PortfolioAttention,
  VehiclePortfolio,
} from "../../../../packages/contracts/src/portfolio";
import type { ProcessingOptions } from "../../../../packages/contracts/src/processing";

export const PORTFOLIO_OPTIONS = {
  background: "PREMIUM_WHITE",
  floor: "HORIZON",
  crop: "MAINTAIN_COMPOSITION",
  enhancement: true,
  outputFormat: "WEBP",
  paddingPercent: 8,
  platePrivacy: true,
  quality: 90,
  shadow: "NATURAL",
} satisfies ProcessingOptions;

export const WHITE_VERSION_ID = "a".repeat(64);
export const DARK_VERSION_ID = "b".repeat(64);

export const PORTFOLIO_TEST_DATA = {
  attention: null,
  brand: "BMW",
  canCreateVersion: true,
  id: "4bb7fa89-c907-4458-9786-8aafc2235728",
  images: [
    {
      displayOrder: 0,
      downloadFilename: "processed-01.webp",
      downloadUrl: "https://assets.example.test/processed-01-download.webp",
      height: 720,
      id: "6b8bc4df-b9eb-4205-8815-fc099505aa91",
      originalFilename: "front.jpg",
      originalUrl: "https://assets.example.test/front-original.jpg",
      previewUrl: "https://assets.example.test/front-preview.webp",
      processedUrl: "https://assets.example.test/front-processed.webp",
      width: 1280,
    },
    {
      displayOrder: 1,
      downloadFilename: "processed-02.webp",
      downloadUrl: "https://assets.example.test/processed-02-download.webp",
      height: 720,
      id: "db38c0b7-a72a-427e-9e92-243f19ae0aa7",
      originalFilename: "rear.jpg",
      originalUrl: "https://assets.example.test/rear-original.jpg",
      previewUrl: "https://assets.example.test/rear-preview.webp",
      processedUrl: "https://assets.example.test/rear-processed.webp",
      width: 1280,
    },
  ],
  model: "3 Series",
  name: "2022 BMW 3 Series",
  selectedVersionId: WHITE_VERSION_ID,
  status: "COMPLETED",
  stockId: "NL-3429",
  variant: null,
  versions: [
    {
      completedAt: "2026-09-19T10:30:00.000Z",
      id: WHITE_VERSION_ID,
      imageCount: 2,
      label: null,
      options: PORTFOLIO_OPTIONS,
    },
  ],
  year: 2022,
} satisfies VehiclePortfolio;

export const ATTENTION_TEST_DATA = {
  failedImages: [
    {
      assetId: "7c9cd5e0-c8f5-4316-9926-3540a61f1ba2",
      displayOrder: 2,
      jobId: "8dade6f1-d906-4427-8a37-4651b7202cb3",
      originalFilename: "side.jpg",
      originalUrl: "https://assets.example.test/side-original.jpg",
      reason: "SERVICE_UNAVAILABLE",
      replaceRequired: false,
    },
    {
      assetId: "9ebef702-ea17-4538-9b48-5762c8313dc4",
      displayOrder: 3,
      jobId: "a0cf0813-fb28-4649-8c59-6873d9424ed5",
      originalFilename: "interior.heic.jpg",
      originalUrl: "https://assets.example.test/interior-original.jpg",
      reason: "UNUSABLE_IMAGE",
      replaceRequired: true,
    },
  ],
  imageCount: 4,
  options: { ...PORTFOLIO_OPTIONS, background: "DARK_STUDIO", floor: "PLAIN" },
} satisfies PortfolioAttention;
