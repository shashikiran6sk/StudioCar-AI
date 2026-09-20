import { S3Client } from "@aws-sdk/client-s3";
import { parseUploadEnvironment } from "@studiocar/config";
import {
  createDatabaseClient,
  PrismaDashboardRepository,
  PrismaInventoryRepository,
} from "@studiocar/database";

import { DashboardService } from "./dashboard-service";
import { InventoryService } from "../inventory/inventory-service";
import { S3InventoryPreviewSigner } from "../inventory/s3-inventory-preview-signer";

let dashboardService: DashboardService | undefined;

export function getDashboardService(): DashboardService {
  if (dashboardService) return dashboardService;

  const environment = parseUploadEnvironment(process.env);
  const database = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
  });
  const inventory = new InventoryService(
    new PrismaInventoryRepository(database),
    new S3InventoryPreviewSigner(
      new S3Client({ region: environment.AWS_REGION }),
      environment.S3_BUCKET,
    ),
    { previewUrlTtlSeconds: environment.PRESIGNED_URL_TTL_SECONDS },
  );
  dashboardService = new DashboardService(
    new PrismaDashboardRepository(database),
    inventory,
  );
  return dashboardService;
}
