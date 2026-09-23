import { INVENTORY_PATH } from "../../app/app-routes";
import { INVENTORY_CREATE_STUDIO_HREF } from "../inventory/inventory.constants";

export const DASHBOARD_DESCRIPTION =
  "Here’s how your vehicle imagery is moving today.";
export const DASHBOARD_QUICK_ACTIONS_TITLE = "Quick actions";
export const DASHBOARD_RECENT_TITLE = "Recent vehicles";
export const DASHBOARD_RECENT_EMPTY_TITLE = "No vehicle activity yet";
export const DASHBOARD_RECENT_EMPTY_DESCRIPTION =
  "Upload your first vehicle to begin a studio image batch.";
export const DASHBOARD_VIEW_ALL_LABEL = "View all inventory";
export const DASHBOARD_STORAGE_USED_LABEL = "Storage used";
export const DASHBOARD_VEHICLES_PROCESSED_LABEL = "Vehicles processed";
export const DASHBOARD_IMAGES_PROCESSED_LABEL = "Images processed";
export const DASHBOARD_VEHICLES_PROCESSING_LABEL = "Vehicles processing";
export const DASHBOARD_USAGE_REMAINING_LABEL = "Usage remaining";
export const DASHBOARD_THIS_MONTH_LABEL = "this month";
export const DASHBOARD_SUCCESSFUL_LABEL = "successful";
export const DASHBOARD_NO_TERMINAL_JOBS_LABEL = "No terminal jobs yet";
export const DASHBOARD_IMAGES_ACTIVE_LABEL = "images active";
export const DASHBOARD_IMAGE_ACTIVE_LABEL = "image active";
export const DASHBOARD_IMAGES_LABEL = "images";
export const DASHBOARD_ERROR_TITLE = "Dashboard data is temporarily unavailable";
export const DASHBOARD_ERROR_DESCRIPTION =
  "Your vehicles and processing jobs are safe. Try loading the workspace again.";
export const DASHBOARD_RETRY_LABEL = "Try again";

export const DASHBOARD_OPEN_LABEL = "Open";

/**
 * Each action carries its own imagery so the card shows what it does. The
 * third action changes with the account: it creates another studio version,
 * or, when processing needs the user, leads to what needs fixing.
 */
export const DASHBOARD_QUICK_ACTIONS = {
  attention: {
    cta: "Review issues",
    imageAlt:
      "A row of processed vehicle photos in which one blurred photo is flagged for review.",
    imageLabel: "Attention",
    imagePath: "/images/dashboard/attention-needed.webp",
    title: "Attention needed",
  },
  createStudio: {
    cta: "Create images",
    description: "Create another studio version from an existing vehicle.",
    href: INVENTORY_CREATE_STUDIO_HREF,
    imageAlt:
      "One vehicle photo split in two: parked on a street before, and on a white studio sweep after.",
    imageLabel: "Studio",
    imagePath: "/images/dashboard/studio-results.webp",
    title: "Create studio images",
  },
  inventory: {
    description: "Manage processing and completed vehicle image batches.",
    href: INVENTORY_PATH,
    imageAlt:
      "Inventory cards for four vehicles, three ready and one still processing.",
    imagePath: "/images/dashboard/vehicle-inventory.webp",
    imageLabel: "Live",
    title: "View inventory",
  },
  upload: {
    description: "Add details, photos, and a consistent studio treatment.",
    imageAlt:
      "Vehicle photos being dropped into an upload area with a progress bar.",
    imagePath: "/images/dashboard/upload-vehicle.webp",
    imageLabel: "New",
    title: "Upload a vehicle",
  },
};
