"use client";

import { useCallback, useEffect, useState } from "react";

import { MILLISECONDS_PER_SECOND } from "./phone-sign-in.constants";

/**
 * Whole seconds remaining until a deadline, ticking once a second. Used for
 * the resend cooldown, whose length always comes from the provider's own
 * resend delay or wait instruction when it gives one.
 */
export function useCountdown(): [number, (seconds: number) => void] {
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);

  const start = useCallback((seconds: number) => {
    const safeSeconds = Math.max(0, Math.ceil(seconds));
    setRemaining(safeSeconds);
    setDeadline(
      safeSeconds > 0 ? Date.now() + safeSeconds * MILLISECONDS_PER_SECOND : null,
    );
  }, []);

  useEffect(() => {
    if (deadline === null) return;
    const timer = setInterval(() => {
      const left = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / MILLISECONDS_PER_SECOND),
      );
      setRemaining(left);
      if (left === 0) setDeadline(null);
    }, MILLISECONDS_PER_SECOND);
    return () => {
      clearInterval(timer);
    };
  }, [deadline]);

  return [remaining, start];
}
