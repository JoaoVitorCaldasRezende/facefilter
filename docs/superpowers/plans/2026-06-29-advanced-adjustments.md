# Advanced Adjustments — Lightroom-Style Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o FaceFilter de um editor básico em um editor profissional estilo Lightroom, com controles tonais avançados, mixer HSL, color grading, histograma, presets, curva de tons interativa e redução de ruído.

**Architecture:** A mudança central é migrar o preview de CSS `filter` em um `<img>` para um pipeline de pixels via Canvas API. Um novo `renderPipeline.js` contém toda a matemática de pixel e é compartilhado entre o preview (scaled, rápido) e o export (full-res). Isso torna todos os novos controles possíveis e garante consistência entre preview e export.

**Tech Stack:** React 19, Vite 8, Tailwind CSS 4, Canvas 2D API, SVG (ToneCurve), Vitest (testes de pipeline).

---

## Decisão Arquitetural: Por que migrar para Canvas?

Os novos controles (Highlights, Shadows, Whites, Blacks, Clarity, HSL, Color Grading, Tone Curve) são **operações pixel-level** que CSS `filter` não consegue expressar. A migração para Canvas unifica preview e export em um único pipeline, eliminando a divergência atual entre os dois.

**Estratégia de performance:** Para o preview, a imagem é escalada para no máximo 1440px no maior lado antes de processar — isso limita o processamento a ~2M pixels em vez de potencialmente 12M+ para fotos de câmera. O export usa sempre a resolução original.

---

## File Map

```
frontend/src/
  utils/
    renderPipeline.js         CRIAR — motor de pixel math (todas as operações)
    buildCurveLUT.js          CRIAR — Catmull-Rom spline → LUT de 256 entradas (Phase 3)
    buildFilterString.js      MANTER — DEFAULT_ADJUSTMENTS expandido, função CSS descontinuada
    __tests__/
      renderPipeline.test.js  CRIAR
      buildCurveLUT.test.js   CRIAR (Phase 3)
  hooks/
    useRenderer.js            CRIAR — gerencia canvas preview (carrega, escala, renderiza)
    usePresets.js             CRIAR (Phase 2) — save/load de presets em localStorage
    useEditor.js              MODIFICAR — DEFAULT_ADJUSTMENTS expandido com todas as novas chaves
    useExport.js              MODIFICAR — usa renderPipeline em vez de CSS filter
  components/
    PreviewCanvas/
      PreviewCanvas.jsx       CRIAR — substitui <img> + CSS filter no preview
    Histogram/
      Histogram.jsx           CRIAR (Phase 2) — histograma ao vivo
    HSLMixer/
      HSLMixer.jsx            CRIAR (Phase 2) — mixer por canal de cor
    ColorGrading/
      ColorGrading.jsx        CRIAR (Phase 2) — split toning (sombras/médios/luzes)
    ToneCurve/
      ToneCurve.jsx           CRIAR (Phase 3) — curva bezier interativa SVG
    AdjustmentsPanel/
      AdjustmentsPanel.jsx    MODIFICAR — novos tabs + seções colapsáveis
    EditorCanvas/
      EditorCanvas.jsx        MODIFICAR — usa PreviewCanvas, aplica rotation/flip via CSS
  pages/
    Editor/
      Editor.jsx              MODIFICAR — adiciona showOriginal toggle + presets
```

---

# FASE 1: Canvas Pipeline + Controles Estendidos

*Produza um editor funcional com todos os controles tonais (Highlights, Shadows, Whites, Blacks, Clarity, Dehaze, Tint, Vibrance, Grain, Rotation, Flip) e a comparação Antes/Depois.*

---

## Task 1: `renderPipeline.js` — Motor de Pixel Math (TDD)

**Files:**
- Create: `frontend/src/utils/renderPipeline.js`
- Create: `frontend/src/utils/__tests__/renderPipeline.test.js`

- [ ] **Step 1: Criar o arquivo de teste**

Criar `frontend/src/utils/__tests__/renderPipeline.test.js`:

```js
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
  it('passa imagem sem alteração com adjustments padrão', () => {
    const img = makeImageData([[128, 64, 32, 255]]);
    applyPipeline(img, adj());
    expect(img.data[0]).toBeCloseTo(128, -1);
    expect(img.data[1]).toBeCloseTo(64, -1);
    expect(img.data[2]).toBeCloseTo(32, -1);
  });

  it('brightness 2.0 dobra os valores dos pixels', () => {
    const img = makeImageData([[64, 64, 64, 255]]);
    applyPipeline(img, adj({ brightness: 2.0 }));
    expect(img.data[0]).toBeGreaterThan(100);
  });

  it('contrast 0 achata para cinza médio', () => {
    const img = makeImageData([[200, 200, 200, 255]]);
    applyPipeline(img, adj({ contrast: 0 }));
    expect(img.data[0]).toBeCloseTo(128, 0);
  });

  it('highlights positivo aumenta pixels claros sem afetar pretos', () => {
    const bright = makeImageData([[220, 220, 220, 255]]);
    const dark   = makeImageData([[30, 30, 30, 255]]);
    applyPipeline(bright, adj({ highlights: 100 }));
    applyPipeline(dark,   adj({ highlights: 100 }));
    expect(bright.data[0]).toBeGreaterThan(220);
    expect(dark.data[0]).toBeCloseTo(30, 0);
  });

  it('shadows positivo levanta pixels escuros sem afetar brancos', () => {
    const dark  = makeImageData([[30, 30, 30, 255]]);
    const white = makeImageData([[240, 240, 240, 255]]);
    applyPipeline(dark,  adj({ shadows: 100 }));
    applyPipeline(white, adj({ shadows: 100 }));
    expect(dark.data[0]).toBeGreaterThan(30);
    expect(white.data[0]).toBeCloseTo(240, 0);
  });

  it('saturation 0 produz imagem em escala de cinza', () => {
    const img = makeImageData([[255, 0, 0, 255]]);
    applyPipeline(img, adj({ saturation: 0 }));
    expect(img.data[0]).toBeCloseTo(img.data[1], 5);
    expect(img.data[1]).toBeCloseTo(img.data[2], 5);
  });

  it('temperatura positiva aquece (R sobe, B desce)', () => {
    const img = makeImageData([[128, 128, 128, 255]]);
    applyPipeline(img, adj({ temperature: 100 }));
    expect(img.data[0]).toBeGreaterThan(128); // R sobe
    expect(img.data[2]).toBeLessThan(128);    // B desce
  });

  it('temperatura negativa esfria (B sobe, R desce)', () => {
    const img = makeImageData([[128, 128, 128, 255]]);
    applyPipeline(img, adj({ temperature: -100 }));
    expect(img.data[2]).toBeGreaterThan(128); // B sobe
    expect(img.data[0]).toBeLessThan(128);    // R desce
  });

  it('aplica curveLUT corretamente', () => {
    const img = makeImageData([[100, 100, 100, 255]]);
    // LUT que inverte todos os valores
    const lut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) lut[i] = 255 - i;
    applyPipeline(img, adj({ curveLUT: lut }));
    expect(img.data[0]).toBe(155); // 255 - 100
  });

  it('grain adiciona ruído não-zero', () => {
    // Com grain, pixels mudam aleatoriamente
    let changed = 0;
    for (let i = 0; i < 20; i++) {
      const img = makeImageData([[128, 128, 128, 255]]);
      applyPipeline(img, adj({ grain: 1 }));
      if (img.data[0] !== 128) changed++;
    }
    expect(changed).toBeGreaterThan(10);
  });
});
```

- [ ] **Step 2: Rodar teste e confirmar FAIL**

```powershell
cd frontend
pnpm vitest run src/utils/__tests__/renderPipeline.test.js
```

Esperado: FAIL com `Cannot find module '../renderPipeline'`

- [ ] **Step 3: Criar `frontend/src/utils/renderPipeline.js`**

