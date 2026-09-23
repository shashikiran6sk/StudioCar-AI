"use client";

import { createContext, useContext, type ReactNode } from "react";

import { FREE_PLAN_DEFAULT } from "../../server/plans/default-plan-configurations";

export interface PlanLimits {
  /** The largest batch any plan on offer allows, or null when none is. */
  largestAvailableBatch: number | null;
  maxImagesPerBatch: number;
  planName: string;
}

/**
 * The free plan's limits, taken from the one canonical definition. A failure
 * to resolve somebody's plan must never let them start work the server will
 * refuse, so the fallback is the smallest allowance there is.
 */
export const FALLBACK_PLAN_LIMITS: PlanLimits = {
  largestAvailableBatch: null,
  maxImagesPerBatch: FREE_PLAN_DEFAULT.maxImagesPerBatch,
  planName: FREE_PLAN_DEFAULT.displayName,
};

const PlanLimitsContext = createContext<PlanLimits>(FALLBACK_PLAN_LIMITS);

export interface PlanLimitsProviderProps {
  children: ReactNode;
  limits: PlanLimits;
}

export function PlanLimitsProvider({
  children,
  limits,
}: PlanLimitsProviderProps) {
  return (
    <PlanLimitsContext.Provider value={limits}>
      {children}
    </PlanLimitsContext.Provider>
  );
}

/**
 * The limits the signed-in tenant's plan imposes, resolved once by the server
 * and read wherever the interface needs to stop before the server refuses.
 * This is guidance for the person, never the enforcement: the reservation
 * transaction decides.
 */
export function usePlanLimits(): PlanLimits {
  return useContext(PlanLimitsContext);
}
