import { describe, expect, it } from "vitest";

import { readMsg91RequestId } from "../../../../../apps/web/src/features/auth/msg91-widget/read-msg91-request-id";
import { MSG91_SEND_SUCCESS } from "./msg91-fixtures";

describe("readMsg91RequestId", () => {
  it("reads the request id from a send or resend success", () => {
    expect(readMsg91RequestId(MSG91_SEND_SUCCESS)).toBe(
      "36697969654e303536353038",
    );
  });

  it("returns null when the widget reports no request id", () => {
    expect(readMsg91RequestId(undefined)).toBeNull();
    expect(readMsg91RequestId({ type: "error", message: "x" })).toBeNull();
    expect(readMsg91RequestId({ type: "success", message: "" })).toBeNull();
  });
});
