/** Publish only the latest measured progress per frame, and flush before a stage change. */
export function createUploadProgressReporter(publish: (progress: number) => void) {
  let frame: number | undefined;
  let pending: number | undefined;
  let previous: number | undefined;
  function cancel() {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    pending = undefined;
  }
  function flush() {
    const next = pending;
    cancel();
    if (next !== undefined && next !== previous) {
      previous = next;
      publish(next);
    }
  }
  return {
    report(progress: number) {
      pending = progress;
      if (frame === undefined && progress !== previous) frame = requestAnimationFrame(flush);
    },
    flush,
    cancel,
  };
}
