import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PortfolioZipDownloadButton } from "../../../../apps/web/src/features/portfolio/portfolio-zip-download-button";

const downloadPortfolioZip = vi.hoisted(() =>
  vi.fn(
    (
      _images: unknown,
      _filename: string,
      _dependencies: { onProgress?: (fetched: number) => void },
    ) => Promise.resolve(),
  ),
);

vi.mock("../../../../apps/web/src/features/portfolio/download-portfolio-zip", () => ({
  downloadPortfolioZip,
}));

const IMAGES = [
  { downloadFilename: "processed-01.webp", downloadUrl: "https://assets.example.test/1" },
  { downloadFilename: "processed-02.webp", downloadUrl: "https://assets.example.test/2" },
];

describe("PortfolioZipDownloadButton", () => {
  afterEach(() => {
    downloadPortfolioZip.mockReset();
  });

  it("downloads every image of the version as one named ZIP", async () => {
    downloadPortfolioZip.mockResolvedValue(undefined);
    render(<PortfolioZipDownloadButton images={IMAGES} zipFilename="bmw-studio-images.zip" />);

    fireEvent.click(screen.getByRole("button", { name: "Download all (ZIP)" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Download all (ZIP)" })).toBeEnabled();
    });
    expect(downloadPortfolioZip).toHaveBeenCalledWith(
      IMAGES,
      "bmw-studio-images.zip",
      expect.any(Object),
    );
  });

  it("shows measured progress and blocks a second request meanwhile", async () => {
    let finish: () => void = () => undefined;
    downloadPortfolioZip.mockImplementation((_images, _filename, { onProgress }) => {
      onProgress?.(1);
      return new Promise<void>((resolve) => {
        finish = resolve;
      });
    });
    render(<PortfolioZipDownloadButton images={IMAGES} zipFilename="bmw-studio-images.zip" />);

    fireEvent.click(screen.getByRole("button", { name: "Download all (ZIP)" }));

    const busy = await screen.findByRole("button", { name: "Preparing ZIP… 1 of 2" });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("aria-busy", "true");
    // Announced politely, since a disabled button's label change is not.
    expect(
      screen
        .getAllByText("Preparing ZIP… 1 of 2")
        .some((element) => element.getAttribute("aria-live") === "polite"),
    ).toBe(true);
    finish();
    await screen.findByRole("button", { name: "Download all (ZIP)" });
  });

  it("explains a failure instead of saving a partial archive", async () => {
    downloadPortfolioZip.mockRejectedValue(new Error("expired"));
    render(<PortfolioZipDownloadButton images={IMAGES} zipFilename="bmw-studio-images.zip" />);

    fireEvent.click(screen.getByRole("button", { name: "Download all (ZIP)" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/refresh the page/);
    expect(screen.getByRole("button", { name: "Download all (ZIP)" })).toBeEnabled();
  });
});
