import { describe, expect, it, vi } from "vitest";
import type { EmailWorkerMessage } from "../../../packages/contracts/src/email";

import { EmailDeliveryProcessor } from "../../../packages/email/src/email-delivery-processor";
import type {
  EmailDeliveryRepositoryPort,
  MailerPort,
} from "../../../packages/email/src/email.types";

const NOW = new Date("2026-09-20T12:00:00.000Z");
const MESSAGE_ID = "4bb7fa89-c907-4458-9786-8aafc2235728";
const VEHICLE_ID = "0e879f46-1193-4d77-b785-057fe026d998";
const CLAIM_TOKEN = "delivery-claim-token-0001";
const QUEUE_MESSAGE = {
  data: {
    portfolioUrl: "https://untrusted.example/inventory/other",
    vehicleName: "Untrusted name",
  },
  messageId: MESSAGE_ID,
  recipient: "untrusted@example.com",
  type: "PROCESSING_COMPLETED",
  version: 1,
} satisfies EmailWorkerMessage;

function createRepository(): EmailDeliveryRepositoryPort {
  return {
    claimDelivery: vi.fn().mockResolvedValue({
      kind: "CLAIMED",
      message: {
        id: MESSAGE_ID,
        recipient: "dealer@example.com",
        vehicleId: VEHICLE_ID,
        vehicleName: "Canonical vehicle",
      },
    }),
    completeDelivery: vi.fn().mockResolvedValue(true),
    failDelivery: vi.fn().mockResolvedValue(true),
    releaseDelivery: vi.fn().mockResolvedValue(true),
  };
}

function createProcessor(
  repository: EmailDeliveryRepositoryPort,
  mailer: MailerPort,
): EmailDeliveryProcessor {
  return new EmailDeliveryProcessor(
    repository,
    mailer,
    {
      applicationBaseUrl: "https://app.studiocar.example",
      claimTtlMilliseconds: 60_000,
    },
    () => NOW,
    () => CLAIM_TOKEN,
  );
}

describe("EmailDeliveryProcessor", () => {
  it("sends only the canonical database snapshot and finalizes delivery", async () => {
    const repository = createRepository();
    const mailer: MailerPort = {
      send: vi.fn().mockResolvedValue({
        kind: "DELIVERED",
        providerMessageId: "resend-email-1",
      }),
    };

    await expect(
      createProcessor(repository, mailer).process(QUEUE_MESSAGE),
    ).resolves.toBe("ACKNOWLEDGED");
    expect(mailer.send).toHaveBeenCalledWith({
      data: {
        portfolioUrl: `https://app.studiocar.example/inventory/${VEHICLE_ID}`,
        vehicleName: "Canonical vehicle",
      },
      messageId: MESSAGE_ID,
      recipient: "dealer@example.com",
      type: "PROCESSING_COMPLETED",
      version: 1,
    });
    expect(repository.completeDelivery).toHaveBeenCalledWith({
      claimToken: CLAIM_TOKEN,
      deliveredAt: NOW,
      messageId: MESSAGE_ID,
      providerMessageId: "resend-email-1",
    });
  });

  it("acknowledges terminal duplicates without another provider call", async () => {
    const repository = createRepository();
    repository.claimDelivery = vi.fn().mockResolvedValue({ kind: "TERMINAL" });
    const mailer: MailerPort = { send: vi.fn() };

    await expect(
      createProcessor(repository, mailer).process(QUEUE_MESSAGE),
    ).resolves.toBe("ACKNOWLEDGED");
    expect(mailer.send).not.toHaveBeenCalled();
  });

  it("releases retryable failures and persists terminal failures", async () => {
    const retryRepository = createRepository();
    const retryMailer: MailerPort = {
      send: vi.fn().mockResolvedValue({
        errorCode: "RESEND_HTTP_429",
        kind: "FAILED",
        retryable: true,
      }),
    };
    await expect(
      createProcessor(retryRepository, retryMailer).process(QUEUE_MESSAGE),
    ).resolves.toBe("RETRY");
    expect(retryRepository.releaseDelivery).toHaveBeenCalledWith({
      claimToken: CLAIM_TOKEN,
      errorCode: "RESEND_HTTP_429",
      messageId: MESSAGE_ID,
    });

    const terminalRepository = createRepository();
    const terminalMailer: MailerPort = {
      send: vi.fn().mockResolvedValue({
        errorCode: "RESEND_HTTP_400",
        kind: "FAILED",
        retryable: false,
      }),
    };
    await expect(
      createProcessor(terminalRepository, terminalMailer).process(QUEUE_MESSAGE),
    ).resolves.toBe("ACKNOWLEDGED");
    expect(terminalRepository.failDelivery).toHaveBeenCalledWith({
      claimToken: CLAIM_TOKEN,
      errorCode: "RESEND_HTTP_400",
      failedAt: NOW,
      messageId: MESSAGE_ID,
    });
  });
});