```js
// ── Helpers ──────────────────────────────────────────────────

function clamp255(v) { return v < 0 ? 0 : v > 255 ? 255 : Math.round(v); }

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r)      h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else                h = (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb(h, s, l) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  return [
    Math.round(hue2rgb(h + 1/3) * 255),
    Math.round(hue2rgb(h) * 255),
    Math.round(hue2rgb(h - 1/3) * 255),
  ];
}

// ── Tonal pass (single pixel loop) ───────────────────────────

function applyTonalPass(data, len, adj) {
  const {
    brightness = 1, exposure = 1, contrast = 1,
    highlights = 0, shadows = 0, whites = 0, blacks = 0,
    clarity = 0, dehaze = 0,
    temperature = 0, tint = 0,
    saturation = 1, vibrance = 0,
    colorGrading = null, curveLUT = null,
  } = adj;

  const bright = brightness * exposure;

  for (let i = 0; i < len; i += 4) {
    let r = data[i] / 255;
    let g = data[i+1] / 255;
    let b = data[i+2] / 255;

    // Temperature (warm = +R -B, cool = -R +B)
    if (temperature !== 0) {
      const t = temperature / 100;
      r = Math.min(1, r * (1 + t * 0.25));
      b = Math.min(1, b * (1 - t * 0.25));
    }

    // Tint (green-magenta axis)
    if (tint !== 0) {
      const t = tint / 100;
      g = Math.min(1, g * (1 - t * 0.15));
    }

    // Exposure + Brightness
    r = Math.min(1, r * bright);
    g = Math.min(1, g * bright);
    b = Math.min(1, b * bright);

    // Contrast: (v - 0.5) * contrast + 0.5
    r = (r - 0.5) * contrast + 0.5;
    g = (g - 0.5) * contrast + 0.5;
    b = (b - 0.5) * contrast + 0.5;

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Highlights (affects bright areas: lum 0.5 → 1.0)
    if (highlights !== 0) {
      const hf = smoothstep(0.4, 1.0, lum);
      const delta = (highlights / 100) * 0.25 * hf;
      r += delta; g += delta; b += delta;
    }

    // Shadows (affects dark areas: lum 0.0 → 0.5)
    if (shadows !== 0) {
      const sf = smoothstep(0.5, 0.0, lum);
      const delta = (shadows / 100) * 0.2 * sf;
      r += delta; g += delta; b += delta;
    }

    // Whites (upper clipping, quadratic weight)
    if (whites !== 0) {
      const wf = lum * lum;
      const delta = (whites / 100) * 0.2 * wf;
      r += delta; g += delta; b += delta;
    }

    // Blacks (lower clipping, quadratic weight)
    if (blacks !== 0) {
      const bf = (1 - lum) * (1 - lum);
      const delta = (blacks / 100) * 0.15 * bf;
      r += delta; g += delta; b += delta;
    }

    // Clarity (mid-tone contrast)
    if (clarity !== 0) {
      const mf = 4 * lum * (1 - lum); // bell curve, peak at lum=0.5
      const delta = (clarity / 100) * 0.15 * mf * (lum - 0.5);
      r += delta; g += delta; b += delta;
    }

    // Dehaze (cuts haze: darkens + increases contrast in mids)
    if (dehaze !== 0) {
      const df = dehaze / 100;
      r -= df * 0.1 * (1 - r);
      g -= df * 0.1 * (1 - g);
      b -= df * 0.1 * (1 - b);
    }

    // Saturation + Vibrance (need HSL)
    if (saturation !== 1 || vibrance !== 0) {
      let [h, s, l2] = rgbToHsl(
        Math.max(0, Math.min(1, r)) * 255,
        Math.max(0, Math.min(1, g)) * 255,
        Math.max(0, Math.min(1, b)) * 255,
      );
      if (saturation !== 1) s = Math.max(0, Math.min(1, s * saturation));
      if (vibrance !== 0) {
        const vf = (1 - s); // protects already-saturated colors
        s = Math.max(0, Math.min(1, s + (vibrance / 100) * 0.5 * vf));
      }
      [r, g, b] = hslToRgb(h, s, l2).map(v => v / 255);
    }

    // Color Grading (split toning)
    if (colorGrading) {
      const lumG = Math.max(0, Math.min(1, 0.299 * r + 0.587 * g + 0.114 * b));
      let zone = null, zoneStrength = 0;
      if (lumG < 0.333) {
        zone = colorGrading.shadows;
        zoneStrength = smoothstep(0.333, 0, lumG);
      } else if (lumG < 0.666) {
        zone = colorGrading.midtones;
        zoneStrength = 1 - Math.abs(lumG - 0.5) * 4;
      } else {
        zone = colorGrading.highlights;
        zoneStrength = smoothstep(0.666, 1.0, lumG);
      }
      if (zone && zone.saturation > 0 && zoneStrength > 0) {
        const [h, s, l2] = rgbToHsl(
          Math.max(0, Math.min(1, r)) * 255,
          Math.max(0, Math.min(1, g)) * 255,
          Math.max(0, Math.min(1, b)) * 255,
        );
        const targetH = zone.hue / 360;
        const influence = (zone.saturation / 100) * zoneStrength * 0.35;
        const blendH = h + (targetH - h) * influence;
        const blendS = Math.min(1, s + influence * 0.3);
        [r, g, b] = hslToRgb(blendH, blendS, l2).map(v => v / 255);
      }
    }

    // Tone Curve (LUT lookup)
    if (curveLUT) {
      const ri = Math.max(0, Math.min(255, Math.round(r * 255)));
      const gi = Math.max(0, Math.min(255, Math.round(g * 255)));
      const bi = Math.max(0, Math.min(255, Math.round(b * 255)));
      r = curveLUT[ri] / 255;
      g = curveLUT[gi] / 255;
      b = curveLUT[bi] / 255;
    }

    data[i]   = clamp255(r * 255);
    data[i+1] = clamp255(g * 255);
    data[i+2] = clamp255(b * 255);
  }
}

// ── HSL Mixer ─────────────────────────────────────────────────

const HSL_RANGES = [
  { name: 'red',     center: 0,   width: 25 },
  { name: 'orange',  center: 30,  width: 20 },
  { name: 'yellow',  center: 60,  width: 25 },
  { name: 'green',   center: 120, width: 40 },
  { name: 'aqua',    center: 180, width: 40 },
  { name: 'blue',    center: 240, width: 40 },
  { name: 'purple',  center: 290, width: 35 },
  { name: 'magenta', center: 330, width: 25 },
];

function applyHSLMixer(data, len, hslMixer) {
  const isNoop = Object.values(hslMixer).every(
    v => v.hue === 0 && v.saturation === 0 && v.luminance === 0
  );
  if (isNoop) return;

  for (let i = 0; i < len; i += 4) {
    let [h, s, l] = rgbToHsl(data[i], data[i+1], data[i+2]);
    const hDeg = h * 360;

    for (const range of HSL_RANGES) {
      const v = hslMixer[range.name];
      if (!v || (v.hue === 0 && v.saturation === 0 && v.luminance === 0)) continue;

      let dist = Math.abs(hDeg - range.center);
      if (dist > 180) dist = 360 - dist;
      const influence = Math.max(0, 1 - dist / range.width);
      if (influence === 0) continue;

      h = (((h * 360) + v.hue * influence) % 360 + 360) % 360 / 360;
      s = Math.max(0, Math.min(1, s + (v.saturation / 100) * influence));
      l = Math.max(0, Math.min(1, l + (v.luminance / 100) * influence));
    }

    [data[i], data[i+1], data[i+2]] = hslToRgb(h, s, l);
  }
}

// ── Sharpness (unsharp mask) ──────────────────────────────────

function applySharpness(data, width, height, amount) {
  if (amount <= 0) return;
  const copy = new Uint8ClampedArray(data);
  const k = amount * 0.3;
  const kernel = [0, -k, 0, -k, 1 + 4*k, -k, 0, -k, 0];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const v =
          kernel[0]*copy[((y-1)*width+(x-1))*4+c] + kernel[1]*copy[((y-1)*width+x)*4+c]   + kernel[2]*copy[((y-1)*width+(x+1))*4+c] +
          kernel[3]*copy[(y*width+(x-1))*4+c]     + kernel[4]*copy[i+c]                    + kernel[5]*copy[(y*width+(x+1))*4+c]     +
          kernel[6]*copy[((y+1)*width+(x-1))*4+c] + kernel[7]*copy[((y+1)*width+x)*4+c]   + kernel[8]*copy[((y+1)*width+(x+1))*4+c];
        data[i+c] = clamp255(v);
      }
    }
  }
}

// ── Noise Reduction (box blur) ────────────────────────────────

function applyNoiseReduction(data, width, height, amount) {
  if (amount <= 0) return;
  const copy = new Uint8ClampedArray(data);
  const radius = Math.max(1, Math.round(amount * 2));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            const j = (ny * width + nx) * 4;
            rSum += copy[j]; gSum += copy[j+1]; bSum += copy[j+2];
            count++;
          }
        }
      }
      const i = (y * width + x) * 4;
      const t = amount;
      data[i]   = clamp255(copy[i]   * (1 - t) + (rSum / count) * t);
      data[i+1] = clamp255(copy[i+1] * (1 - t) + (gSum / count) * t);
      data[i+2] = clamp255(copy[i+2] * (1 - t) + (bSum / count) * t);
    }
  }
}

// ── Grain ─────────────────────────────────────────────────────

function applyGrain(data, len, amount) {
  if (amount <= 0) return;
  const scale = amount * 50;
  for (let i = 0; i < len; i += 4) {
    const noise = (Math.random() - 0.5) * 2 * scale;
    data[i]   = clamp255(data[i]   + noise);
    data[i+1] = clamp255(data[i+1] + noise);
    data[i+2] = clamp255(data[i+2] + noise);
  }
}

// ── Vignette ─────────────────────────────────────────────────

function applyVignette(data, width, height, amount) {
  if (amount <= 0) return;
  const cx = width / 2, cy = height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxDist;
      const darken = 1 - amount * smoothstep(0.3, 1.0, dist) * 0.85;
      const i = (y * width + x) * 4;
      data[i]   = clamp255(data[i]   * darken);
      data[i+1] = clamp255(data[i+1] * darken);
      data[i+2] = clamp255(data[i+2] * darken);
    }
  }
}

// ── Main Entry Point ──────────────────────────────────────────

/**
 * Applies the full adjustment pipeline in-place to an ImageData-like object.
 * Order: tonal → HSL → sharpness → noise → grain → vignette
 */
export function applyPipeline(imageData, adjustments) {
  const { data, width, height } = imageData;
  const len = width * height * 4;

  const {
    sharpness = 0,
    noiseReduction = 0,
    grain = 0,
    vignette = 0,
    hslMixer = null,
  } = adjustments;

  applyTonalPass(data, len, adjustments);
  if (hslMixer) applyHSLMixer(data, len, hslMixer);
  applySharpness(data, width, height, sharpness);
  applyNoiseReduction(data, width, height, noiseReduction);
  applyGrain(data, len, grain);
  applyVignette(data, width, height, vignette);

  return imageData;
}
```

