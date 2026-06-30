import { describe, it, expect } from 'vitest';
import { buildCurveLUT } from '../buildCurveLUT';

describe('buildCurveLUT', () => {
  it('identity curve returns linear LUT (input = output)', () => {
    const lut = buildCurveLUT([[0, 0], [255, 255]]);
    expect(lut[0]).toBe(0);
    expect(lut[128]).toBeCloseTo(128, 5);
    expect(lut[255]).toBe(255);
  });

  it('LUT has exactly 256 entries', () => {
    const lut = buildCurveLUT([[0, 0], [255, 255]]);
    expect(lut.length).toBe(256);
  });

  it('all LUT values are between 0 and 255', () => {
    const lut = buildCurveLUT([[0, 0], [128, 180], [255, 255]]);
    for (let i = 0; i < 256; i++) {
      expect(lut[i]).toBeGreaterThanOrEqual(0);
      expect(lut[i]).toBeLessThanOrEqual(255);
    }
  });

  it('control point [128, 180] lifts mid-tones above 128', () => {
    const lut = buildCurveLUT([[0, 0], [128, 180], [255, 255]]);
    expect(lut[128]).toBeGreaterThan(128);
  });

  it('control point [128, 76] darkens mid-tones below 128', () => {
    const lut = buildCurveLUT([[0, 0], [128, 76], [255, 255]]);
    expect(lut[128]).toBeLessThan(128);
  });

  it('endpoint [0, 50] lifts shadows', () => {
    const lut = buildCurveLUT([[0, 50], [255, 255]]);
    expect(lut[0]).toBe(50);
  });
});
