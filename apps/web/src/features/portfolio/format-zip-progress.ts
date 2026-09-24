import { PORTFOLIO_ZIP_PREPARING_LABEL } from "./portfolio.constants";

/** `Preparing ZIP… 3 of 8`, counting images received rather than guessing. */
export function formatZipProgress(fetched: number, total: number): string {
  return `${PORTFOLIO_ZIP_PREPARING_LABEL} ${String(fetched)} of ${String(total)}`;
}
