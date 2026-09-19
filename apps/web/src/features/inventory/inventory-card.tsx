import type { InventoryItem } from "@studiocar/contracts";
import { Progress, StatusBadge } from "@studiocar/ui";
import Image from "next/image";

import { calculateInventoryCompletion } from "./calculate-inventory-completion";
import { formatInventoryDate } from "./format-inventory-date";
import { formatInventoryImageCount } from "./format-inventory-image-count";
import {
  INVENTORY_ATTENTION_COUNT_LABEL,
  INVENTORY_COMPLETE_COUNT_LABEL,
  INVENTORY_IMAGE_FALLBACK_LABEL,
  INVENTORY_STATUS_PRESENTATION,
} from "./inventory.constants";
import { inventoryVehicleMetadata } from "./inventory-vehicle-metadata";

export interface InventoryCardProps {
  item: InventoryItem;
}

export function InventoryCard({ item }: InventoryCardProps) {
  const presentation = INVENTORY_STATUS_PRESENTATION[item.status];
  const completion = calculateInventoryCompletion(
    item.completedImageCount,
    item.imageCount,
  );
  const metadata = inventoryVehicleMetadata(item);

  return (
    <article
      className={`inventory-card inventory-card--${item.status.toLowerCase()}`}
    >
      <div className="inventory-card__media">
        {item.previewUrl ? (
          <Image
            alt={`${item.name} preview`}
            fill
            sizes="(max-width: 639px) 138px, (max-width: 899px) 50vw, (max-width: 1179px) 33vw, 25vw"
            src={item.previewUrl}
            unoptimized
          />
        ) : (
          <span className="inventory-card__placeholder">
            <span aria-hidden="true">◇</span>
            {INVENTORY_IMAGE_FALLBACK_LABEL}
          </span>
        )}
        {item.status === "PROCESSING" ? (
          <div className="inventory-card__processing">
            <strong>{completion}%</strong>
            <Progress
              label={`${String(item.completedImageCount)} of ${formatInventoryImageCount(item.imageCount)} ${INVENTORY_COMPLETE_COUNT_LABEL}`}
              value={completion}
            />
          </div>
        ) : null}
      </div>
      <div className="inventory-card__body">
        <div className="inventory-card__heading">
          <h2>{item.name}</h2>
          <StatusBadge status={presentation.tone}>
            {presentation.label}
          </StatusBadge>
        </div>
        {metadata ? <p>{metadata}</p> : null}
        <p>
          {formatInventoryImageCount(item.imageCount)} · {formatInventoryDate(item.createdAt)}
        </p>
        {item.failedImageCount > 0 ? (
          <p className="inventory-card__attention">
            {item.completedImageCount} of {formatInventoryImageCount(item.imageCount)} {INVENTORY_COMPLETE_COUNT_LABEL}
            <br />
            {formatInventoryImageCount(item.failedImageCount)} {INVENTORY_ATTENTION_COUNT_LABEL}
          </p>
        ) : null}
      </div>
    </article>
  );
}
