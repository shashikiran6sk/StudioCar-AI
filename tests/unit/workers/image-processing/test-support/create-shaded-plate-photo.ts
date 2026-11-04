import { createPlatePhoto } from "./create-plate-photo";

/** Keep known geometry and dark lettering while varying the plate exposure and cast. */
export function createShadedPlatePhoto(rgb: readonly [number, number, number] = [120, 130, 140]) {
  const image = createPlatePhoto();
  for (let offset = 0; offset < image.data.length; offset += 3) {
    if (image.data[offset] !== 240) continue;
    rgb.forEach((value, channel) => { image.data[offset + channel] = value; });
  }
  return image;
}
