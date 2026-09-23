import type { BackgroundTreatment } from "@studiocar/contracts";

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
export const PORTFOLIO_NEEDS_ATTENTION_MESSAGE =
  "This portfolio contains the completed images from a partially successful batch.";
export const PORTFOLIO_ORIGINALS_LABEL = "Originals preserved";
export const PORTFOLIO_BACKGROUND_LABELS: Readonly<
  Record<BackgroundTreatment, string>
> = {
  DARK_STUDIO: "Dark Studio",
  GREY_STUDIO: "Grey Studio",
  ORIGINAL: "Original background",
  PREMIUM_WHITE: "Premium White",
};
