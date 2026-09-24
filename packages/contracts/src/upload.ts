import { z } from "zod";

import { EntityIdSchema, IsoDateTimeSchema } from "./common";

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const SupportedImageMimeTypeSchema = z.enum([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const ImageAssetStatusSchema = z.enum([
  "PENDING_UPLOAD",
  "UPLOADED",
  "INVALID",
  "DELETED",
]);

const SafeFilenameSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .refine(
    (value) =>
      !value.includes("/") &&
      !value.includes("\\") &&
      value !== "." &&
      value !== ".." &&
      !value.includes("\0"),
    "Filename must not contain path separators or null bytes.",
  );

export const CreateUploadIntentSchema = z
  .object({
    vehicleId: EntityIdSchema,
    filename: SafeFilenameSchema,
    mimeType: SupportedImageMimeTypeSchema,
    sizeBytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
    checksumSha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/i, "Expected a SHA-256 hex digest."),
  })
  .strict();

export const CommitUploadSchema = z
  .object({
    etag: z.string().trim().min(1).max(256).optional(),
  })
  .strict();

export const UploadAssetPathSchema = z
  .object({ assetId: EntityIdSchema })
  .strict();

export const CommitUploadPathSchema = UploadAssetPathSchema;

export const UploadRequestHeadersSchema = z.record(
  z.string().trim().min(1),
  z.string().trim().min(1),
);

export const CreateUploadIntentResponseSchema = z
  .object({
    assetId: EntityIdSchema,
    uploadUrl: z.url(),
    method: z.literal("PUT"),
    headers: UploadRequestHeadersSchema,
    expiresAt: IsoDateTimeSchema,
  })
  .strict();

export const CommitUploadResponseSchema = z
  .object({
    assetId: EntityIdSchema,
    status: z.literal("UPLOADED"),
    mimeType: SupportedImageMimeTypeSchema,
    sizeBytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .strict();

export type SupportedImageMimeType = z.infer<
  typeof SupportedImageMimeTypeSchema
>;
export type ImageAssetStatus = z.infer<typeof ImageAssetStatusSchema>;
export type CreateUploadIntent = z.infer<typeof CreateUploadIntentSchema>;
export type CommitUpload = z.infer<typeof CommitUploadSchema>;
export type CommitUploadPath = z.infer<typeof CommitUploadPathSchema>;
export type CreateUploadIntentResponse = z.infer<
  typeof CreateUploadIntentResponseSchema
>;
export type CommitUploadResponse = z.infer<
  typeof CommitUploadResponseSchema
>;
