import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SoftwareApplicationJsonLd } from "../../../apps/web/src/lib/software-application-json-ld";

describe("SoftwareApplicationJsonLd", () => {
  it("renders factual parseable structured data on the canonical homepage", () => {
    const { container } = render(<SoftwareApplicationJsonLd />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const data: unknown = JSON.parse(script?.textContent ?? "");
    expect(data).toMatchObject({
      "@type": "SoftwareApplication",
      name: "StudioCar AI",
      url: "https://studiocarai.com/",
      applicationCategory: "BusinessApplication",
    });
    expect(JSON.stringify(data)).not.toContain("offers");
  });
});
