"use client";

import { createContext, useContext, type ReactNode } from "react";

import { DEFAULT_MAX_IMAGES_PER_BATCH } from "./app-shell.constants";

export interface PlanLimits {
  maxImagesPerBatch: number;
}

const PlanLimitsContext = createContext<PlanLimits>({
  maxImagesPerBatch: DEFAULT_MAX_IMAGES_PER_BATCH,
});

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
