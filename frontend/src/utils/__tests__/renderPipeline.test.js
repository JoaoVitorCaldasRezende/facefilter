import { describe, it, expect } from 'vitest';
import { applyPipeline } from '../renderPipeline';

function makeImageData(pixels) {
  // pixels: array of [r, g, b, a] tuples
  const data = new Uint8ClampedArray(pixels.flat());
  return { data, width: pixels.length, height: 1 };
}

function adj(overrides = {}) {
  return {
    brightness: 1, exposure: 1, contrast: 1,
    highlights: 0, shadows: 0, whites: 0, blacks: 0,
    clarity: 0, dehaze: 0,
    temperature: 0, tint: 0,
    saturation: 1, vibrance: 0,
    sharpness: 0, noiseReduction: 0,
    grain: 0, vignette: 0,
    colorGrading: null, hslMixer: null, curveLUT: null,
    ...overrides,
  };
}

describe('renderPipeline', () => {
  it('passes image unchanged with default adjustments', () => {
    const img = makeImageData([[128, 64, 32, 255]]);
    applyPipeline(img, adj());
    expect(img.data[0]).toBeCloseTo(128, -1);
    expect(img.data[1]).toBeCloseTo(64, -1);
    expect(img.data[2]).toBeCloseTo(32, -1);
  });

  it('brightness 2.0 significantly brightens pixels', () => {
    const img = makeImageData([[64, 64, 64, 255]]);
    applyPipeline(img, adj({ brightness: 2.0 }));
    expect(img.data[0]).toBeGreaterThan(100);
  });

  it('contrast 0 flattens to mid-grey', () => {
    const img = makeImageData([[200, 200, 200, 255]]);
    applyPipeline(img, adj({ contrast: 0 }));
    expect(img.data[0]).toBeCloseTo(128, 0);
  });

  it('highlights positive raises bright pixels but not dark ones', () => {
    const bright = makeImageData([[220, 220, 220, 255]]);
    const dark   = makeImageData([[30, 30, 30, 255]]);
    applyPipeline(bright, adj({ highlights: 100 }));
    applyPipeline(dark,   adj({ highlights: 100 }));
    expect(bright.data[0]).toBeGreaterThan(220);
    expect(dark.data[0]).toBeCloseTo(30, 0);
  });

  it('shadows positive lifts dark pixels but not bright ones', () => {
    const dark  = makeImageData([[30, 30, 30, 255]]);
    const white = makeImageData([[240, 240, 240, 255]]);
    applyPipeline(dark,  adj({ shadows: 100 }));
    applyPipeline(white, adj({ shadows: 100 }));
    expect(dark.data[0]).toBeGreaterThan(30);
    expect(white.data[0]).toBeCloseTo(240, 0);
  });

  it('saturation 0 produces grayscale', () => {
    const img = makeImageData([[255, 0, 0, 255]]);
    applyPipeline(img, adj({ saturation: 0 }));
    expect(img.data[0]).toBeCloseTo(img.data[1], 5);
    expect(img.data[1]).toBeCloseTo(img.data[2], 5);
  });

  it('warm temperature raises R and lowers B', () => {
    const img = makeImageData([[128, 128, 128, 255]]);
    applyPipeline(img, adj({ temperature: 100 }));
    expect(img.data[0]).toBeGreaterThan(128);
    expect(img.data[2]).toBeLessThan(128);
  });

  it('cool temperature raises B and lowers R', () => {
    const img = makeImageData([[128, 128, 128, 255]]);
    applyPipeline(img, adj({ temperature: -100 }));
    expect(img.data[2]).toBeGreaterThan(128);
    expect(img.data[0]).toBeLessThan(128);
  });

  it('applies curveLUT correctly', () => {
    const img = makeImageData([[100, 100, 100, 255]]);
    const lut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) lut[i] = 255 - i;
    applyPipeline(img, adj({ curveLUT: lut }));
    expect(img.data[0]).toBe(155);
  });

  it('grain adds non-zero noise', () => {
    let changed = 0;
    for (let i = 0; i < 20; i++) {
      const img = makeImageData([[128, 128, 128, 255]]);
      applyPipeline(img, adj({ grain: 1 }));
      if (img.data[0] !== 128) changed++;
    }
    expect(changed).toBeGreaterThan(10);
  });
});
