import type { InventoryItem } from "@studiocar/contracts";
import { ButtonLink } from "@studiocar/ui";

import {
  INVENTORY_CREATE_IMAGES_LABEL,
  INVENTORY_OPEN_PORTFOLIO_LABEL,
  INVENTORY_REVIEW_ISSUES_LABEL,
} from "./inventory.constants";
import { createPortfolioAttentionHref } from "../portfolio/create-portfolio-attention-href";
import { createVehiclePortfolioPath } from "../portfolio/create-vehicle-portfolio-path";

export interface InventoryCardActionProps {
  item: InventoryItem;
  /** Opens the Selection Dialog on this vehicle while choosing one. */
  selectHref?: string | undefined;
}

export function InventoryCardAction({
  item,
  selectHref,
}: InventoryCardActionProps) {
  if (selectHref) {
    return (
      <ButtonLink
        className="inventory-card__portfolio"
        href={selectHref}
        size="small"
        variant="primary"
      >
        {INVENTORY_CREATE_IMAGES_LABEL} →
      </ButtonLink>
    );
  }
  if (item.status === "FAILED") {
    return (
      <ButtonLink
        className="inventory-card__portfolio"
        href={createPortfolioAttentionHref(item.id)}
        size="small"
        variant="danger"
      >
        {INVENTORY_REVIEW_ISSUES_LABEL} →
      </ButtonLink>
    );
  }
  // A processing card is not a destination of its own, but a vehicle being
  // given another studio version still has the earlier ones to open.
  if (item.status === "PROCESSING" && !item.hasCompletedOutput) return null;
  return (
    <ButtonLink
      className="inventory-card__portfolio"
      href={createVehiclePortfolioPath(item.id)}
      size="small"
      variant="ghost"
    >
      {INVENTORY_OPEN_PORTFOLIO_LABEL} →
    </ButtonLink>
  );
}
