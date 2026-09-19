import { Skeleton } from "@studiocar/ui";

const INVENTORY_SKELETON_COUNT = 8;

export default function InventoryLoading() {
  return (
    <div aria-label="Loading inventory" className="inventory-page" role="status">
      <Skeleton className="inventory-loading__header" />
      <Skeleton className="inventory-loading__toolbar" />
      <div className="inventory-grid">
        {Array.from({ length: INVENTORY_SKELETON_COUNT }, (_, index) => (
          <Skeleton className="inventory-loading__card" key={index} />
        ))}
      </div>
    </div>
  );
}
