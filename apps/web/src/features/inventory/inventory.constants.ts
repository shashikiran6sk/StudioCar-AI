import type {
  InventoryFilter,
  InventoryFilterCounts,
  InventoryItemStatus,
  InventoryView,
  VehicleSort,
} from "@studiocar/contracts";
import type { StatusTone } from "@studiocar/ui";

import { INVENTORY_PATH } from "../../app/app-routes";

export const INVENTORY_EYEBROW = "Vehicle image batches";
export const INVENTORY_TITLE = "Inventory";
export const INVENTORY_DESCRIPTION =
  "Manage and process your vehicle image batches.";
export const INVENTORY_EMPTY_TITLE = "Your inventory is empty";
export const INVENTORY_EMPTY_DESCRIPTION =
  "Upload your first vehicle to create professional studio images.";
export const INVENTORY_NO_RESULTS_TITLE = "No vehicles match these filters";
export const INVENTORY_NO_RESULTS_DESCRIPTION =
  "Adjust your search or choose another status to see more vehicles.";
export const INVENTORY_SEARCH_LABEL = "Search inventory";
export const INVENTORY_SEARCH_PLACEHOLDER =
  "Search vehicle, brand, stock ID, or reference";
export const INVENTORY_APPLY_LABEL = "Apply";
export const INVENTORY_GRID_LABEL = "Grid view";
export const INVENTORY_LIST_LABEL = "List view";
export const INVENTORY_NEXT_PAGE_LABEL = "Next page";
export const INVENTORY_PAGE_LIMIT = 24;
export const INVENTORY_IMAGE_FALLBACK_LABEL = "Preview pending";
export const INVENTORY_IMAGE_SINGULAR_LABEL = "image";
export const INVENTORY_IMAGE_PLURAL_LABEL = "images";
export const INVENTORY_COMPLETE_COUNT_LABEL = "complete";
export const INVENTORY_ATTENTION_COUNT_LABEL = "need attention";
export const INVENTORY_OPEN_PORTFOLIO_LABEL = "Open portfolio";
export const INVENTORY_REVIEW_ISSUES_LABEL = "Review issues";
export const INVENTORY_CREATE_IMAGES_LABEL = "Create images";
export const INVENTORY_MODE_QUERY_KEY = "mode";
export const INVENTORY_VEHICLE_QUERY_KEY = "vehicle";
export const INVENTORY_CREATE_STUDIO_EYEBROW = "Create studio images";
export const INVENTORY_CREATE_STUDIO_TITLE = "Choose a vehicle";
export const INVENTORY_CREATE_STUDIO_DESCRIPTION =
  "Pick a vehicle to create another studio version from its photos. Its existing versions stay as they are.";
export const INVENTORY_CREATE_STUDIO_EXIT_LABEL = "Back to inventory";
export const INVENTORY_CREATE_STUDIO_EMPTY_TITLE = "No vehicles are ready yet";
export const INVENTORY_CREATE_STUDIO_EMPTY_DESCRIPTION =
  "A vehicle can get another studio version once its first batch has finished processing.";

/** Opens Inventory to pick a vehicle for a new studio version. */
export const INVENTORY_CREATE_STUDIO_HREF = `${INVENTORY_PATH}?${INVENTORY_MODE_QUERY_KEY}=CREATE_STUDIO`;
/** Opens Inventory showing only the vehicles that need the user. */
export const INVENTORY_NEEDS_ATTENTION_HREF = `${INVENTORY_PATH}?filter=NEEDS_ATTENTION`;

export const INVENTORY_FILTERS: readonly {
  countKey: keyof InventoryFilterCounts;
  label: string;
  value: InventoryFilter;
}[] = [
  { countKey: "all", label: "All", value: "ALL" },
  { countKey: "processing", label: "Processing", value: "PROCESSING" },
  { countKey: "completed", label: "Completed", value: "COMPLETED" },
  {
    countKey: "needsAttention",
    label: "Needs attention",
    value: "NEEDS_ATTENTION",
  },
  { countKey: "archived", label: "Archived", value: "ARCHIVED" },
];

export const INVENTORY_SORT_OPTIONS: readonly {
  label: string;
  value: VehicleSort;
}[] = [
  { label: "Recently added", value: "CREATED_DESC" },
  { label: "Oldest added", value: "CREATED_ASC" },
  { label: "Name A–Z", value: "NAME_ASC" },
  { label: "Name Z–A", value: "NAME_DESC" },
];

export const INVENTORY_VIEWS: readonly {
  label: string;
  symbol: string;
  value: InventoryView;
}[] = [
  { label: INVENTORY_GRID_LABEL, symbol: "▦", value: "GRID" },
  { label: INVENTORY_LIST_LABEL, symbol: "☷", value: "LIST" },
];

export const INVENTORY_STATUS_PRESENTATION: Readonly<
  Record<InventoryItemStatus, { label: string; tone: StatusTone }>
> = {
  ARCHIVED: { label: "Archived", tone: "archived" },
  COMPLETED: { label: "Completed", tone: "completed" },
  FAILED: { label: "Needs attention", tone: "failed" },
  PROCESSING: { label: "Processing", tone: "processing" },
};
