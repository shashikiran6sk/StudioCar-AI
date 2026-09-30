import { describe, expect, it } from "vitest";

import { ProcessingProvider } from "../../../../packages/database-runtime/generated/prisma/client";
import { ACTIVE_PROCESSING_PROVIDER } from "../../../../packages/processing/src/processing-worker.constants";
import { toProcessingProvider } from "../../../../apps/web/src/server/jobs/to-processing-provider";

describe("toProcessingProvider", () => {
  it("stamps new jobs with the active provider", () => {
    expect(toProcessingProvider(ACTIVE_PROCESSING_PROVIDER)).toBe(
      ProcessingProvider.LEONARDO,
    );
  });

  it("keeps retired providers in the column only as history", () => {
    expect(Object.values(ProcessingProvider)).toEqual(
      expect.arrayContaining(["REMOVEBG", "LEONARDO"]),
    );
  });
});
