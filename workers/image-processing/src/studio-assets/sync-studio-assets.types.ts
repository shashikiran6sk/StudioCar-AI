import type {
  HeadObjectCommand,
  HeadObjectCommandOutput,
  PutObjectCommand,
  PutObjectCommandOutput,
} from "@aws-sdk/client-s3";

export interface StudioAssetSyncClient {
  send(command: HeadObjectCommand): Promise<HeadObjectCommandOutput>;
  send(command: PutObjectCommand): Promise<PutObjectCommandOutput>;
}

export interface SyncStudioAssetsInput {
  bucket: string;
  client: StudioAssetSyncClient;
  /** Reads the committed processing asset stored under this key. */
  readAsset: (objectKey: string) => Promise<Uint8Array>;
  /** Overwrites an asset whose stored bytes differ. Development only. */
  replace: boolean;
}

export type StudioAssetSyncOutcome = "UPLOADED" | "UNCHANGED" | "REPLACED";

export interface StudioAssetSyncResult {
  objectKey: string;
  outcome: StudioAssetSyncOutcome;
}
