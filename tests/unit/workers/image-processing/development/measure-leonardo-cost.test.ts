import sharp from "sharp";
import { expect, it } from "vitest";
import { measureLeonardoCost } from "../../../../../workers/image-processing/src/development/measure-leonardo-cost";

it("measures all three modes on one source using reported costs and actual download dimensions", async () => {
  const bytes = await sharp({
    create: {
      width: 20,
      height: 10,
      channels: 4,
      background: { r: 20, g: 30, b: 40, alpha: 0.5 },
    },
  })
    .webp()
    .toBuffer();
  const requests: unknown[] = [];
  const fetcher: typeof fetch = (_url, init) => {
    if (typeof init?.body === "string") {
      const payload: unknown = JSON.parse(init.body);
      requests.push(payload);
      return Promise.resolve(
        Response.json({
          id: `generation-${requests.length}`,
          cost: { amount: String(requests.length), unit: "DOLLARS" },
          results: [
            {
              url: "https://result.example/a.webp",
              contentType: "image/webp",
              width: 20,
              height: 10,
            },
          ],
        }),
      );
    }
    return Promise.resolve(
      new Response(bytes, { headers: { "content-type": "image/webp" } }),
    );
  };
  const measurements = await measureLeonardoCost(
    "source-key",
    {
      apiKey: "key",
      maximumOutputBytes: 1024,
      maximumPixels: 1000,
      timeoutMilliseconds: 500,
    },
    () => Promise.resolve("https://source.example/car.jpg"),
    fetcher,
  );
  expect(measurements.map((measurement) => measurement.mode)).toEqual([
    "preview",
    "full",
    "50MP",
  ]);
  expect(measurements.map((measurement) => measurement.cost)).toEqual(
    [1, 2, 3].map((amount) => ({ amount: String(amount), unit: "DOLLARS" })),
  );
  expect(
    measurements.every(
      (measurement) =>
        measurement.width === 20 &&
        measurement.height === 10 &&
        measurement.downloadedFileSize === bytes.length,
    ),
  ).toBe(true);
  expect(requests).toHaveLength(3);
  expect(requests[2]).toMatchObject({
    parameters: {
      size: "50MP",
      guidances: {
        image_reference: [{ image: { url: "https://source.example/car.jpg" } }],
      },
    },
  });
});
