import { z } from "zod";

import { AuthUserSchema } from "./auth";

const DISPLAY_NAME_MINIMUM_LENGTH = 2;
const DISPLAY_NAME_MAXIMUM_LENGTH = 120;

export const ProfileIdentityProviderSchema = z.enum(["GOOGLE", "PHONE"]);

export const ProfileIdentitySchema = z
  .object({
    provider: ProfileIdentityProviderSchema,
    email: z.email().nullable(),
    phoneNumber: z.string().nullable(),
    linkedAt: z.iso.datetime(),
    lastAuthenticatedAt: z.iso.datetime().nullable(),
  })
  .strict();

export const AccountProfileSchema = z
  .object({
    user: AuthUserSchema,
    identities: z.array(ProfileIdentitySchema),
    activeSessionCount: z.number().int().nonnegative(),
  })
  .strict();

export const UpdateProfileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(
        DISPLAY_NAME_MINIMUM_LENGTH,
        "Display name must contain at least 2 characters.",
      )
      .max(
        DISPLAY_NAME_MAXIMUM_LENGTH,
        "Display name must contain at most 120 characters.",
      ),
  })
  .strict();

export const UpdateProfileResponseSchema = z
  .object({ user: AuthUserSchema })
  .strict();

export type AccountProfile = z.infer<typeof AccountProfileSchema>;
export type ProfileIdentity = z.infer<typeof ProfileIdentitySchema>;
export type ProfileIdentityProvider = z.infer<
  typeof ProfileIdentityProviderSchema
>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
export type UpdateProfileResponse = z.infer<
  typeof UpdateProfileResponseSchema
>;
