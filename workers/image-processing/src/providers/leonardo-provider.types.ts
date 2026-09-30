export interface LeonardoProviderOptions {
  apiKey: string;
  /** Upper bound for the downloaded result. */
  maximumOutputBytes: number;
  /** Upper bound for the decoded result. */
  maximumPixels: number;
  /** One deadline for the whole exchange: generation and result download. */
  timeoutMilliseconds: number;
}

/** Resolves a private object key to a short-lived HTTPS GET URL. */
export type SourceImageUrlResolver = (objectKey: string) => Promise<string>;
