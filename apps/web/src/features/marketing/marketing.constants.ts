export const MARKETING_FEATURES_ID = "features";
export const MARKETING_WORKFLOW_ID = "workflow";
export const MARKETING_BACKGROUNDS_ID = "studio-backgrounds";
export const MARKETING_PRICING_ID = "pricing";
export const MARKETING_START_PATH = "/login?returnTo=%2Fdashboard";
export const MARKETING_CAR_IMAGE_PATH = "/images/marketing/silver-sedan.png";
export const MARKETING_CAR_IMAGE_ALT = "Silver sedan in a studio treatment";

export const MARKETING_COPY = {
  audienceLabel: "Built for automotive teams",
  backgrounds: {
    body: "Choose a presentation that fits the listing and keep the entire inventory visually consistent. Originals are always preserved for confident comparison.",
    eyebrow: "Consistent by design",
    title: "A studio look for every vehicle, every time.",
  },
  cta: {
    body: "Upload the vehicle. Choose the treatment. Let Inventory handle the rest.",
    eyebrow: "Your next vehicle is ready to look its best",
    primaryAction: "Process your first vehicle",
    secondaryAction: "View Inventory",
    title: "Build a showroom-ready portfolio before the listing goes live.",
  },
  features: {
    eyebrow: "One vehicle. One consistent portfolio.",
    hint: "Choose a feature to preview the workflow",
    title: "Everything your photos need, in one guided workflow.",
  },
  footer: {
    companyLabel: "Company",
    copyright: "© 2026 StudioCar AI. All rights reserved.",
    description: "Professional vehicle imagery for dealerships, sellers, photographers, and marketplaces—from upload to organized portfolio.",
    productLabel: "Product",
    signature: "Vehicle → Images → Portfolio",
    workspaceLabel: "Workspace",
  },
  header: {
    homeLabel: "StudioCar AI home",
    loginLabel: "Log in",
    navigationLabel: "Product",
    startLabel: "Start free",
  },
  hero: {
    comparisonLabel: "Compare original and studio processed vehicle",
    eyebrow: "Built for vehicle imagery",
    primaryAction: "Process your first vehicle →",
    secondaryAction: "Explore the product",
    summary: "Remove distracting backgrounds, protect number plates, enhance every detail, and deliver consistent portfolios—without slowing down your inventory team.",
    treatmentSummary: "✓ Premium White · Enhanced",
    title: "Turn every vehicle photo into showroom material.",
  },
  workflow: {
    body: "No specialist editing knowledge required. StudioCar AI guides every upload through the same clear sequence while your team keeps moving.",
    eyebrow: "A workflow anyone can follow",
    noteBody: "A live processing card appears in Inventory immediately—no page reload.",
    noteTitle: "After you click Process Photos",
    noteAction: "Try the guided upload →",
    title: "From vehicle details to a complete portfolio in four steps.",
  },
};

export const MARKETING_HERO_PROOF = [
  { label: "images per paid batch", value: "20×" },
  { label: "controlled processing", value: "Async" },
  { label: "always preserved", value: "Originals" },
];

export const MARKETING_STUDIO_BENEFITS = [
  "Premium White for clean marketplace listings",
  "Dark and Grey Studio for premium stock",
  "Dealership and Custom scenes for brand consistency",
];

export const MARKETING_COMPANY_LINKS = [
  "About",
  "Contact",
  "Privacy",
  "Terms",
  "Accessibility",
];

export const MARKETING_NAVIGATION = [
  { href: `#${MARKETING_FEATURES_ID}`, label: "Features" },
  { href: `#${MARKETING_WORKFLOW_ID}`, label: "Workflow" },
  { href: `#${MARKETING_BACKGROUNDS_ID}`, label: "Studio backgrounds" },
  { href: `#${MARKETING_PRICING_ID}`, label: "Pricing" },
];

export const MARKETING_FEATURES = [
  {
    description: "Replace inconsistent surroundings with premium white, dark, grey, dealership, or custom scenes.",
    label: "Studio backgrounds",
  },
  {
    description: "Automatically hide visible number plates while preserving clean, believable vehicle details.",
    label: "Plate privacy",
  },
  {
    description: "Refine lighting, colour, clarity, and visual consistency without changing the vehicle.",
    label: "Image enhancement",
  },
  {
    description: "Compare originals, select downloads, and organize a complete vehicle portfolio.",
    label: "Ready-to-share portfolios",
  },
];

export const MARKETING_WORKFLOW_STEPS = [
  {
    description: "Name the vehicle and add optional brand, model, year, stock ID, or internal reference.",
    detail: "Start with one clear vehicle record",
    title: "Vehicle details",
  },
  {
    description: "Drop in JPG, PNG, or WEBP images, check upload status, and drag to reorder.",
    detail: "Free: 3 images · Paid: 20 images",
    title: "Upload photos",
  },
  {
    description: "Choose privacy, enhancement, composition, shadow, and a studio treatment.",
    detail: "Preview every treatment before processing",
    title: "Customize",
  },
  {
    description: "Confirm the vehicle, image count, and settings before starting background work.",
    detail: "Processing continues in the background",
    title: "Review & process",
  },
];

export const MARKETING_AUDIENCES = [
  "For dealerships",
  "For sellers",
  "For photographers",
  "For marketplaces",
];
