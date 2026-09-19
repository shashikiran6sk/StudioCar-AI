import {
  REVIEW_PHOTO_PLURAL_LABEL,
  REVIEW_PHOTO_SINGULAR_LABEL,
} from "./vehicle-create.constants";

const SINGULAR_COUNT = 1;

export function formatPhotoCount(count: number): string {
  const label =
    count === SINGULAR_COUNT
      ? REVIEW_PHOTO_SINGULAR_LABEL
      : REVIEW_PHOTO_PLURAL_LABEL;
  return `${String(count)} ${label}`;
}
