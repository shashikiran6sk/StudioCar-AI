export const USAGE_BILLING_EYEBROW = "Plan overview";
export const USAGE_BILLING_TITLE = "Usage & Billing";
export const USAGE_BILLING_DESCRIPTION =
  "Track your available credits, purchases, receipts, and storage.";
export const USAGE_BILLING_UPGRADE_LABEL = "Buy 100 More Credits";
export const USAGE_BILLING_CURRENT_PLAN_LABEL = "Current plan";
export const USAGE_BILLING_IMAGES_USED_LABEL = "images used";
export const USAGE_BILLING_REMAINING_LABEL = "remaining";
export const USAGE_BILLING_UPLOAD_SESSIONS_LABEL = "Upload sessions used";
export const USAGE_BILLING_STORAGE_LABEL = "Storage used";
export const USAGE_BILLING_PACKS_EYEBROW = "Available packs";
export const USAGE_BILLING_PACKS_TITLE =
  "Choose the capacity that fits your inventory.";
export const USAGE_BILLING_PACKS_DESCRIPTION =
  "The same packs shown on the homepage are available here with your current usage in context.";
export const USAGE_BILLING_ERROR_TITLE =
  "Usage details are temporarily unavailable";
export const USAGE_BILLING_ERROR_DESCRIPTION =
  "Your plan and processed images are safe. Try loading usage again.";
export const USAGE_BILLING_RETRY_LABEL = "Try again";

export const BILLING_PAYMENT_STATUS_LABELS: Readonly<Record<string, string>> = {
  CREATED: "Payment pending", VERIFIED: "Awaiting capture", PAID: "Paid", FAILED: "Failed",
  REFUNDED: "Refunded", PARTIALLY_REFUNDED: "Partially refunded",
};
