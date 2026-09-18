import { z } from "zod";

const IndianPhoneSchema = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, "Enter an Indian phone number in E.164 format.");

export const PhoneStartSchema = z
  .object({
    phoneNumber: IndianPhoneSchema,
  })
  .strict();

export const PhoneVerifySchema = z
  .object({
    challengeId: z.uuid(),
    phoneNumber: IndianPhoneSchema,
    otp: z.string().regex(/^\d{4,8}$/, "OTP must contain 4 to 8 digits."),
  })
  .strict();

export const LogoutSchema = z
  .object({
    allSessions: z.boolean().default(false),
  })
  .strict();

export type PhoneStart = z.infer<typeof PhoneStartSchema>;
export type PhoneVerify = z.infer<typeof PhoneVerifySchema>;
export type Logout = z.infer<typeof LogoutSchema>;
