export function calculateInventoryCompletion(
  completedImageCount: number,
  imageCount: number,
): number {
  if (imageCount <= 0) return 0;
  return Math.round((completedImageCount / imageCount) * 100);
}
