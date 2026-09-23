import type { DashboardAttention } from "@studiocar/contracts";

import { DASHBOARD_QUICK_ACTIONS } from "./dashboard.constants";
import { INVENTORY_NEEDS_ATTENTION_HREF } from "../inventory/inventory.constants";
import { createPortfolioAttentionHref } from "../portfolio/create-portfolio-attention-href";

export interface AttentionQuickAction {
  cta: string;
  description: string;
  href: string;
  imageAlt: string;
  imageLabel: string;
  imagePath: string;
  /** The status pill's text when something needs attention. */
  statusLabel: string | null;
  title: string;
}

function describeVehicles(count: number): string {
  return count === 1
    ? "1 vehicle needs your attention."
    : `${String(count)} vehicles need your attention.`;
}

/**
 * The dashboard's third action. With nothing to fix it creates another
 * studio version. Otherwise it leads to the fix: straight to the vehicle's
 * portfolio when only one is affected, or to Inventory filtered to the
 * affected vehicles when there are several. Vehicles are counted rather than
 * images, so three failed photos of one car read as one thing to do.
 */
export function describeAttentionQuickAction(
  attention: DashboardAttention,
): AttentionQuickAction {
  if (attention.vehicleCount === 0) {
    const create = DASHBOARD_QUICK_ACTIONS.createStudio;
    return { ...create, statusLabel: null };
  }
  const review = DASHBOARD_QUICK_ACTIONS.attention;
  return {
    ...review,
    description: describeVehicles(attention.vehicleCount),
    href:
      attention.vehicleCount === 1 && attention.vehicleId
        ? createPortfolioAttentionHref(attention.vehicleId)
        : INVENTORY_NEEDS_ATTENTION_HREF,
    statusLabel: `${String(attention.vehicleCount)} need attention`,
  };
}
