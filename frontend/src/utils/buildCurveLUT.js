/**
 * Generates a 256-entry LUT from [x, y] control points (0-255 range each).
 * Uses Catmull-Rom spline for smooth interpolation between points.
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
  const lut = new Uint8ClampedArray(256);
  for (let x = 0; x < 256; x++) {
    lut[x] = Math.max(0, Math.min(255, Math.round(catmullRom(sorted, x))));
  }
  return lut;
}

function catmullRom(points, x) {
  if (x <= points[0][0]) return points[0][1];
  if (x >= points[points.length - 1][0]) return points[points.length - 1][1];

  // Find the segment containing x
  let i = 1;
  while (i < points.length - 1 && points[i][0] < x) i++;

  const p0 = points[Math.max(0, i - 2)];
  const p1 = points[i - 1];
  const p2 = points[i];
  const p3 = points[Math.min(points.length - 1, i + 1)];

  const t = (x - p1[0]) / (p2[0] - p1[0]);
  const t2 = t * t;
  const t3 = t2 * t;

  return (
    (-0.5 * p0[1] + 1.5 * p1[1] - 1.5 * p2[1] + 0.5 * p3[1]) * t3 +
    (p0[1] - 2.5 * p1[1] + 2.0 * p2[1] - 0.5 * p3[1]) * t2 +
    (-0.5 * p0[1] + 0.5 * p2[1]) * t +
    p1[1]
  );
}
