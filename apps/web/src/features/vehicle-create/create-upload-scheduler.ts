import { INVALID_UPLOAD_CONCURRENCY_ERROR } from "./upload-performance.constants";

/** A cancelled active operation keeps its slot until it actually settles. */
export function createUploadScheduler(concurrency: number) {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new RangeError(INVALID_UPLOAD_CONCURRENCY_ERROR);
  let active = 0;
  const pending: (() => void)[] = [];
  function drain() {
    while (active < concurrency && pending.length > 0) pending.shift()?.();
  }
  return {
    run<T>(operation: () => Promise<T>, signal: AbortSignal): Promise<T> {
      if (signal.aborted) return Promise.reject(signal.reason);
      return new Promise<T>((resolve, reject) => {
        const cancel = () => {
          const index = pending.indexOf(start);
          if (index >= 0) pending.splice(index, 1);
          reject(signal.reason);
        };
        const start = () => {
          signal.removeEventListener("abort", cancel);
          active += 1;
          Promise.resolve().then(() => {
            signal.throwIfAborted();
            return operation();
          }).then(resolve, reject).finally(() => {
            active -= 1;
            drain();
          });
        };
        signal.addEventListener("abort", cancel, { once: true });
        pending.push(start);
        drain();
      });
    },
  };
}
