import { describe, expect, it } from "vitest";

import { classifyOperationalError } from "../../../packages/observability/src/classify-operational-error";

class CodedError extends Error {
  public constructor(
    name: string,
    public readonly code: unknown,
    options?: ErrorOptions,
  ) {
    super("postgresql://user:secret@db.example.test:5432/app", options);
    this.name = name;
  }
}

describe("classifyOperationalError", () => {
  it("reports the class name and machine code of an unreachable database", () => {
    expect(
      classifyOperationalError(
        new CodedError("PrismaClientKnownRequestError", "P1001"),
      ),
    ).toEqual({ code: "P1001", name: "PrismaClientKnownRequestError" });
  });

  it("takes the first code from the cause chain", () => {
    const cause = new CodedError("Error", "ENOTFOUND");

    expect(
      classifyOperationalError(new Error("wrapped", { cause })),
    ).toEqual({ code: "ENOTFOUND", name: "Error" });
  });

  it("never includes the message, stack, or an unbounded code", () => {
    const classified = classifyOperationalError(
      new CodedError("Error", "not a code: db.example.test"),
    );

    expect(classified).toEqual({ name: "Error" });
    expect(JSON.stringify(classified)).not.toContain("secret");
  });

  it("ignores codes that are not strings", () => {
    expect(classifyOperationalError(new CodedError("Error", 42))).toEqual({
      name: "Error",
    });
  });

  it("replaces a name that is not a bounded identifier", () => {
    expect(
      classifyOperationalError(new CodedError("name with db.example.test", "P1001")),
    ).toEqual({ code: "P1001", name: "UnknownError" });
  });

  it("classifies thrown values that are not errors as unknown", () => {
    expect(classifyOperationalError("db.example.test unreachable")).toEqual({
      name: "UnknownError",
    });
    expect(classifyOperationalError(undefined)).toEqual({
      name: "UnknownError",
    });
  });

  it("stops following causes at the maximum depth", () => {
    let error = new Error("root", { cause: new CodedError("Error", "EDEEP") });
    for (let depth = 0; depth < 6; depth += 1) {
      error = new Error("wrapper", { cause: error });
    }

    expect(classifyOperationalError(error)).toEqual({ name: "Error" });
  });
});
