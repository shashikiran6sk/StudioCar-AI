import { S3Client } from "@aws-sdk/client-s3";
import { parseUploadEnvironment } from "@studiocar/config";
import { createDatabaseClient } from "@studiocar/database-runtime";
import { PrismaInventoryRepository } from "../db/repositories/inventory-repository";

import { InventoryService } from "./inventory-service";
import { S3InventoryPreviewSigner } from "./s3-inventory-preview-signer";

let inventoryService: InventoryService | undefined;

export function getInventoryService(): InventoryService {
  if (inventoryService) return inventoryService;

  const environment = parseUploadEnvironment(process.env);
  const database = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
  });
  inventoryService = new InventoryService(
    new PrismaInventoryRepository(database),
    new S3InventoryPreviewSigner(
      new S3Client({ region: environment.AWS_REGION }),
      environment.S3_BUCKET,
    ),
    { previewUrlTtlSeconds: environment.PRESIGNED_URL_TTL_SECONDS },
  );
  return inventoryService;
}
