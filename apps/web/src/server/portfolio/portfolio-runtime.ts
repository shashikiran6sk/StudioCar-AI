import { S3Client } from "@aws-sdk/client-s3";
import { parseUploadEnvironment } from "@studiocar/config";
import {
  createDatabaseClient,
  PrismaPortfolioRepository,
} from "@studiocar/database";

import { PortfolioService } from "./portfolio-service";
import { S3PortfolioAssetSigner } from "./s3-portfolio-asset-signer";

let portfolioService: PortfolioService | undefined;

export function getPortfolioService(): PortfolioService {
  if (portfolioService) return portfolioService;

  const environment = parseUploadEnvironment(process.env);
  portfolioService = new PortfolioService(
    new PrismaPortfolioRepository(
      createDatabaseClient({ connectionString: environment.DATABASE_URL }),
    ),
    new S3PortfolioAssetSigner(
      new S3Client({ region: environment.AWS_REGION }),
      environment.S3_BUCKET,
    ),
    { assetUrlTtlSeconds: environment.PRESIGNED_URL_TTL_SECONDS },
  );
  return portfolioService;
}
