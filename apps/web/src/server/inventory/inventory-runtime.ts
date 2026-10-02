import { getWebDatabase } from "../db/web-database";
import { S3Client } from "@aws-sdk/client-s3";
import { createS3ClientOptions, parseUploadEnvironment } from "@studiocar/config";
import { PrismaInventoryRepository } from "../db/repositories/inventory-repository";

import { InventoryService } from "./inventory-service";
import { S3InventoryPreviewSigner } from "./s3-inventory-preview-signer";

let inventoryService: InventoryService | undefined;

export function getInventoryService(): InventoryService {
  if (inventoryService) return inventoryService;

  const environment = parseUploadEnvironment(process.env);
  const database = getWebDatabase();
  inventoryService = new InventoryService(
    new PrismaInventoryRepository(database),
    new S3InventoryPreviewSigner(
      new S3Client(createS3ClientOptions(environment)),
      environment.S3_BUCKET,
    ),
    { previewUrlTtlSeconds: environment.PRESIGNED_URL_TTL_SECONDS },
  );
  return inventoryService;
}
