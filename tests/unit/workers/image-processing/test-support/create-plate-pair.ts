import type { PlateDetection } from "../../../../../packages/contracts/src/plate-detection";

import type { RawImage } from "../../../../../workers/image-processing/src/execution/vehicle-alpha.types";

/** Combine independent plate photos without changing their physical surfaces. */
export function createPlatePair(first: { image: RawImage; detection: PlateDetection }, second: { image: RawImage; detection: PlateDetection }) {
  const width = first.image.width + second.image.width;
  const height = Math.max(first.image.height, second.image.height);
  const data = Buffer.alloc(width * height * 3, 70);
  for (const { image, offset } of [{ image: first.image, offset: 0 }, { image: second.image, offset: first.image.width }]) {
    if (image.channels !== 3) throw new Error("Expected RGB fixture.");
    for (let y = 0; y < image.height; y++) {
      image.data.copy(data, (y * width + offset) * 3, y * image.width * 3, (y + 1) * image.width * 3);
    }
  }
  const image: RawImage = { data, channels: 3, width, height };
  return {
    image,
    first: { ...first.detection, left: first.detection.left * first.image.width / width,
      top: first.detection.top * first.image.height / height, width: first.detection.width * first.image.width / width,
      height: first.detection.height * first.image.height / height },
    second: { ...second.detection, left: (first.image.width + second.detection.left * second.image.width) / width,
      top: second.detection.top * second.image.height / height, width: second.detection.width * second.image.width / width,
      height: second.detection.height * second.image.height / height },
  };
}
