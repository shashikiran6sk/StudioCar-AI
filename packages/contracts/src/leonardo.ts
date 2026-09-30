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
 * One generated result. Fields are read loosely here so the adapter, not a
 * schema failure, decides whether a result was moderated, empty or malformed.
 */
export const LeonardoResultSchema = z.object({
  url: z.string().optional(),
  contentType: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  nsfw: z.boolean().optional(),
  blocked: z.boolean().optional(),
});

export const LeonardoResponseSchema = z.object({
  id: z.string().min(1).max(128),
  cost: LeonardoCostSchema.optional(),
  results: z.array(LeonardoResultSchema),
});

export type LeonardoSize = z.infer<typeof LeonardoSizeSchema>;
export type LeonardoCost = z.infer<typeof LeonardoCostSchema>;
export type LeonardoResult = z.infer<typeof LeonardoResultSchema>;
