import type {
  ProcessingProviderKey,
  ProcessingQualityTier,
  ProviderFailure,
} from "./processing-worker.types";

/**
 * What the worker asks the image-processing provider for. The source is named
 * by its private storage key; an adapter that needs a URL resolves it to a
 * short-lived one itself, so no URL ever crosses this boundary.
 */
export interface BackgroundRemovalRequest {
  sourceObjectKey: string;
  /** Decided from the account's plan on the server, never by a browser. */
  qualityTier: ProcessingQualityTier;
  /** The processing job: the provider's correlation tag. */
  jobId: string;
  correlation: { assetId: string; attempt: number; vehicleId: string };
}

/**
 * The transparent vehicle together with the ground shadow the provider drew
 * for it, in the source photo's frame. StudioCar places this on its own
 * background; the provider never chooses one.
 */
export interface BackgroundRemovalCutout {
  bytes: Uint8Array;
  contentType: "image/webp";
  height: number;
  providerLatencyMilliseconds: number;
  providerRequestId: string | null;
  width: number;
}

export type BackgroundRemovalResult =
  | { ok: true; cutout: BackgroundRemovalCutout }
  | { ok: false; failure: ProviderFailure };

/**
 * The one boundary between StudioCar's processing domain and the external
 * service that separates a vehicle from its photo and draws its shadow.
 */
export interface ImageProcessingProvider {
  readonly key: ProcessingProviderKey;
  removeBackground(
    request: BackgroundRemovalRequest,
  ): Promise<BackgroundRemovalResult>;
}
