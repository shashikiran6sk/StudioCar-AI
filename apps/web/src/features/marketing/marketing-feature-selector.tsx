"use client";

import { useState } from "react";

import {
  MARKETING_COPY,
  MARKETING_FEATURES,
  MARKETING_FEATURES_ID,
} from "./marketing.constants";

export function MarketingFeatureSelector() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <section className="marketing-features" id={MARKETING_FEATURES_ID}>
      <div className="marketing-section-heading marketing-section-heading--compact">
        <div>
          <p className="eyebrow">{MARKETING_COPY.features.eyebrow}</p>
          <h2>{MARKETING_COPY.features.title}</h2>
        </div>
        <p>{MARKETING_COPY.features.hint}</p>
      </div>
      <div className="marketing-features__grid">
        {MARKETING_FEATURES.map((feature, index) => (
          <button
            aria-pressed={selectedIndex === index}
            className="marketing-feature-card"
            key={feature.label}
            onClick={() => setSelectedIndex(index)}
            type="button"
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{feature.label}</strong>
            <small>{feature.description}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