- [ ] **Step 4: Rodar teste e confirmar 10 PASS**

```powershell
pnpm vitest run src/utils/__tests__/renderPipeline.test.js
```

Esperado: 10 testes passando.

---

## Task 2: Expandir `DEFAULT_ADJUSTMENTS` com todas as novas chaves

**Files:**
- Modify: `frontend/src/utils/buildFilterString.js`

- [ ] **Step 1: Substituir o conteúdo de `buildFilterString.js`**

Manter a função `buildFilterString` exportada (para compatibilidade com testes existentes) mas expandir `DEFAULT_ADJUSTMENTS` com todas as novas chaves:

```js
export const DEFAULT_ADJUSTMENTS = {
  // Luz
  brightness:  1.0,
  exposure:    1.0,
  contrast:    1.0,
  highlights:  0,      // -100 a +100
  shadows:     0,      // -100 a +100
  whites:      0,      // -100 a +100
  blacks:      0,      // -100 a +100
  clarity:     0,      // -100 a +100
  dehaze:      0,      // -100 a +100

  // Cor
  temperature: 0,      // -100 a +100
  tint:        0,      // -100 a +100 (verde-magenta)
  vibrance:    0,      // -100 a +100
  saturation:  1.0,

  // Detalhe
  sharpness:      0,   // 0 a 3
  noiseReduction: 0,   // 0 a 1

  // Efeitos
  grain:   0,          // 0 a 1
  vignette: 0,         // 0 a 1

  // Transformação
  rotation: 0,         // -180 a +180 graus
  flipH:    false,
  flipV:    false,

  // HSL Mixer (Phase 2 — presença necessária para undo/redo correto)
  hslMixer: null,

  // Color Grading (Phase 2)
  colorGrading: null,

  // Tone Curve (Phase 3)
  curvePoints: [[0, 0], [255, 255]],
  curveLUT:    null,   // gerado a partir de curvePoints, não persistido
};

// Mantida apenas para compatibilidade com testes existentes de buildFilterString
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
```

- [ ] **Step 2: Confirmar que testes existentes ainda passam**

```powershell
pnpm vitest run
```

Esperado: todos os testes passando (27+ existentes + 10 novos do renderPipeline).

---

## Task 3: `useRenderer` hook — Preview via Canvas

**Files:**
- Create: `frontend/src/hooks/useRenderer.js`

- [ ] **Step 1: Criar `frontend/src/hooks/useRenderer.js`**

```js
import { useRef, useEffect, useCallback } from 'react';
import { applyPipeline } from '../utils/renderPipeline';

const MAX_PREVIEW_PX = 1440;

function createScaledSource(img) {
  const { naturalWidth: nw, naturalHeight: nh } = img;
  const scale = Math.min(1, MAX_PREVIEW_PX / Math.max(nw, nh));
  const w = Math.round(nw * scale);
  const h = Math.round(nh * scale);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').drawImage(img, 0, 0, w, h);
  return { imageData: c.getContext('2d').getImageData(0, 0, w, h), scale };
}

export function useRenderer(imageURL, adjustments) {
  const canvasRef = useRef(null);
  const sourceRef = useRef(null); // { imageData, scale }
  const naturalSizeRef = useRef(null); // { w, h } of original image
  const rafRef = useRef(null);
  const adjustmentsRef = useRef(adjustments);

  adjustmentsRef.current = adjustments;

  const render = useCallback(() => {
    if (!canvasRef.current || !sourceRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const { imageData: src } = sourceRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = src.width;
      canvas.height = src.height;
      const ctx = canvas.getContext('2d');
      const copy = new ImageData(
        new Uint8ClampedArray(src.data),
        src.width,
        src.height,
      );
      applyPipeline(copy, adjustmentsRef.current);
      ctx.putImageData(copy, 0, 0);
    });
  }, []);

  // Reload source when imageURL changes
  useEffect(() => {
    if (!imageURL) {
      sourceRef.current = null;
      naturalSizeRef.current = null;
      if (canvasRef.current) {
        canvasRef.current.width = 0;
        canvasRef.current.height = 0;
      }
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      naturalSizeRef.current = { w: img.naturalWidth, h: img.naturalHeight };
      sourceRef.current = createScaledSource(img);
      render();
    };
    img.src = imageURL;
  }, [imageURL, render]);

  // Re-render on adjustments change
  useEffect(() => {
    render();
  }, [adjustments, render]);

  return { canvasRef, naturalSizeRef };
}
```

---

## Task 4: `PreviewCanvas` component

**Files:**
- Create: `frontend/src/components/PreviewCanvas/PreviewCanvas.jsx`

- [ ] **Step 1: Criar `frontend/src/components/PreviewCanvas/PreviewCanvas.jsx`**

```jsx
import { useRenderer } from '../../hooks/useRenderer';

export default function PreviewCanvas({ imageURL, adjustments, cropBox, rotation = 0, flipH = false, flipV = false }) {
  const { canvasRef, naturalSizeRef } = useRenderer(imageURL, adjustments);

  // Clip-path for crop preview (same % math as before)
  let clipPath;
  if (cropBox && naturalSizeRef.current) {
    const { w: nw, h: nh } = naturalSizeRef.current;
    const top    = ((cropBox.y) / nh * 100).toFixed(3);
    const right  = ((nw - cropBox.x - cropBox.width)  / nw * 100).toFixed(3);
    const bottom = ((nh - cropBox.y - cropBox.height) / nh * 100).toFixed(3);
    const left   = ((cropBox.x) / nw * 100).toFixed(3);
    clipPath = `inset(${top}% ${right}% ${bottom}% ${left}%)`;
  }

  const transform = [
    rotation !== 0 ? `rotate(${rotation}deg)` : '',
    flipH ? 'scaleX(-1)' : '',
    flipV ? 'scaleY(-1)' : '',
  ].filter(Boolean).join(' ') || undefined;

  return (
    <canvas
      ref={canvasRef}
      style={{
        maxWidth: '100%',
        maxHeight: 'calc(100vh - 60px)',
        display: 'block',
        imageRendering: 'auto',
        ...(clipPath ? { clipPath } : {}),
        ...(transform ? { transform } : {}),
      }}
    />
  );
}
```

---

## Task 5: Atualizar `EditorCanvas` para usar `PreviewCanvas`

**Files:**
- Modify: `frontend/src/components/EditorCanvas/EditorCanvas.jsx`

- [ ] **Step 1: Substituir `frontend/src/components/EditorCanvas/EditorCanvas.jsx`**

