import type { LeonardoSize } from "@studiocar/contracts";

import {
  LEONARDO_PARAMETER_DEFAULTS,
  LEONARDO_REQUEST_DEFAULTS,
  LEONARDO_SOURCE_TYPE,
} from "./leonardo-provider.constants";

/** The Remove Background Sync request body for one source image. */
export function createLeonardoRequest(sourceUrl: string, size: LeonardoSize) {
  return {
    ...LEONARDO_REQUEST_DEFAULTS,
    parameters: {
      size,
      ...LEONARDO_PARAMETER_DEFAULTS,
      guidances: {
        image_reference: [
          { image: { type: LEONARDO_SOURCE_TYPE, url: sourceUrl } },
        ],
      },
    },
  };
}
