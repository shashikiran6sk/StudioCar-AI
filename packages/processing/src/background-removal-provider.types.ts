import type { ShadowTreatment } from "@studiocar/contracts";

import type {
  ProcessingExecutionFailure,
  ProcessingProviderKey,
} from "./processing-worker.types";

export interface ProcessImageInput {
  bytes: Uint8Array;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  idempotencyKey: string;
  shadow: ShadowTreatment;
}

export interface ProcessImageSuccess {
  bytes: Uint8Array;
  contentType: "image/png" | "image/webp";
  providerLatencyMilliseconds: number;
  providerRequestId: string | null;
}

export type ProcessImageResult =
  | { ok: true; result: ProcessImageSuccess }
  | { ok: false; failure: ProcessingExecutionFailure };

export interface BackgroundRemovalProvider {
  readonly key: ProcessingProviderKey;
  process(input: ProcessImageInput): Promise<ProcessImageResult>;
}
