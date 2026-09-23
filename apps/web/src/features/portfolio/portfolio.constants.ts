import type { BackgroundTreatment, FloorStyle } from "@studiocar/contracts";

export const PORTFOLIO_BACK_LABEL = "Back to Inventory";
export const PORTFOLIO_EYEBROW = "Portfolio";
export const PORTFOLIO_IMAGE_SINGULAR = "image";
export const PORTFOLIO_IMAGE_PLURAL = "images";
export const PORTFOLIO_COMPARE_LABEL = "Compare original and processed image";
export const PORTFOLIO_DOWNLOAD_LABEL = "Download image";
export const PORTFOLIO_FULLSCREEN_LABEL = "Enter full screen";
export const PORTFOLIO_CLOSE_VIEWER_LABEL = "Close full screen";
export const PORTFOLIO_PREVIOUS_LABEL = "Previous image";
export const PORTFOLIO_NEXT_LABEL = "Next image";
export const PORTFOLIO_ESCAPE_KEY = "Escape";
export const PORTFOLIO_ATTENTION_ANCHOR = "attention";
export const PORTFOLIO_VERSION_QUERY_KEY = "version";
export const PORTFOLIO_STUDIO_QUERY_KEY = "studio";
export const PORTFOLIO_ATTENTION_TITLE = "Needs your attention";
export const PORTFOLIO_ATTENTION_TREATMENT_LABEL = "Treatment used";
export const PORTFOLIO_REPROCESS_LABEL = "Re-process";
export const PORTFOLIO_REPLACE_LABEL = "Replace";
export const PORTFOLIO_CREATE_VERSION_LABEL = "Create studio images";
export const PORTFOLIO_IMAGE_LABEL = "Image";
export const PORTFOLIO_PROCESSING_TITLE = "A new batch is processing";
export const PORTFOLIO_PROCESSING_DESCRIPTION =
  "Your earlier studio versions stay available below. This page updates when the batch finishes.";
export const PORTFOLIO_EMPTY_TITLE = "No studio images yet";
export const PORTFOLIO_EMPTY_DESCRIPTION =
  "Studio images appear here once a batch for this vehicle completes.";
export const PORTFOLIO_VERSIONS_TITLE = "Studio versions";
export const PORTFOLIO_VERSION_SELECTED_LABEL = "Showing";
export const PORTFOLIO_STUDIO_UNAVAILABLE_MESSAGE =
  "That action isn't available for this vehicle right now. It may still be processing, or there may be nothing left to fix.";
export const PORTFOLIO_ORIGINALS_LABEL = "Originals preserved";
export const PORTFOLIO_FLOOR_LABELS: Readonly<Record<FloorStyle, string>> = {
  HORIZON: "Standard floor",
  PLAIN: "Plain background",
};
export const PORTFOLIO_BACKGROUND_LABELS: Readonly<
  Record<BackgroundTreatment, string>
> = {
  DARK_STUDIO: "Dark Studio",
  GREY_STUDIO: "Grey Studio",
  ORIGINAL: "Original background",
  PREMIUM_WHITE: "Premium White",
};
