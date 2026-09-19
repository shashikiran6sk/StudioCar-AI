import {
  GOOGLE_AUTH_DEFAULT_RETURN_PATH,
  GoogleAuthStartSchema,
} from "@studiocar/contracts";

export function getAuthReturnPath(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = GoogleAuthStartSchema.safeParse({ returnTo: candidate });
  return parsed.success
    ? parsed.data.returnTo
    : GOOGLE_AUTH_DEFAULT_RETURN_PATH;
}
