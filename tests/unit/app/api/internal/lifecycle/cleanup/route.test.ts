import { describe, expect, it, vi } from "vitest";

import { POST } from "../../../../../../../apps/web/src/app/api/internal/lifecycle/cleanup/route";
import { handleLifecycleCleanup } from "../../../../../../../apps/web/src/server/lifecycle/handle-lifecycle-cleanup";
import { LifecycleCleanupService } from "../../../../../../../apps/web/src/server/lifecycle/lifecycle-cleanup-service";
import { getLifecycleCleanupRuntime } from "../../../../../../../apps/web/src/server/lifecycle/lifecycle-cleanup-runtime";

vi.mock(
  "../../../../../../../apps/web/src/server/lifecycle/lifecycle-cleanup-runtime",
  () => ({ getLifecycleCleanupRuntime: vi.fn() }),
);
vi.mock(
  "../../../../../../../apps/web/src/server/lifecycle/handle-lifecycle-cleanup",
  () => ({
    handleLifecycleCleanup: vi.fn(
      async () => new Response(null, { status: 200 }),
    ),
  }),
);

describe("POST /api/internal/lifecycle/cleanup", () => {
  it("delegates to the protected bounded cleanup handler", async () => {
    const service = new LifecycleCleanupService(
      {
        deleteExpiredSessions: vi.fn(),
        deleteExpiredOAuthChallenges: vi.fn(),
        deleteExpiredPhoneOtpChallenges: vi.fn(),
        deleteExpiredCommandRateLimitEvents: vi.fn(),
      },
      {
        batchSize: 100,
        sessionRetentionMilliseconds: 1,
        authChallengeRetentionMilliseconds: 1,
        commandRateLimitRetentionMilliseconds: 1,
      },
    );
    const cleanupToken = "lifecycle-cleanup-token-at-least-32-characters";
    vi.mocked(getLifecycleCleanupRuntime).mockReturnValue({
      cleanupToken,
      service,
    });
    const request = new Request(
      "https://app.studiocar.test/api/internal/lifecycle/cleanup",
      { method: "POST" },
    );

    expect((await POST(request)).status).toBe(200);
    expect(handleLifecycleCleanup).toHaveBeenCalledWith(
      request,
      cleanupToken,
      service,
    );
  });
});
