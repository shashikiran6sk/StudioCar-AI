import { parseRazorpayEnvironment } from "@studiocar/config";

export function register(): void {
  if (process.env.APP_ENV === "development" || process.env.APP_ENV === "production") {
    parseRazorpayEnvironment(process.env);
  }
}
