import type { InventoryPage } from "@studiocar/contracts";
import { useEffect, useRef, useState } from "react";

import { fetchInventorySearch } from "./fetch-inventory-search";

export interface InventorySearchState {
  error: boolean;
  key: string | null;
  page: InventoryPage | null;
}

export function useInventorySearch(url: string | null): InventorySearchState & { loading: boolean; retry: () => void } {
  const [state, setState] = useState<InventorySearchState>({
    error: false,
    key: null,
    page: null,
  });
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);

  useEffect(() => {
    const currentGeneration = ++generation.current;
    if (!url) return;
    const controller = new AbortController();
    void fetchInventorySearch(url, controller.signal).then(
      (page) => {
        if (!controller.signal.aborted && currentGeneration === generation.current) {
          setState({ error: false, key: url, page });
        }
      },
      () => {
        if (!controller.signal.aborted && currentGeneration === generation.current) {
          setState({ error: true, key: url, page: null });
        }
      },
    );
    return () => controller.abort();
  }, [attempt, url]);

  return {
    ...state,
    loading: Boolean(url) && state.key !== url,
    retry: () => {
      setState({ error: false, key: null, page: null });
      setAttempt((current) => current + 1);
    },
  };
}
