export function calculateProcessingSuccessRate(
  completedCount: number,
  unsuccessfulCount: number,
): number | null {
  const terminalCount = completedCount + unsuccessfulCount;
  if (terminalCount === 0) return null;
  return Math.round((completedCount / terminalCount) * 100);
}
