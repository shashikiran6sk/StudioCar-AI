export interface StoredProcessingObject {
  bytes: Uint8Array;
  contentType: string | null;
  metadata: Readonly<Record<string, string>>;
}

export interface PutProcessingObjectInput {
  bytes: Uint8Array;
  contentType: string;
  key: string;
  metadata: Readonly<Record<string, string>>;
}

export interface ProcessingObjectStoragePort {
  getOptional(key: string): Promise<StoredProcessingObject | null>;
  getRequired(key: string): Promise<StoredProcessingObject>;
  put(input: PutProcessingObjectInput): Promise<void>;
}

export interface ProcessingS3Client {
  send(command: GetObjectCommand): Promise<GetObjectCommandOutput>;
  send(command: PutObjectCommand): Promise<PutObjectCommandOutput>;
}
import type {
  GetObjectCommand,
  GetObjectCommandOutput,
  PutObjectCommand,
  PutObjectCommandOutput,
} from "@aws-sdk/client-s3";
