export const DEFAULT_ADJUSTMENTS = {
  // Luz
  brightness:  1.0,
  exposure:    1.0,
  contrast:    1.0,
  highlights:  0,      // -100 to +100
  shadows:     0,      // -100 to +100
  whites:      0,      // -100 to +100
  blacks:      0,      // -100 to +100
  clarity:     0,      // -100 to +100
  dehaze:      0,      // -100 to +100

  // Cor
  temperature: 0,      // -100 to +100
  tint:        0,      // -100 to +100
  vibrance:    0,      // -100 to +100
  saturation:  1.0,

  // Detalhe
  sharpness:      0,   // 0 to 3
  noiseReduction: 0,   // 0 to 1

  // Efeitos
  grain:    0,         // 0 to 1
  vignette: 0,         // 0 to 1

  // Transformação
  rotation: 0,         // -180 to +180 degrees
  flipH:    false,
  flipV:    false,

  // HSL Mixer (null = no-op; component sets full object when any channel changes)
  hslMixer: null,

  // Color Grading (null = no-op)
  colorGrading: null,

  // Tone Curve (Phase 3)
  curvePoints: [[0, 0], [255, 255]],
  curveLUT:    null,   // derived from curvePoints via useMemo in Editor, not persisted
};

// Kept for backward compat with existing buildFilterString tests.
// New preview uses renderPipeline instead of CSS filters.
export function buildFilterString(adjustments) {
  const { brightness, exposure, contrast, saturation, temperature, sharpness } = adjustments;
  const brightnessVal = (brightness * exposure).toFixed(3);
  const contrastVal = contrast.toFixed(3);
  const saturateVal = saturation.toFixed(3);
  const tempSepia = temperature > 0 ? ((temperature / 100) * 0.3).toFixed(3) : '0';
  const tempHue = (-(temperature / 100) * 20).toFixed(1);
  let filter = `brightness(${brightnessVal}) contrast(${contrastVal}) saturate(${saturateVal}) sepia(${tempSepia}) hue-rotate(${tempHue}deg)`;
  if (sharpness > 0) filter += ' url(#sharpen)';
  return filter;
}
