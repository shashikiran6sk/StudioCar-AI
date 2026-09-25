import { useEffect, useState } from "react";

export function useDebouncedValue(value: string, delayMs: number, resetKey: number): string {
  const [debounced, setDebounced] = useState({ resetKey, value });

  useEffect(() => {
    if (value.length === 0) return;
    const timeout = window.setTimeout(() => setDebounced({ resetKey, value }), delayMs);
    return () => window.clearTimeout(timeout);
  }, [delayMs, resetKey, value]);

  return value.length === 0 || debounced.resetKey !== resetKey ? "" : debounced.value;
}
