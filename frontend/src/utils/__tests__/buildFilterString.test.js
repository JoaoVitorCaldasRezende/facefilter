import { describe, it, expect } from 'vitest';
import { buildFilterString, DEFAULT_ADJUSTMENTS } from '../buildFilterString';

describe('buildFilterString', () => {
  it('retorna string de filtro com valores padrão', () => {
    const result = buildFilterString(DEFAULT_ADJUSTMENTS);
    expect(result).toContain('brightness(1.000)');
    expect(result).toContain('contrast(1.000)');
    expect(result).toContain('saturate(1.000)');
    expect(result).toContain('sepia(0)');
  });

  it('multiplica brightness e exposure num único valor', () => {
    const result = buildFilterString({ ...DEFAULT_ADJUSTMENTS, brightness: 1.5, exposure: 1.2 });
    expect(result).toContain('brightness(1.800)');
  });

  it('inclui url(#sharpen) quando sharpness > 0', () => {
    const result = buildFilterString({ ...DEFAULT_ADJUSTMENTS, sharpness: 1 });
    expect(result).toContain('url(#sharpen)');
  });

  it('não inclui url(#sharpen) quando sharpness é 0', () => {
    const result = buildFilterString(DEFAULT_ADJUSTMENTS);
    expect(result).not.toContain('url(#sharpen)');
  });

  it('aplica sepia para temperatura quente (positiva)', () => {
    const result = buildFilterString({ ...DEFAULT_ADJUSTMENTS, temperature: 100 });
    expect(result).toContain('sepia(0.300)');
    expect(result).toContain('hue-rotate(-20.0deg)');
  });

  it('não aplica sepia para temperatura fria (negativa)', () => {
    const result = buildFilterString({ ...DEFAULT_ADJUSTMENTS, temperature: -100 });
    expect(result).toContain('sepia(0)');
    expect(result).toContain('hue-rotate(20.0deg)');
  });
});
