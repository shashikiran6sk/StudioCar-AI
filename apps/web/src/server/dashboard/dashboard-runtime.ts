import { S3Client } from "@aws-sdk/client-s3";
import { createS3ClientOptions, parseUploadEnvironment } from "@studiocar/config";
import { createDatabaseClient } from "@studiocar/database-runtime";
import { PrismaDashboardRepository } from "../db/repositories/dashboard-repository";
import { PrismaInventoryRepository } from "../db/repositories/inventory-repository";

import { DashboardService } from "./dashboard-service";
import { InventoryService } from "../inventory/inventory-service";
import { S3InventoryPreviewSigner } from "../inventory/s3-inventory-preview-signer";
import { getUsageBillingSummary } from "../billing/get-usage-billing-summary";
import { toPlanUsageSummary } from "../plan-usage/to-plan-usage-summary";

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
      new S3Client(createS3ClientOptions(environment)),
      environment.S3_BUCKET,
    ),
    { previewUrlTtlSeconds: environment.PRESIGNED_URL_TTL_SECONDS },
  );
  dashboardService = new DashboardService(
    new PrismaDashboardRepository(database),
    inventory,
    {
      resolve: async (userId) =>
        toPlanUsageSummary(await getUsageBillingSummary(userId)),
    },
  );
  return dashboardService;
}
