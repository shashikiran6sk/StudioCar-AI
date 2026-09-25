import { writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const appDirectory = path.resolve("apps/web/src/app");
const vehiclePath = path.resolve("apps/web/public/images/marketing/silver-sedan.png");

function brandIcon(size) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="106" fill="#0c0c0b"/>
    <text x="256" y="332" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="250" font-weight="800" letter-spacing="-20">SC</text>
  </svg>`);
}

function favicon(pngImages) {
  const directory = Buffer.alloc(6 + pngImages.length * 16);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(pngImages.length, 4);
  let offset = directory.length;
  for (const [index, entry] of pngImages.entries()) {
    const position = 6 + index * 16;
    directory.writeUInt8(entry.size, position);
    directory.writeUInt8(entry.size, position + 1);
    directory.writeUInt16LE(1, position + 4);
    directory.writeUInt16LE(32, position + 6);
    directory.writeUInt32LE(entry.bytes.length, position + 8);
    directory.writeUInt32LE(offset, position + 12);
    offset += entry.bytes.length;
  }
  return Buffer.concat([directory, ...pngImages.map((entry) => entry.bytes)]);
}

const ogBackground = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#f7f7f5"/>
  <rect x="608" y="58" width="536" height="514" rx="36" fill="#dcebed"/>
  <rect x="608" y="420" width="536" height="152" rx="36" fill="#eef0ed"/>
  <rect x="608" y="420" width="536" height="80" fill="#eef0ed"/>
  <rect x="60" y="58" width="58" height="58" rx="12" fill="#0c0c0b"/>
  <text x="89" y="97" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="800">SC</text>
  <text x="134" y="96" fill="#171716" font-family="Arial, sans-serif" font-size="28" font-weight="800">StudioCar AI</text>
  <text x="60" y="232" fill="#171716" font-family="Arial, sans-serif" font-size="54" font-weight="800">AI car photography</text>
  <text x="60" y="300" fill="#171716" font-family="Arial, sans-serif" font-size="54" font-weight="800">for dealers.</text>
  <text x="60" y="376" fill="#56534e" font-family="Arial, sans-serif" font-size="23">Consistent studio vehicle photos,</text>
  <text x="60" y="411" fill="#56534e" font-family="Arial, sans-serif" font-size="23">from upload to portfolio.</text>
  <rect x="60" y="514" width="204" height="52" rx="12" fill="#0c0c0b"/>
  <text x="162" y="548" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="19" font-weight="700">studiocarai.com</text>
</svg>`);

await writeFile(path.join(appDirectory, "icon.png"), await sharp(brandIcon(512)).png().toBuffer());
await writeFile(path.join(appDirectory, "apple-icon.png"), await sharp(brandIcon(180)).png().toBuffer());

const faviconSizes = [16, 32, 48];
const faviconImages = await Promise.all(faviconSizes.map(async (size) => ({
  size,
  bytes: await sharp(brandIcon(size)).png().toBuffer(),
})));
await writeFile(path.join(appDirectory, "favicon.ico"), favicon(faviconImages));

const vehicle = await sharp(vehiclePath).resize({ width: 570 }).png().toBuffer();
await writeFile(
  path.join(appDirectory, "opengraph-image.png"),
  await sharp(ogBackground)
    .composite([{ input: vehicle, left: 592, top: 155 }])
    .png()
    .toBuffer(),
);
