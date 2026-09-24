const IMAGE_SINGULAR = "image";
const IMAGE_PLURAL = "images";
const REJECTED_SINGULAR = "image was";
const REJECTED_PLURAL = "images were";

export function describeBatchLimitRejection(
  maximumPhotos: number,
  rejectedCount: number,
): string {
  const limitNoun = maximumPhotos === 1 ? IMAGE_SINGULAR : IMAGE_PLURAL;
  const rejectedNoun =
    rejectedCount === 1 ? REJECTED_SINGULAR : REJECTED_PLURAL;

  return `You can upload up to ${String(maximumPhotos)} ${limitNoun} per batch. ${String(rejectedCount)} ${rejectedNoun} not added.`;
}
