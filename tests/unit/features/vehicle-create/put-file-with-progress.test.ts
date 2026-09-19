import { afterEach, describe, expect, it, vi } from "vitest";

import { putFileWithProgress } from "../../../../apps/web/src/features/vehicle-create/put-file-with-progress";

class FakeUploadTarget {
  private listener: ((event: ProgressEvent) => void) | null = null;

  public addEventListener(
    _type: string,
    listener: (event: ProgressEvent) => void,
  ) {
    this.listener = listener;
  }

  public emit() {
    this.listener?.(new ProgressEvent("progress", { lengthComputable: true, loaded: 5, total: 10 }));
  }
}

class FakeXmlHttpRequest {
  public readonly upload = new FakeUploadTarget();
  public status = 200;
  private loadListener: (() => void) | null = null;

  public open() {}
  public setRequestHeader() {}
  public getResponseHeader() {
    return '"etag"';
  }
  public addEventListener(type: string, listener: () => void) {
    if (type === "load") this.loadListener = listener;
  }
  public send() {
    this.upload.emit();
    this.loadListener?.();
  }
}

describe("putFileWithProgress", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reports measured byte progress and returns the storage ETag", async () => {
    vi.stubGlobal("XMLHttpRequest", FakeXmlHttpRequest);
    const onProgress = vi.fn();

    await expect(
      putFileWithProgress(
        new File(["image"], "vehicle.jpg", { type: "image/jpeg" }),
        "https://storage.example.test/upload",
        { "content-type": "image/jpeg" },
        onProgress,
      ),
    ).resolves.toBe('"etag"');
    expect(onProgress).toHaveBeenNthCalledWith(1, 50);
    expect(onProgress).toHaveBeenLastCalledWith(100);
  });
});
