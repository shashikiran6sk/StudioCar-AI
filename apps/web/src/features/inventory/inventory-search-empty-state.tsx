import { Button, StatePanel } from "@studiocar/ui";

import {
  INVENTORY_CLEAR_SEARCH_LABEL,
  INVENTORY_NO_RESULTS_DESCRIPTION,
  INVENTORY_SEARCH_NO_RESULTS_PREFIX,
  INVENTORY_SEARCH_NO_RESULTS_SUFFIX,
} from "./inventory.constants";

export interface InventorySearchEmptyStateProps {
  onClear: () => void;
  query: string;
}

export function InventorySearchEmptyState({ onClear, query }: InventorySearchEmptyStateProps) {
  return <StatePanel
    action={<Button onClick={onClear} type="button">{INVENTORY_CLEAR_SEARCH_LABEL}</Button>}
    description={INVENTORY_NO_RESULTS_DESCRIPTION}
    icon={<span aria-hidden="true">⌕</span>}
    title={`${INVENTORY_SEARCH_NO_RESULTS_PREFIX}${query}${INVENTORY_SEARCH_NO_RESULTS_SUFFIX}`}
  />;
}
