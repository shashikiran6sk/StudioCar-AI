import {
  INVENTORY_IMAGE_PLURAL_LABEL,
  INVENTORY_IMAGE_SINGULAR_LABEL,
} from "./inventory.constants";

const SINGULAR_IMAGE_COUNT = 1;

export function formatInventoryImageCount(count: number): string {
  const label =
    count === SINGULAR_IMAGE_COUNT
      ? INVENTORY_IMAGE_SINGULAR_LABEL
      : INVENTORY_IMAGE_PLURAL_LABEL;
  return `${String(count)} ${label}`;
}
