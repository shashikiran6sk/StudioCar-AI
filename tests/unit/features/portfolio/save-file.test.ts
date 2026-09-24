import { afterEach, describe, expect, it, vi } from "vitest";

import { saveFile } from "../../../../apps/web/src/features/portfolio/save-file";

describe("saveFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("downloads the bytes under the given name and releases the object URL", () => {
    vi.useFakeTimers();
    const created = vi.fn((_object: Blob | MediaSource) => "blob:studiocar/zip");
    const revoked = vi.fn((_url: string) => undefined);
    class StubUrl extends URL {
      static override createObjectURL(object: Blob | MediaSource): string {
        return created(object);
      }
      static override revokeObjectURL(url: string): void {
        revoked(url);
      }
    }
    vi.stubGlobal("URL", StubUrl);
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this);
    });

    saveFile(new Uint8Array([1, 2]), "vehicle-studio-images.zip", "application/zip");

    const blob = created.mock.calls[0]?.[0];
    expect(blob instanceof Blob && blob.type).toBe("application/zip");
    expect(clicked[0]?.download).toBe("vehicle-studio-images.zip");
    expect(clicked[0]?.getAttribute("href")).toBe("blob:studiocar/zip");
    expect(clicked[0]?.isConnected).toBe(false);
    expect(revoked).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revoked).toHaveBeenCalledWith("blob:studiocar/zip");
  });
});