```jsx
import PreviewCanvas from '../PreviewCanvas/PreviewCanvas';
import CropOverlay from '../CropOverlay/CropOverlay';
import { useRef } from 'react';

export default function EditorCanvas({
  imageURL, adjustments, mode, cropBox,
  cropAspectRatio, onConfirmCrop, onCancelCrop,
}) {
  const wrapperRef = useRef(null);

  return (
    <div
      ref={wrapperRef}
      className="flex-1 bg-slate-950 flex items-center justify-center overflow-hidden relative"
    >
      <div className="relative inline-block">
        <PreviewCanvas
          imageURL={imageURL}
          adjustments={adjustments}
          cropBox={mode !== 'cropping' ? cropBox : null}
          rotation={adjustments.rotation ?? 0}
          flipH={adjustments.flipH ?? false}
          flipV={adjustments.flipV ?? false}
        />

        {mode === 'cropping' && (
          <CropOverlayWrapper
            imageURL={imageURL}
            adjustments={adjustments}
            aspectRatio={cropAspectRatio}
            onConfirm={onConfirmCrop}
            onCancel={onCancelCrop}
          />
        )}
      </div>
    </div>
  );
}

// Wrapper que renderiza uma <img> invisível apenas para passar como imageRef ao CropOverlay
function CropOverlayWrapper({ imageURL, adjustments, aspectRatio, onConfirm, onCancel }) {
  const imgRef = useRef(null);
  return (
    <div className="absolute inset-0">
      <img ref={imgRef} src={imageURL} className="w-full h-full object-contain opacity-0 absolute" alt="" aria-hidden />
      <PreviewCanvas imageURL={imageURL} adjustments={adjustments} />
      <CropOverlay imageRef={imgRef} aspectRatio={aspectRatio} onConfirm={onConfirm} onCancel={onCancel} />
    </div>
  );
}
```

Nota: O `CropOverlay` ainda precisa de um `<img>` ref para calcular as dimensões. A solução acima usa um `<img>` invisível com os mesmos dimensions. Uma alternativa mais limpa é refatorar `CropOverlay` para aceitar `{ width, height }` diretamente — mas isso está fora do escopo desta tarefa.

- [ ] **Step 2: Iniciar dev server e verificar que o editor ainda funciona**

```powershell
cd frontend && pnpm dev
```

Abrir `http://localhost:5173`. Fazer upload de uma foto e verificar:
- A foto aparece no canvas ✓
- Sliders de brilho/contraste/saturação têm efeito ✓
- Temperatura funciona ✓

---

## Task 6: Atualizar `useExport` para usar `renderPipeline`

**Files:**
- Modify: `frontend/src/hooks/useExport.js`

- [ ] **Step 1: Substituir `frontend/src/hooks/useExport.js`**

```js
import { useCallback } from 'react';
import { applyPipeline } from '../utils/renderPipeline';

export function useExport() {
  const exportToDataURL = useCallback(async (imageURL, adjustments, cropBox) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageURL;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const src = cropBox ?? { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight };

    const canvas = document.createElement('canvas');

    // Handle rotation (90° multiples swap dimensions)
    const rot = adjustments.rotation ?? 0;
    const swapDims = Math.abs(rot) === 90 || Math.abs(rot) === 270;
    canvas.width  = swapDims ? src.height : src.width;
    canvas.height = swapDims ? src.width  : src.height;

    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rot * Math.PI) / 180);
    if (adjustments.flipH) ctx.scale(-1, 1);
    if (adjustments.flipV) ctx.scale(1, -1);
    ctx.drawImage(img, src.x, src.y, src.width, src.height, -src.width / 2, -src.height / 2, src.width, src.height);
    ctx.restore();

    // Apply pixel pipeline
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyPipeline(imageData, adjustments);
    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.92);
  }, []);

  return { exportToDataURL };
}
```

---

## Task 7: Before/After toggle

**Files:**
- Modify: `frontend/src/pages/Editor/Editor.jsx`
- Modify: `frontend/src/components/TopBar/TopBar.jsx`

- [ ] **Step 1: Adicionar estado `showOriginal` em `Editor.jsx`**

Localizar o bloco `const [cropAspectRatio, setCropAspectRatio] = useState(null);` e adicionar logo abaixo:

```jsx
const [showOriginal, setShowOriginal] = useState(false);
```

- [ ] **Step 2: Passar `showOriginal` para `EditorCanvas`**

No JSX de `EditorCanvas` no Editor.jsx, adicionar:
```jsx
<EditorCanvas
  imageURL={editor.imageURL}
  adjustments={showOriginal ? DEFAULT_ADJUSTMENTS : editor.adjustments}
  // ... resto das props
/>
```

Importar `DEFAULT_ADJUSTMENTS` no topo do Editor.jsx:
```js
import { DEFAULT_ADJUSTMENTS } from '../../utils/buildFilterString';
```

- [ ] **Step 3: Adicionar botão "Antes/Depois" na TopBar**

Em `TopBar.jsx`, no bloco `{mode === 'editing' && (`, adicionar antes do botão "Nova foto":

```jsx
<button
  onMouseDown={() => onToggleOriginal(true)}
  onMouseUp={() => onToggleOriginal(false)}
  onMouseLeave={() => onToggleOriginal(false)}
  title="Segurar para ver original"
  className="px-3 h-7 text-[9px] font-bold tracking-[0.15em] uppercase text-text-muted border border-border-main hover:border-border-light hover:text-text-secondary transition-all select-none"
>
  Y
</button>
```

Adicionar `onToggleOriginal` à assinatura de props da TopBar:
```jsx
export default function TopBar({ ..., onToggleOriginal, ... })
```

- [ ] **Step 4: Passar `onToggleOriginal` do Editor para TopBar**

No Editor.jsx, no JSX da TopBar:
```jsx
<TopBar
  onToggleOriginal={setShowOriginal}
  // ... resto das props
/>
```

---

## Task 8: Rotation e Flip (controles de transformação)

**Files:**
- Modify: `frontend/src/components/AdjustmentsPanel/AdjustmentsPanel.jsx`

O pipeline já suporta rotation/flipH/flipV via `adjustments`. Esta tarefa adiciona a UI.

- [ ] **Step 1: Adicionar tab TRANSFORMAR ao `AdjustmentsPanel`**

No array de tabs dentro do componente, adicionar:
```jsx
{ id: 'transformar', label: 'TRANSF.' }
```

- [ ] **Step 2: Adicionar conteúdo do tab TRANSFORMAR**

No bloco de conteúdo, após o tab 'recortar':

```jsx
{tab === 'transformar' && (
  <div className="flex flex-col gap-5">
    <SliderControl
      label="Rotação"
      value={adjustments.rotation ?? 0}
      min={-180}
      max={180}
      step={1}
      onChange={(v) => onAdjust('rotation', v)}
    />

    <div className="flex flex-col gap-2">
      <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-text-muted">Espelhar</span>
      <div className="flex gap-1.5">
        <button
          onClick={() => onAdjust('flipH', !adjustments.flipH)}
          className={`flex-1 py-2 text-[9px] font-bold tracking-wide border transition-all
            ${adjustments.flipH ? 'border-accent text-accent bg-accent/5' : 'border-border-main text-text-muted hover:border-accent/40 hover:text-accent'}`}
        >
          ↔ Horizontal
        </button>
        <button
          onClick={() => onAdjust('flipV', !adjustments.flipV)}
          className={`flex-1 py-2 text-[9px] font-bold tracking-wide border transition-all
            ${adjustments.flipV ? 'border-accent text-accent bg-accent/5' : 'border-border-main text-text-muted hover:border-accent/40 hover:text-accent'}`}
        >
          ↕ Vertical
        </button>
      </div>
    </div>

    <button
      onClick={() => { onAdjust('rotation', 0); onAdjust('flipH', false); onAdjust('flipV', false); }}
      className="py-2 text-[9px] font-bold tracking-[0.15em] uppercase text-text-muted hover:text-accent border border-border-main hover:border-accent/25 transition-all"
    >
      RESETAR
    </button>
  </div>
)}
```

---

## Task 9: Reestruturar `AdjustmentsPanel` com novos controles tonais e de cor

**Files:**
- Modify: `frontend/src/components/AdjustmentsPanel/AdjustmentsPanel.jsx`

Esta task adiciona os novos sliders (Highlights, Shadows, Whites, Blacks, Clarity, Dehaze, Tint, Vibrance, Grain) ao painel. Os tabs ficam: LUZ | COR | DETALHE | EFEITOS | TRANSF. | RECORTAR.

- [ ] **Step 1: Substituir o conteúdo completo de `AdjustmentsPanel.jsx`**

