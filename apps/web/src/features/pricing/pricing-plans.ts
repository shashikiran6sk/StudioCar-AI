import type { PlanKey } from "@studiocar/contracts";

export interface PricingPlan {
  action: string;
  cadence: string;
  description: string;
  featured: boolean;
  features: readonly string[];
  imageCapacity: number;
  key: PlanKey;
  name: string;
  price: string;
  segment: string;
  storageCapacityBytes: number | null;
  uploadSessionCapacity: number | null;
}

export const PRICING_PLANS: readonly PricingPlan[] = [
  {
    action: "Start free",
    cadence: "forever",
    description: "For individuals trying the StudioCar workflow on a small set of vehicles.",
    featured: false,
    features: [
      "3 upload sessions",
      "Maximum 3 images per batch",
      "Standard background processing",
      "3 GB storage",
    ],
    imageCapacity: 9,
    key: "FREE",
    name: "Free",
    price: "₹0",
    segment: "Explore",
    storageCapacityBytes: 3_221_225_472,
    uploadSessionCapacity: 3,
  },
  {
    action: "Choose Studio Pack",
    cadence: "one-time",
    description: "A flexible credit pack for sellers, photographers, and growing dealerships.",
    featured: true,
    features: [
      "100 image credits",
      "Up to 20 images per batch",
      "Premium studio backgrounds",
      "Re-processing included",
    ],
    imageCapacity: 100,
    key: "STUDIO_PACK",
    name: "Studio Pack",
    price: "₹1,499",
    segment: "Most popular",
    storageCapacityBytes: null,
    uploadSessionCapacity: null,
  },
  {
    action: "Explore Studio Pro",
    cadence: "/ month",
    description: "For high-volume teams that need dependable image-processing throughput.",
    featured: false,
    features: [
      "500 images each month",
      "Priority batch processing",
      "Increased storage",
      "Team-ready inventory workflow",
    ],
    imageCapacity: 500,
    key: "STUDIO_PRO",
    name: "Studio Pro",
    price: "₹3,999",
    segment: "Teams",
    storageCapacityBytes: null,
    uploadSessionCapacity: null,
  },
];

export const PRICING_COPY = {
  eyebrow: "Simple packs that scale with your inventory",
  note: "Need marketplace volume or a custom workflow? Contact our team for a tailored plan.",
  summary: "Every pack keeps the same guided workflow and preserves originals. Paid checkout remains unavailable until the billing provider is connected.",
  title: "Start free. Add capacity when the vehicles arrive.",
};
