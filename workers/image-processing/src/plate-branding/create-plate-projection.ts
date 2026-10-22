import { PLATE_GEOMETRY_EPSILON } from "./plate-branding.constants";
import type { PlatePoint, PlateQuadrilateral } from "./plate-branding.types";

/** Inverse homography: image pixels → unit-square plate artwork coordinates. */
export function createPlateProjection(corners: PlateQuadrilateral): ((point: PlatePoint) => PlatePoint | null) | null {
  const pairs = [
    { source: corners.topLeft, target: { x: 0, y: 0 } },
    { source: corners.topRight, target: { x: 1, y: 0 } },
    { source: corners.bottomRight, target: { x: 1, y: 1 } },
    { source: corners.bottomLeft, target: { x: 0, y: 1 } },
  ];
  const rows = pairs.flatMap(({ source: { x, y }, target: { x: u, y: v } }) => [
    [x, y, 1, 0, 0, 0, -u * x, -u * y, u],
    [0, 0, 0, x, y, 1, -v * x, -v * y, v],
  ]);
  for (let column = 0; column < 8; column++) {
    let pivot = column;
    for (let row = column + 1; row < 8; row++) {
      if (Math.abs(rows[row]?.[column] ?? 0) > Math.abs(rows[pivot]?.[column] ?? 0)) pivot = row;
    }
    const pivotRow = rows[pivot];
    const current = rows[column];
    if (!pivotRow || !current) return null;
    const divisor = pivotRow[column] ?? 0;
    if (Math.abs(divisor) < PLATE_GEOMETRY_EPSILON) return null;
    rows[column] = pivotRow;
    rows[pivot] = current;
    for (let index = column; index <= 8; index++) pivotRow[index] = (pivotRow[index] ?? 0) / divisor;
    for (let row = 0; row < 8; row++) {
      if (row === column) continue;
      const target = rows[row];
      if (!target) return null;
      const factor = target[column] ?? 0;
      for (let index = column; index <= 8; index++) target[index] = (target[index] ?? 0) - factor * (pivotRow[index] ?? 0);
    }
  }
  const coefficients = rows.map((row) => row[8] ?? 0);
  return ({ x, y }) => {
    const denominator = (coefficients[6] ?? 0) * x + (coefficients[7] ?? 0) * y + 1;
    if (Math.abs(denominator) < PLATE_GEOMETRY_EPSILON) return null;
    const u = ((coefficients[0] ?? 0) * x + (coefficients[1] ?? 0) * y + (coefficients[2] ?? 0)) / denominator;
    const v = ((coefficients[3] ?? 0) * x + (coefficients[4] ?? 0) * y + (coefficients[5] ?? 0)) / denominator;
    return Number.isFinite(u) && Number.isFinite(v) ? { x: u, y: v } : null;
  };
}
