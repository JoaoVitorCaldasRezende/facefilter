/**
 * Generates a 256-entry LUT from [x, y] control points (0-255 range each).
 * Uses Hermite Spline for smooth interpolation, which is perfectly linear
 * when the control points form a straight line.
 *
 * @param {Array<[number, number]>} points - control points [[x, y], ...]
 * @returns {Uint8ClampedArray} 256-entry lookup table
 */
export function buildCurveLUT(points) {
  if (!points || points.length < 2) {
    const lut = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) lut[i] = i;
    return lut;
  }

  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  const k = sorted.length - 1;
  const slopes = [];

  // Calculate slopes/tangents at each control point
  for (let i = 0; i <= k; i++) {
    if (i === 0) {
      const dx = sorted[1][0] - sorted[0][0];
      const dy = sorted[1][1] - sorted[0][1];
      slopes.push(dx === 0 ? 0 : dy / dx);
    } else if (i === k) {
      const dx = sorted[k][0] - sorted[k - 1][0];
      const dy = sorted[k][1] - sorted[k - 1][1];
      slopes.push(dx === 0 ? 0 : dy / dx);
    } else {
      const dxL = sorted[i][0] - sorted[i - 1][0];
      const dyL = sorted[i][1] - sorted[i - 1][1];
      const slopeL = dxL === 0 ? 0 : dyL / dxL;

      const dxR = sorted[i + 1][0] - sorted[i][0];
      const dyR = sorted[i + 1][1] - sorted[i][1];
      const slopeR = dxR === 0 ? 0 : dyR / dxR;

      slopes.push((slopeL + slopeR) / 2);
    }
  }

  const lut = new Uint8ClampedArray(256);
  for (let x = 0; x < 256; x++) {
    if (x <= sorted[0][0]) {
      lut[x] = Math.max(0, Math.min(255, Math.round(sorted[0][1])));
      continue;
    }
    if (x >= sorted[k][0]) {
      lut[x] = Math.max(0, Math.min(255, Math.round(sorted[k][1])));
      continue;
    }

    // Find the segment containing x
    let i = 1;
    while (i < sorted.length && sorted[i][0] < x) i++;

    const [x1, y1] = sorted[i - 1];
    const [x2, y2] = sorted[i];
    const dx = x2 - x1;
    const t = (x - x1) / dx;
    const t2 = t * t;
    const t3 = t2 * t;

    const s1 = slopes[i - 1];
    const s2 = slopes[i];

    // Hermite Spline Formula
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    const y = h00 * y1 + h10 * dx * s1 + h01 * y2 + h11 * dx * s2;
    lut[x] = Math.max(0, Math.min(255, Math.round(y)));
  }

  return lut;
}
