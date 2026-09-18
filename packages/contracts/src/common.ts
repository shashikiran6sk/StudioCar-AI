import { z } from "zod";

export const EntityIdSchema = z.uuid();

export const RequestIdSchema = z.string().trim().min(8).max(128);

export const IsoDateTimeSchema = z.iso.datetime({ offset: true });

export const CursorPaginationSchema = z
  .object({
    cursor: z.string().trim().min(1).max(512).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(24),
  })
  .strict();

export type CursorPagination = z.infer<typeof CursorPaginationSchema>;
