import { describe, expect, it } from "vitest";

import { escapeEmailHtml } from "../../../../workers/email-delivery/src/escape-email-html";

describe("escapeEmailHtml", () => {
  it("escapes user-controlled vehicle text", () => {
    expect(escapeEmailHtml('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
  });
});
