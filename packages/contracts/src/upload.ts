import { z } from "zod";

import { EntityIdSchema } from "./common";

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const SupportedImageMimeTypeSchema = z.enum([
  "image/jpeg",
  "image/png",
  "image/webp",
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
      .regex(/^[a-f0-9]{64}$/i, "Expected a SHA-256 hex digest.")
      .optional(),
  })
  .strict();

export const CommitUploadSchema = z
  .object({
    assetId: EntityIdSchema,
    etag: z.string().trim().min(1).max(256).optional(),
    checksumSha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/i, "Expected a SHA-256 hex digest.")
      .optional(),
  })
  .strict();

export type SupportedImageMimeType = z.infer<
  typeof SupportedImageMimeTypeSchema
>;
export type CreateUploadIntent = z.infer<typeof CreateUploadIntentSchema>;
export type CommitUpload = z.infer<typeof CommitUploadSchema>;
