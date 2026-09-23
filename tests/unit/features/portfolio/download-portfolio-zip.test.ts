import { unzipSync } from "fflate";
import { describe, expect, it, vi } from "vitest";

import { downloadPortfolioZip } from "../../../../apps/web/src/features/portfolio/download-portfolio-zip";

const IMAGES = [
  { downloadFilename: "processed-01.webp", downloadUrl: "https://assets.example.test/1" },
  { downloadFilename: "processed-02.webp", downloadUrl: "https://assets.example.test/2" },
];

describe("downloadPortfolioZip", () => {
  it("saves one ZIP holding every image and reports each arrival", async () => {
    const save = vi.fn((_bytes: Uint8Array, _filename: string, _mimeType: string) => undefined);
    const onProgress = vi.fn((_fetched: number) => undefined);

    await downloadPortfolioZip(IMAGES, "bmw-studio-images.zip", {
      fetchImage: (url) => Promise.resolve(new TextEncoder().encode(url)),
      onProgress,
      save,
    });

    expect(onProgress.mock.calls).toEqual([[1], [2]]);
    const [bytes, filename, mimeType] = save.mock.calls[0] ?? [];
    expect(filename).toBe("bmw-studio-images.zip");
    expect(mimeType).toBe("application/zip");
    const files = unzipSync(bytes ?? new Uint8Array());
    expect(new TextDecoder().decode(files["processed-02.webp"])).toBe(
      "https://assets.example.test/2",
    );
    expect(Object.keys(files)).toHaveLength(2);
  });

  it("saves nothing when an image cannot be read", async () => {
    const save = vi.fn();

    await expect(
      downloadPortfolioZip(IMAGES, "bmw-studio-images.zip", {
        fetchImage: (url) =>
          url.endsWith("/2")
            ? Promise.reject(new Error("expired"))
            : Promise.resolve(new Uint8Array([1])),
        save,
      }),
    ).rejects.toThrow("expired");
    expect(save).not.toHaveBeenCalled();
  });
});