```jsx
import { useState } from 'react';
import SliderControl from '../SliderControl/SliderControl';

const LUZ_SLIDERS = [
  { key: 'exposure',    label: 'Exposição',    min: 0.5,  max: 1.5,  step: 0.01 },
  { key: 'brightness',  label: 'Brilho',       min: 0.0,  max: 2.0,  step: 0.01 },
  { key: 'contrast',    label: 'Contraste',    min: 0.0,  max: 2.0,  step: 0.01 },
  { key: 'highlights',  label: 'Realces',      min: -100, max: 100,  step: 1    },
  { key: 'shadows',     label: 'Sombras',      min: -100, max: 100,  step: 1    },
  { key: 'whites',      label: 'Brancos',      min: -100, max: 100,  step: 1    },
  { key: 'blacks',      label: 'Pretos',       min: -100, max: 100,  step: 1    },
  { key: 'clarity',     label: 'Clareza',      min: -100, max: 100,  step: 1    },
  { key: 'dehaze',      label: 'Neblina',      min: -100, max: 100,  step: 1    },
];

const COR_SLIDERS = [
  { key: 'temperature', label: 'Temperatura',  min: -100, max: 100,  step: 1    },
  { key: 'tint',        label: 'Matiz',         min: -100, max: 100,  step: 1    },
  { key: 'vibrance',    label: 'Vibração',      min: -100, max: 100,  step: 1    },
  { key: 'saturation',  label: 'Saturação',     min: 0.0,  max: 3.0,  step: 0.01 },
];

const DETALHE_SLIDERS = [
  { key: 'sharpness',      label: 'Nitidez',        min: 0,   max: 3.0, step: 0.1  },
  { key: 'noiseReduction', label: 'Redução Ruído',  min: 0,   max: 1.0, step: 0.01 },
];

const EFEITOS_SLIDERS = [
  { key: 'grain',   label: 'Grão',    min: 0, max: 1.0, step: 0.01 },
  { key: 'vignette',label: 'Vinheta', min: 0, max: 1.0, step: 0.01 },
];

const RATIOS = [
  { label: 'Livre', value: null },
  { label: '1:1',   value: [1, 1] },
  { label: '4:3',   value: [4, 3] },
  { label: '16:9',  value: [16, 9] },
  { label: '9:16',  value: [9, 16] },
];

const TABS = [
  { id: 'luz',       label: 'LUZ' },
  { id: 'cor',       label: 'COR' },
  { id: 'detalhe',   label: 'DETALHE' },
  { id: 'efeitos',   label: 'EFEITOS' },
  { id: 'transformar', label: 'TRANSF.' },
  { id: 'recortar',  label: 'RECORTAR' },
];

function SliderGroup({ sliders, adjustments, onAdjust }) {
  return (
    <div className="flex flex-col gap-6">
      {sliders.map(s => (
        <SliderControl
          key={s.key}
          label={s.label}
          value={adjustments[s.key] ?? 0}
          min={s.min}
          max={s.max}
          step={s.step}
          onChange={(v) => onAdjust(s.key, v)}
        />
      ))}
    </div>
  );
}

export default function AdjustmentsPanel({ adjustments, onAdjust, onReset, onStartCrop }) {
  const [tab, setTab] = useState('luz');

  return (
    <aside className="w-[260px] flex-shrink-0 bg-bg-surface border-l border-border-main flex flex-col overflow-hidden">
      {/* Tab bar — scrollable row */}
      <div className="flex border-b border-border-main flex-shrink-0 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 h-10 px-3 text-[9px] font-bold tracking-[0.14em] transition-all relative
              ${tab === t.id ? 'text-accent' : 'text-text-muted hover:text-text-secondary'}`}
          >
            {t.label}
            {tab === t.id && (
              <div className="absolute bottom-0 inset-x-0 h-px bg-accent shadow-[0_0_8px_rgba(45,212,191,0.4)]" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        {tab === 'luz' && (
          <>
            <SliderGroup sliders={LUZ_SLIDERS} adjustments={adjustments} onAdjust={onAdjust} />
            <button onClick={onReset} className="mt-6 w-full py-2 text-[9px] font-bold tracking-[0.15em] uppercase text-text-muted hover:text-accent border border-border-main hover:border-accent/25 transition-all">
              RESETAR TUDO
            </button>
          </>
        )}

        {tab === 'cor' && (
          <SliderGroup sliders={COR_SLIDERS} adjustments={adjustments} onAdjust={onAdjust} />
        )}

        {tab === 'detalhe' && (
          <SliderGroup sliders={DETALHE_SLIDERS} adjustments={adjustments} onAdjust={onAdjust} />
        )}

        {tab === 'efeitos' && (
          <SliderGroup sliders={EFEITOS_SLIDERS} adjustments={adjustments} onAdjust={onAdjust} />
        )}

        {tab === 'transformar' && (
          <div className="flex flex-col gap-5">
            <SliderControl
              label="Rotação"
              value={adjustments.rotation ?? 0}
              min={-180} max={180} step={1}
              onChange={(v) => onAdjust('rotation', v)}
            />
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-text-muted">Espelhar</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => onAdjust('flipH', !(adjustments.flipH ?? false))}
                  className={`flex-1 py-2 text-[9px] font-bold border transition-all ${(adjustments.flipH) ? 'border-accent text-accent bg-accent/5' : 'border-border-main text-text-muted hover:border-accent/40 hover:text-accent'}`}
                >↔ H</button>
                <button
                  onClick={() => onAdjust('flipV', !(adjustments.flipV ?? false))}
                  className={`flex-1 py-2 text-[9px] font-bold border transition-all ${(adjustments.flipV) ? 'border-accent text-accent bg-accent/5' : 'border-border-main text-text-muted hover:border-accent/40 hover:text-accent'}`}
                >↕ V</button>
              </div>
            </div>
          </div>
        )}

        {tab === 'recortar' && (
          <div className="flex flex-col gap-5">
            <p className="text-[9px] text-text-muted tracking-wide leading-relaxed">
              Escolha uma proporção e arraste os handles sobre a imagem.
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {RATIOS.map(r => (
                <button
                  key={r.label}
                  onClick={() => onStartCrop(r.value)}
                  className="py-3 text-[9px] font-bold tracking-[0.12em] border border-border-main hover:border-accent/40 hover:text-accent text-text-muted transition-all"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Rodar todos os testes**

```powershell
pnpm vitest run
```

Esperado: todos passando.

- [ ] **Step 3: Testar manualmente no browser**

Abrir `http://localhost:5173`, fazer upload e verificar:
- Sliders de Realces, Sombras, Brancos, Pretos têm efeito visível
- Slider de Clareza adiciona punch à imagem
- Temperatura + Matiz funcionam juntos
- Rotação rotaciona a imagem em tempo real
- Flip horizontal/vertical funcionam
- Botão Y (segurar) mostra original, soltar volta ao editado

---

# FASE 2: Ferramentas de Cor + UX

---

## Task 10: `HSLMixer` component

**Files:**
- Create: `frontend/src/components/HSLMixer/HSLMixer.jsx`

- [ ] **Step 1: Criar `frontend/src/components/HSLMixer/HSLMixer.jsx`**

```jsx
import { useState } from 'react';
import SliderControl from '../SliderControl/SliderControl';

const COLORS = [
  { key: 'red',     label: 'Vermelho', dot: '#ef4444' },
  { key: 'orange',  label: 'Laranja',  dot: '#f97316' },
  { key: 'yellow',  label: 'Amarelo',  dot: '#eab308' },
  { key: 'green',   label: 'Verde',    dot: '#22c55e' },
  { key: 'aqua',    label: 'Ciano',    dot: '#06b6d4' },
  { key: 'blue',    label: 'Azul',     dot: '#3b82f6' },
  { key: 'purple',  label: 'Roxo',     dot: '#a855f7' },
  { key: 'magenta', label: 'Magenta',  dot: '#ec4899' },
];

const DEFAULT_CHANNEL = { hue: 0, saturation: 0, luminance: 0 };

export default function HSLMixer({ hslMixer, onAdjust }) {
  const [selected, setSelected] = useState('red');
  const mixer = hslMixer ?? {};
  const current = mixer[selected] ?? DEFAULT_CHANNEL;

  function updateChannel(channel, value) {
    const next = { ...(mixer[selected] ?? DEFAULT_CHANNEL), [channel]: value };
    onAdjust('hslMixer', { ...mixer, [selected]: next });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Color selector */}
      <div className="grid grid-cols-4 gap-1">
        {COLORS.map(c => (
          <button
            key={c.key}
            onClick={() => setSelected(c.key)}
            className={`py-2 flex flex-col items-center gap-1 text-[8px] font-bold tracking-wide border transition-all
              ${selected === c.key ? 'border-accent bg-accent/5 text-accent' : 'border-border-main text-text-muted hover:border-border-light'}`}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.dot }} />
            {c.label}
          </button>
        ))}
      </div>

      {/* H/S/L sliders for selected color */}
      <div className="flex flex-col gap-5">
        <SliderControl label="Matiz"      value={current.hue}        min={-180} max={180} step={1}    onChange={(v) => updateChannel('hue', v)} />
        <SliderControl label="Saturação"  value={current.saturation} min={-100} max={100} step={1}    onChange={(v) => updateChannel('saturation', v)} />
        <SliderControl label="Luminância" value={current.luminance}  min={-100} max={100} step={1}    onChange={(v) => updateChannel('luminance', v)} />
      </div>

      <button
        onClick={() => onAdjust('hslMixer', null)}
        className="py-2 text-[9px] font-bold tracking-[0.15em] uppercase text-text-muted hover:text-accent border border-border-main hover:border-accent/25 transition-all"
      >
        RESETAR HSL
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Adicionar tab HSL ao `AdjustmentsPanel`**

No array `TABS`, adicionar após `'efeitos'`:
```jsx
{ id: 'hsl', label: 'HSL' },
```

No bloco de conteúdo, adicionar:
```jsx
{tab === 'hsl' && (
  <HSLMixer hslMixer={adjustments.hslMixer} onAdjust={onAdjust} />
)}
```

Importar no topo do AdjustmentsPanel:
```jsx
import HSLMixer from '../HSLMixer/HSLMixer';
```

---

## Task 11: `ColorGrading` component (Split Toning)

**Files:**
- Create: `frontend/src/components/ColorGrading/ColorGrading.jsx`

- [ ] **Step 1: Criar `frontend/src/components/ColorGrading/ColorGrading.jsx`**

```jsx
import SliderControl from '../SliderControl/SliderControl';

const ZONES = [
  { key: 'shadows',    label: 'Sombras' },
  { key: 'midtones',   label: 'Médios Tons' },
  { key: 'highlights', label: 'Realces' },
];

const DEFAULT_ZONE = { hue: 0, saturation: 0 };

export default function ColorGrading({ colorGrading, onAdjust }) {
  const grading = colorGrading ?? {};

  function updateZone(zone, field, value) {
    const current = grading[zone] ?? DEFAULT_ZONE;
    onAdjust('colorGrading', { ...grading, [zone]: { ...current, [field]: value } });
  }

  // Preview swatch color based on hue + saturation
  function swatchColor(zone) {
    const v = grading[zone] ?? DEFAULT_ZONE;
    if (v.saturation === 0) return 'transparent';
    return `hsl(${v.hue}, ${v.saturation}%, 50%)`;
  }

  return (
    <div className="flex flex-col gap-7">
      {ZONES.map(z => {
        const v = grading[z.key] ?? DEFAULT_ZONE;
        return (
          <div key={z.key} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border border-border-light"
                style={{ backgroundColor: swatchColor(z.key) }}
              />
              <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-text-secondary">{z.label}</span>
            </div>
            <SliderControl
              label="Matiz"
              value={v.hue}
              min={0} max={360} step={1}
              onChange={(val) => updateZone(z.key, 'hue', val)}
            />
            <SliderControl
              label="Saturação"
              value={v.saturation}
              min={0} max={100} step={1}
              onChange={(val) => updateZone(z.key, 'saturation', val)}
            />
          </div>
        );
      })}

      <button
        onClick={() => onAdjust('colorGrading', null)}
        className="py-2 text-[9px] font-bold tracking-[0.15em] uppercase text-text-muted hover:text-accent border border-border-main hover:border-accent/25 transition-all"
      >
        RESETAR GRADING
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Adicionar tab GRADING ao `AdjustmentsPanel`**

No array `TABS`, adicionar após `'hsl'`:
```jsx
{ id: 'grading', label: 'GRADING' },
```

No bloco de conteúdo:
```jsx
{tab === 'grading' && (
  <ColorGrading colorGrading={adjustments.colorGrading} onAdjust={onAdjust} />
)}
```

Importar:
```jsx
import ColorGrading from '../ColorGrading/ColorGrading';
```

---

## Task 12: `Histogram` component (ao vivo)

**Files:**
- Create: `frontend/src/components/Histogram/Histogram.jsx`
- Modify: `frontend/src/components/EditorCanvas/EditorCanvas.jsx`
- Modify: `frontend/src/pages/Editor/Editor.jsx`

- [ ] **Step 1: Criar `frontend/src/components/Histogram/Histogram.jsx`**

```jsx
import { useEffect, useRef } from 'react';

export default function Histogram({ imageURL, adjustments }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!imageURL || !canvasRef.current) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Read pixels from a tiny version of the image (64px max) for speed
      const offscreen = document.createElement('canvas');
      const size = 64;
      const scale = Math.min(1, size / Math.max(img.naturalWidth, img.naturalHeight));
      offscreen.width = Math.round(img.naturalWidth * scale);
      offscreen.height = Math.round(img.naturalHeight * scale);
      const ctx = offscreen.getContext('2d');
      ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
      const data = ctx.getImageData(0, 0, offscreen.width, offscreen.height).data;

      const r = new Uint32Array(256);
      const g = new Uint32Array(256);
      const b = new Uint32Array(256);
      for (let i = 0; i < data.length; i += 4) {
        r[data[i]]++; g[data[i+1]]++; b[data[i+2]]++;
      }

      const canvas = canvasRef.current;
      const w = canvas.width, h = canvas.height;
      const cctx = canvas.getContext('2d');
      cctx.clearRect(0, 0, w, h);

      const maxVal = Math.max(...r, ...g, ...b);
      const draw = (counts, color) => {
        cctx.beginPath();
        cctx.fillStyle = color;
        for (let i = 0; i < 256; i++) {
          const barH = (counts[i] / maxVal) * h;
          cctx.rect(i * (w / 256), h - barH, w / 256, barH);
        }
        cctx.fill();
      };

      draw(r, 'rgba(239,68,68,0.5)');
      draw(g, 'rgba(34,197,94,0.5)');
      draw(b, 'rgba(59,130,246,0.5)');
    };
    img.src = imageURL;
  }, [imageURL, adjustments]);

  return (
    <canvas
      ref={canvasRef}
      width={256}
      height={48}
      className="w-full h-12 opacity-70"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
```

- [ ] **Step 2: Adicionar Histogram no topo do `AdjustmentsPanel`**

Em `AdjustmentsPanel.jsx`, adicionar prop `imageURL` e importar Histogram:
```jsx
import Histogram from '../Histogram/Histogram';

export default function AdjustmentsPanel({ adjustments, onAdjust, onReset, onStartCrop, imageURL }) {
```

Dentro do `<aside>`, antes da barra de tabs, adicionar:
```jsx
{imageURL && (
  <div className="border-b border-border-main px-4 py-2 bg-bg-base/40">
    <Histogram imageURL={imageURL} adjustments={adjustments} />
  </div>
)}
```

- [ ] **Step 3: Passar `imageURL` para `AdjustmentsPanel` no `Editor.jsx`**

```jsx
<AdjustmentsPanel
  adjustments={editor.adjustments}
  onAdjust={editor.applyAdjustment}
  onReset={editor.reset}
  onStartCrop={handleStartCrop}
  imageURL={editor.imageURL}
/>
```

---

## Task 13: Presets system

**Files:**
- Create: `frontend/src/hooks/usePresets.js`
- Modify: `frontend/src/components/AdjustmentsPanel/AdjustmentsPanel.jsx`
- Modify: `frontend/src/pages/Editor/Editor.jsx`

- [ ] **Step 1: Criar `frontend/src/hooks/usePresets.js`**

```js
import { useState, useCallback } from 'react';

const PRESETS_KEY = 'facefilter_presets';

function load() {
  try { return JSON.parse(localStorage.getItem(PRESETS_KEY)) ?? []; }
  catch { return []; }
}

export function usePresets() {
  const [presets, setPresets] = useState(() => load());

  const savePreset = useCallback((name, adjustments) => {
    const preset = {
      id: crypto.randomUUID(),
      name,
      adjustments,
      savedAt: new Date().toISOString(),
    };
    setPresets(prev => {
      const updated = [preset, ...prev];
      localStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deletePreset = useCallback((id) => {
    setPresets(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { presets, savePreset, deletePreset };
}
```

- [ ] **Step 2: Adicionar tab PRESETS ao `AdjustmentsPanel`**

Adicionar no array `TABS`:
```jsx
{ id: 'presets', label: 'PRESETS' },
```

Adicionar props:
```jsx
export default function AdjustmentsPanel({ ..., presets, onSavePreset, onDeletePreset, onApplyPreset })
```

Adicionar conteúdo do tab:
```jsx
{tab === 'presets' && (
  <div className="flex flex-col gap-4">
    <button
      onClick={() => {
        const name = prompt('Nome do preset:');
        if (name?.trim()) onSavePreset(name.trim());
      }}
      className="py-2.5 text-[9px] font-bold tracking-[0.15em] uppercase text-accent border border-accent/30 bg-accent/5 hover:bg-accent/10 transition-all"
    >
      + SALVAR PRESET ATUAL
    </button>

    {presets.length === 0 && (
      <p className="text-[9px] text-text-muted text-center py-4">Nenhum preset salvo.</p>
    )}

    <div className="flex flex-col gap-1.5">
      {presets.map(p => (
        <div key={p.id} className="flex items-center gap-2 group">
          <button
            onClick={() => onApplyPreset(p.adjustments)}
            className="flex-1 py-2 px-3 text-left text-[9px] font-medium text-text-secondary hover:text-text-primary border border-border-main hover:border-border-light transition-all truncate"
          >
            {p.name}
          </button>
          <button
            onClick={() => onDeletePreset(p.id)}
            className="w-6 h-6 flex items-center justify-center text-[10px] text-text-muted hover:text-red-400 border border-border-main hover:border-red-500/30 transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 3: Wiring em `Editor.jsx`**

```jsx
import { usePresets } from '../../hooks/usePresets';

// No corpo do Editor:
const { presets, savePreset, deletePreset } = usePresets();

function handleApplyPreset(presetAdjustments) {
  // Aplica cada ajuste do preset via applyAdjustment (entra no histórico como um único passo)
  Object.entries(presetAdjustments).forEach(([key, value]) => {
    editor.applyAdjustment(key, value);
  });
}
```

Passar para AdjustmentsPanel:
```jsx
<AdjustmentsPanel
  presets={presets}
  onSavePreset={(name) => savePreset(name, editor.adjustments)}
  onDeletePreset={deletePreset}
  onApplyPreset={handleApplyPreset}
  // ... outras props
/>
```

---

# FASE 3: Ferramentas Avançadas

---

## Task 14: `buildCurveLUT.js` — Curva de Tons para LUT (TDD)

**Files:**
- Create: `frontend/src/utils/buildCurveLUT.js`
- Create: `frontend/src/utils/__tests__/buildCurveLUT.test.js`

- [ ] **Step 1: Criar arquivo de teste**

```js
import { describe, it, expect } from 'vitest';
import { buildCurveLUT } from '../buildCurveLUT';

describe('buildCurveLUT', () => {
  it('curva identidade retorna LUT linear (input = output)', () => {
    const lut = buildCurveLUT([[0, 0], [255, 255]]);
    expect(lut[0]).toBe(0);
    expect(lut[128]).toBeCloseTo(128, 5);
    expect(lut[255]).toBe(255);
  });

  it('LUT tem exatamente 256 entradas', () => {
    const lut = buildCurveLUT([[0, 0], [255, 255]]);
    expect(lut.length).toBe(256);
  });

  it('valores da LUT estão entre 0 e 255', () => {
    const lut = buildCurveLUT([[0, 0], [128, 180], [255, 255]]);
    for (let i = 0; i < 256; i++) {
      expect(lut[i]).toBeGreaterThanOrEqual(0);
      expect(lut[i]).toBeLessThanOrEqual(255);
    }
  });

  it('ponto de controle [128, 180] levanta os médios tons', () => {
    const lut = buildCurveLUT([[0, 0], [128, 180], [255, 255]]);
    expect(lut[128]).toBeGreaterThan(128); // médios tons mais brilhantes
  });

  it('ponto de controle [128, 76] escurece os médios tons', () => {
    const lut = buildCurveLUT([[0, 0], [128, 76], [255, 255]]);
    expect(lut[128]).toBeLessThan(128);
  });

  it('ponto no endpoint [0, 50] levanta as sombras', () => {
    const lut = buildCurveLUT([[0, 50], [255, 255]]);
    expect(lut[0]).toBe(50);
  });
});
```

- [ ] **Step 2: Rodar e confirmar FAIL**

```powershell
pnpm vitest run src/utils/__tests__/buildCurveLUT.test.js
```

Esperado: FAIL com `Cannot find module '../buildCurveLUT'`

- [ ] **Step 3: Criar `frontend/src/utils/buildCurveLUT.js`**

```js
/**
 * Gera uma LUT de 256 entradas a partir de pontos de controle [x, y].
 * Usa interpolação Catmull-Rom para curvas suaves entre os pontos.
 *
 * @param {Array<[number, number]>} points - Array de [input, output] (0-255 cada)
 * @returns {Uint8ClampedArray} LUT de 256 entradas
 */
export function buildCurveLUT(points) {
  if (!points || points.length < 2) {
    const lut = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) lut[i] = i;
    return lut;
  }

  // Sort by x and ensure endpoints
  const sorted = [...points].sort((a, b) => a[0] - b[0]);

  const lut = new Uint8ClampedArray(256);
  for (let x = 0; x < 256; x++) {
    lut[x] = Math.max(0, Math.min(255, Math.round(catmullRomInterpolate(sorted, x))));
  }
  return lut;
}

function catmullRomInterpolate(points, x) {
  if (x <= points[0][0]) return points[0][1];
  if (x >= points[points.length - 1][0]) return points[points.length - 1][1];

  // Find the segment containing x
  let i = 1;
  while (i < points.length - 1 && points[i][0] < x) i++;

  // Control points: p0, p1 (start of segment), p2 (end), p3
  const p0 = points[Math.max(0, i - 2)];
  const p1 = points[i - 1];
  const p2 = points[i];
  const p3 = points[Math.min(points.length - 1, i + 1)];

  // Parameter t ∈ [0, 1] within the segment
  const t = (x - p1[0]) / (p2[0] - p1[0]);
  const t2 = t * t;
  const t3 = t2 * t;

  // Catmull-Rom coefficients
  return (
    (-0.5 * p0[1] + 1.5 * p1[1] - 1.5 * p2[1] + 0.5 * p3[1]) * t3 +
    (p0[1] - 2.5 * p1[1] + 2.0 * p2[1] - 0.5 * p3[1]) * t2 +
    (-0.5 * p0[1] + 0.5 * p2[1]) * t +
    p1[1]
  );
}
```

- [ ] **Step 4: Rodar e confirmar 6 PASS**

```powershell
pnpm vitest run src/utils/__tests__/buildCurveLUT.test.js
```

Esperado: 6 testes passando.

---

## Task 15: `ToneCurve` component — Editor SVG Interativo

**Files:**
- Create: `frontend/src/components/ToneCurve/ToneCurve.jsx`

- [ ] **Step 1: Criar `frontend/src/components/ToneCurve/ToneCurve.jsx`**

```jsx
import { useState, useCallback, useRef } from 'react';
import { buildCurveLUT } from '../../utils/buildCurveLUT';

const SIZE = 200; // SVG viewBox size

function pointsToPath(points) {
  if (points.length < 2) return '';
  // Build smooth SVG path using cubic bezier approximation
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  let d = `M ${sorted[0][0] * SIZE / 255} ${SIZE - sorted[0][1] * SIZE / 255}`;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const cx1 = prev[0] * SIZE / 255 + (curr[0] - prev[0]) * SIZE / 255 * 0.4;
    const cy1 = SIZE - prev[1] * SIZE / 255;
    const cx2 = curr[0] * SIZE / 255 - (curr[0] - prev[0]) * SIZE / 255 * 0.4;
    const cy2 = SIZE - curr[1] * SIZE / 255;
    d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr[0] * SIZE / 255} ${SIZE - curr[1] * SIZE / 255}`;
  }
  return d;
}

export default function ToneCurve({ curvePoints, onChange }) {
  const [dragging, setDragging] = useState(null); // index of point being dragged
  const svgRef = useRef(null);
  const sorted = [...curvePoints].sort((a, b) => a[0] - b[0]);

  function svgCoords(e) {
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(SIZE, ((e.clientX - rect.left) / rect.width) * SIZE));
    const y = Math.max(0, Math.min(SIZE, ((e.clientY - rect.top) / rect.height) * SIZE));
    return [Math.round(x * 255 / SIZE), Math.round((SIZE - y) * 255 / SIZE)];
  }

  function handleMouseDown(e, index) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(index);
  }

  function handleSvgMouseMove(e) {
    if (dragging === null) return;
    const [nx, ny] = svgCoords(e);
    const newPoints = [...curvePoints];
    // Endpoints can only move Y; middle points move freely
    if (dragging === 0) newPoints[dragging] = [0, ny];
    else if (dragging === curvePoints.length - 1) newPoints[dragging] = [255, ny];
    else newPoints[dragging] = [nx, ny];
    onChange(newPoints);
  }

  function handleSvgMouseUp() {
    setDragging(null);
  }

  function handleSvgClick(e) {
    if (dragging !== null) return;
    const [nx, ny] = svgCoords(e);
    // Don't add if too close to existing point
    const tooClose = curvePoints.some(p => Math.abs(p[0] - nx) < 10);
    if (tooClose || curvePoints.length >= 8) return;
    onChange([...curvePoints, [nx, ny]]);
  }

  function removePoint(e, index) {
    e.preventDefault();
    e.stopPropagation();
    // Cannot remove endpoints
    if (index === 0 || curvePoints.length <= 2) return;
    const isEndpoint = curvePoints[index][0] === 0 || curvePoints[index][0] === 255;
    if (isEndpoint) return;
    onChange(curvePoints.filter((_, i) => i !== index));
  }

  const path = pointsToPath(sorted);

  return (
    <div className="flex flex-col gap-4">
      <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-text-muted">
        Clique para adicionar ponto · Clique direito para remover
      </span>

      <div className="border border-border-main bg-bg-base p-1">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full aspect-square cursor-crosshair"
          onMouseMove={handleSvgMouseMove}
          onMouseUp={handleSvgMouseUp}
          onMouseLeave={handleSvgMouseUp}
          onClick={handleSvgClick}
        >
          {/* Grid */}
          {[0.25, 0.5, 0.75].map(t => (
            <g key={t}>
              <line x1={t * SIZE} y1={0} x2={t * SIZE} y2={SIZE} stroke="#1A1A27" strokeWidth="1" />
              <line x1={0} y1={t * SIZE} x2={SIZE} y2={t * SIZE} stroke="#1A1A27" strokeWidth="1" />
            </g>
          ))}

          {/* Baseline diagonal */}
          <line x1={0} y1={SIZE} x2={SIZE} y2={0} stroke="#24243A" strokeWidth="1" strokeDasharray="4 4" />

          {/* Curve */}
          {path && (
            <path d={path} fill="none" stroke="#2DD4BF" strokeWidth="1.5" strokeLinecap="round" />
          )}

          {/* Control points */}
          {sorted.map((pt, i) => {
            const origIndex = curvePoints.indexOf(pt);
            return (
              <circle
                key={i}
                cx={pt[0] * SIZE / 255}
                cy={SIZE - pt[1] * SIZE / 255}
                r="4"
                fill="#090910"
                stroke="#2DD4BF"
                strokeWidth="1.5"
                className="cursor-grab"
                onMouseDown={(e) => handleMouseDown(e, origIndex)}
                onContextMenu={(e) => removePoint(e, origIndex)}
              />
            );
          })}
        </svg>
      </div>

      <button
        onClick={() => onChange([[0, 0], [255, 255]])}
        className="py-2 text-[9px] font-bold tracking-[0.15em] uppercase text-text-muted hover:text-accent border border-border-main hover:border-accent/25 transition-all"
      >
        RESETAR CURVA
      </button>
    </div>
  );
}
```

---

## Task 16: Integrar ToneCurve ao pipeline e ao AdjustmentsPanel

**Files:**
- Modify: `frontend/src/pages/Editor/Editor.jsx`
- Modify: `frontend/src/components/AdjustmentsPanel/AdjustmentsPanel.jsx`

- [ ] **Step 1: Calcular `curveLUT` em `Editor.jsx` e passar para adjustments**

O `curveLUT` é derivado de `curvePoints` mas não deve ser armazenado no histórico (é grande e é sempre recalculável). A solução: calcular no Editor e injetar nos adjustments antes de passar para o canvas.

```jsx
import { useMemo } from 'react';
import { buildCurveLUT } from '../../utils/buildCurveLUT';

// No corpo do Editor, após a linha da editor const:
const curveLUT = useMemo(() => {
  const pts = editor.adjustments.curvePoints;
  if (!pts || (pts.length === 2 && pts[0][0] === 0 && pts[0][1] === 0 && pts[1][0] === 255 && pts[1][1] === 255)) {
    return null; // identidade = sem LUT
  }
  return buildCurveLUT(pts);
}, [editor.adjustments.curvePoints]);

const adjustmentsWithLUT = useMemo(
  () => ({ ...editor.adjustments, curveLUT }),
  [editor.adjustments, curveLUT]
);
```

Substituir `editor.adjustments` por `adjustmentsWithLUT` nas props de `EditorCanvas` e `AdjustmentsPanel`.

- [ ] **Step 2: Adicionar tab CURVA ao `AdjustmentsPanel`**

No array `TABS`, adicionar:
```jsx
{ id: 'curva', label: 'CURVA' },
```

Adicionar prop `onCurveChange` e importar ToneCurve:
```jsx
import ToneCurve from '../ToneCurve/ToneCurve';

export default function AdjustmentsPanel({ ..., onCurveChange })
```

Adicionar conteúdo:
```jsx
{tab === 'curva' && (
  <ToneCurve
    curvePoints={adjustments.curvePoints ?? [[0,0],[255,255]]}
    onChange={onCurveChange}
  />
)}
```

- [ ] **Step 3: Passar `onCurveChange` do Editor**

```jsx
<AdjustmentsPanel
  onCurveChange={(pts) => editor.applyAdjustment('curvePoints', pts)}
  // ...
/>
```

- [ ] **Step 4: Verificar curva no browser**

Abrir o editor, fazer upload e ir para a aba CURVA:
- Clicar na área da curva para adicionar pontos
- Arrastar pontos para criar uma S-curve (levanta médios tons)
- A imagem deve responder em tempo real
- Clicar direito em ponto para remover
- "Resetar Curva" volta à diagonal

---

## Task 17: Rodar suite completa e verificação final

- [ ] **Step 1: Rodar todos os testes unitários**

```powershell
cd frontend && pnpm test
```

Esperado: todos passando (renderPipeline: 10 + buildCurveLUT: 6 + existentes: 27 = 43+).

- [ ] **Step 2: Build de produção**

```powershell
pnpm build
```

Esperado: build sem erros.

- [ ] **Step 3: Verificação manual completa**

Com `pnpm dev` rodando:

**Fase 1 checklist:**
- [ ] Upload → canvas renderiza corretamente
- [ ] Sliders LUZ (Realces, Sombras, Brancos, Pretos, Clareza) têm efeito visível e distinto
- [ ] Temperatura + Matiz funcionam conjuntamente
- [ ] Vibração protege mais cores saturadas do que Saturação pura
- [ ] Grão adiciona textura visível
- [ ] Rotação e Flip funcionam
- [ ] Botão Y (Antes/Depois) alterna corretamente
- [ ] Export gera arquivo com todos os ajustes aplicados

**Fase 2 checklist:**
- [ ] HSL: ajustar matiz do vermelho muda apenas tons vermelhos na imagem
- [ ] Color Grading: adicionar cor quente nas sombras + fria nos realces cria split tone
- [ ] Histograma atualiza ao mudar sliders
- [ ] Salvar preset → aparece na lista → aplicar preset restaura todos os ajustes → deletar preset funciona

**Fase 3 checklist:**
- [ ] ToneCurve: adicionar ponto e arrastar para cima levanta a imagem
- [ ] S-curve (ponto em 90,140 e 165,110) adiciona contraste de médios tons
- [ ] Resetar curva volta ao estado neutro
- [ ] Undo/redo inclui mudanças da curva no histórico

---

## Notas de Implementação

**Ordem obrigatória:** Tasks 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 (Fase 1), depois 10 → 11 → 12 → 13 (Fase 2), depois 14 → 15 → 16 → 17 (Fase 3). Cada fase deve ser completamente testada antes de iniciar a próxima.

**Performance:** O pipeline Canvas processa pixels em CPU. Para imagens grandes (4K+), o preview pode demorar 1-2 segundos após cada slider. Isso é aceitável para a fase atual. Se necessário no futuro, um Web Worker pode ser adicionado sem mudar a API de `renderPipeline`.

**CropOverlay e PreviewCanvas:** A Task 5 usa um `<img>` invisível como workaround para passar um `imageRef` ao `CropOverlay`. A refatoração correta seria fazer o `CropOverlay` aceitar `{ width, height }` diretamente — mas isso está fora do escopo deste plano.

**`curveLUT` não é persistido:** O campo `curveLUT` em `adjustments` é sempre derivado de `curvePoints` via `useMemo`. Isso significa que o histórico de undo/redo armazena apenas `curvePoints` (pequeno), não a LUT de 256 bytes. A LUT é recalculada automaticamente.

**Presets e `hslMixer`/`colorGrading`:** Esses campos são objetos aninhados. O `applyAdjustment` funciona fazendo `{ ...adjustments, [key]: value }` — funciona corretamente desde que o chamador passe o objeto inteiro atualizado (o que HSLMixer e ColorGrading fazem).
