import { z } from "zod";

export const LeonardoSizeSchema = z.enum(["preview", "full", "50MP"]);
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
export const LeonardoResponseSchema = z.object({
  id: z.string().min(1).max(128),
  cost: LeonardoCostSchema.optional(),
  results: z
    .array(
      z.object({
        url: LeonardoImageUrlSchema,
        contentType: z.enum(["image/webp", "image/png"]),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
      }),
    )
    .min(1),
});
export type LeonardoSize = z.infer<typeof LeonardoSizeSchema>;
export type LeonardoCost = z.infer<typeof LeonardoCostSchema>;
