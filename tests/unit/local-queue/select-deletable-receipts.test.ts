import { describe, expect, it } from "vitest";

import { selectDeletableReceipts } from "../../../packages/local-queue/src/select-deletable-receipts";

const messages = [
  { messageId: "m1", receiptHandle: "r1", body: "{}" },
  { messageId: "m2", receiptHandle: "r2", body: "{}" },
  { messageId: "m3", receiptHandle: "r3", body: "{}" },
];

describe("selectDeletableReceipts", () => {
  it("acknowledges every message when nothing failed", () => {
    expect(
      selectDeletableReceipts(messages, { batchItemFailures: [] }),
    ).toEqual(messages);
  });

  it("leaves reported failures for redelivery", () => {
    expect(
      selectDeletableReceipts(messages, {
        batchItemFailures: [{ itemIdentifier: "m2" }],
      }).map((message) => message.messageId),
    ).toEqual(["m1", "m3"]);
  });

  it("acknowledges nothing when the whole batch failed", () => {
    expect(
      selectDeletableReceipts(messages, {
        batchItemFailures: messages.map((message) => ({
          itemIdentifier: message.messageId,
        })),
      }),
    ).toEqual([]);
  });

  it("ignores a reported failure that is not in the batch", () => {
    expect(
      selectDeletableReceipts(messages, {
        batchItemFailures: [{ itemIdentifier: "unknown" }],
      }),
    ).toEqual(messages);
  });
});
