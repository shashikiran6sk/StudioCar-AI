const MAXIMUM_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);

export function safeBigIntToNumber(value: bigint): number {
  return Number(value > MAXIMUM_SAFE_BIGINT ? MAXIMUM_SAFE_BIGINT : value);
}
