import { z } from "zod";

/**
 * Remove-bg output sizes StudioCar requests. `preview` is the reduced
 * resolution a free account receives; `auto` lets Leonardo keep the source
 * resolution for paid plans. The size is chosen from the account's plan on the
 * server and is never accepted from a browser.
 */
export const LeonardoSizeSchema = z.enum(["preview", "auto"]);

/** An HTTPS result URL with no embedded credentials. */
export const LeonardoImageUrlSchema = z
  .url({ protocol: /^https$/ })
  .refine((value) => !/^https:\/\/[^/]*@/i.test(value));

export const LeonardoCostSchema = z.object({
  amount: z.union([
    z.string().regex(/^\d+(?:\.\d+)?$/),
    z.number().nonnegative(),
  ]),
  unit: z.enum(["CREDITS", "DOLLARS"]),
});

/**
 * One generated result. Every field is read leniently: a field that is
 * missing, `null` or of an unexpected type reads as absent, so the adapter,
 * not a schema failure, decides whether a result was moderated, empty or
 * malformed. The generation has already been paid for by the time this is
 * read, so one surprising field must never discard a usable image.
 */
export const LeonardoResultSchema = z.object({
  url: z.string().nullish().catch(undefined),
  contentType: z.string().nullish().catch(undefined),
  width: z.number().int().positive().nullish().catch(undefined),
  height: z.number().int().positive().nullish().catch(undefined),
  nsfw: z.boolean().nullish().catch(undefined),
  blocked: z.boolean().nullish().catch(undefined),
});

/**
 * One Sync generation. Only `results` must be an array (or absent, read as
 * empty); the generation id, moderation count and cost are informational and
 * read as absent when malformed. A malformed cost is never logged.
 */
export const LeonardoGenerationSchema = z.object({
  id: z.string().min(1).max(128).nullish().catch(undefined),
  blockedCount: z.number().int().nonnegative().nullish().catch(undefined),
  cost: LeonardoCostSchema.nullish().catch(undefined),
  results: z
    .array(LeonardoResultSchema)
    .nullish()
    .transform((results) => results ?? []),
});

/** The key the Sync API wraps its generation in. */
export const LEONARDO_SYNC_ENVELOPE_KEY = "generateSync";

/**
 * A Sync API response body: `{ "generateSync": { id, blockedCount, cost,
 * results } }`. An unwrapped generation is read the same way, so the adapter
 * does not depend on the envelope surviving future API revisions.
 */
export const LeonardoResponseSchema = z.preprocess(
  (body) =>
    typeof body === "object" &&
    body !== null &&
    LEONARDO_SYNC_ENVELOPE_KEY in body
      ? body[LEONARDO_SYNC_ENVELOPE_KEY]
      : body,
  LeonardoGenerationSchema,
);

export type LeonardoSize = z.infer<typeof LeonardoSizeSchema>;
export type LeonardoCost = z.infer<typeof LeonardoCostSchema>;
export type LeonardoResult = z.infer<typeof LeonardoResultSchema>;
