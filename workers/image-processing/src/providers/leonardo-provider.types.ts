import type { LeonardoSize } from "@studiocar/contracts";

export interface LeonardoProviderOptions {
  apiKey: string;
  maximumOutputBytes: number;
  maximumPixels: number;
  timeoutMilliseconds: number;
  size?: LeonardoSize;
}
export type SourceImageUrlResolver = (objectKey: string) => Promise<string>;
