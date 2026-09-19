import {
  PHOTO_UPLOAD_ETAG_HEADER,
  PHOTO_UPLOAD_GENERIC_ERROR,
  PHOTO_UPLOAD_MAX_PROGRESS,
} from "./vehicle-create.constants";

export async function putFileWithProgress(
  file: File,
  uploadUrl: string,
  headers: Readonly<Record<string, string>>,
  onProgress: (progress: number) => void,
  signal?: AbortSignal,
): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const abort = () => request.abort();
    const cleanup = () => signal?.removeEventListener("abort", abort);
    request.open("PUT", uploadUrl);
    Object.entries(headers).forEach(([name, value]) =>
      request.setRequestHeader(name, value),
    );
    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      onProgress(
        Math.min(
          PHOTO_UPLOAD_MAX_PROGRESS,
          Math.round(
            (event.loaded / event.total) * PHOTO_UPLOAD_MAX_PROGRESS,
          ),
        ),
      );
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        cleanup();
        onProgress(PHOTO_UPLOAD_MAX_PROGRESS);
        resolve(request.getResponseHeader(PHOTO_UPLOAD_ETAG_HEADER) ?? undefined);
      } else {
        cleanup();
        reject(new Error(PHOTO_UPLOAD_GENERIC_ERROR));
      }
    });
    request.addEventListener("error", () => {
      cleanup();
      reject(new Error(PHOTO_UPLOAD_GENERIC_ERROR));
    });
    request.addEventListener("abort", () => {
      cleanup();
      reject(new Error(PHOTO_UPLOAD_GENERIC_ERROR));
    });
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) {
      request.abort();
      return;
    }
    request.send(file);
  });
}
