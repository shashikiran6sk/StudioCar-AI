import {
  PLAN_PRICE_LOCALE,
  PLAN_PRICE_MINOR_UNITS_PER_MAJOR,
} from "./plans.constants";

/**
 * Renders a stored minor-unit amount as a price.
 *
 * Prices are stored in minor units so that arithmetic never touches a float,
 * and are formatted here so every surface shows the same thing.
 */
export function formatPlanPrice(
  priceMinorUnits: number,
  currency: string,
): string {
  return new Intl.NumberFormat(PLAN_PRICE_LOCALE, {
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(priceMinorUnits / PLAN_PRICE_MINOR_UNITS_PER_MAJOR);
}
