import { expect, it } from "vitest";
import { serializeSafeError } from "../../../packages/observability/src/serialize-safe-error";

it("preserves machine codes, causal classes and code locations but drops exception text", () => {
  const cause = Object.assign(new Error("session_token=secret"), {
    code: "P1001",
  });
  const error = new Error("authorization=secret", { cause });
  error.stack =
    "Error: authorization=secret\n    at execute (/app/worker.ts:12:3)\n    at https://host.test/code.js?secret=token:10:2";
  const safe = serializeSafeError(error);
  expect(safe).toMatchObject({
    name: "Error",
    code: "P1001",
    causes: [{ name: "Error", code: "P1001" }],
  });
  expect(safe.stack).toContain("worker.ts:12:3");
  expect(JSON.stringify(safe)).not.toContain("secret");
  expect(serializeSafeError({ token: "secret" }).name).toBe("UnknownError");
});
