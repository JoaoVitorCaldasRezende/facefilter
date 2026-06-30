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

// ── Tonal pass ────────────────────────────────────────────────

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

    // Contrast
    r = (r - 0.5) * contrast + 0.5;
    g = (g - 0.5) * contrast + 0.5;
    b = (b - 0.5) * contrast + 0.5;

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Highlights
    if (highlights !== 0) {
      const hf = smoothstep(0.4, 1.0, lum);
      const delta = (highlights / 100) * 0.25 * hf;
      r += delta; g += delta; b += delta;
    }

    // Shadows
    if (shadows !== 0) {
      const sf = smoothstep(0.5, 0.0, lum);
      const delta = (shadows / 100) * 0.2 * sf;
      r += delta; g += delta; b += delta;
    }

    // Whites
    if (whites !== 0) {
      const wf = lum * lum;
      const delta = (whites / 100) * 0.2 * wf;
      r += delta; g += delta; b += delta;
    }

    // Blacks
    if (blacks !== 0) {
      const bf = (1 - lum) * (1 - lum);
      const delta = (blacks / 100) * 0.15 * bf;
      r += delta; g += delta; b += delta;
    }

    // Clarity
    if (clarity !== 0) {
      const mf = 4 * lum * (1 - lum);
      const delta = (clarity / 100) * 0.15 * mf * (lum - 0.5);
      r += delta; g += delta; b += delta;
    }

    // Dehaze
    if (dehaze !== 0) {
      const df = dehaze / 100;
      r -= df * 0.1 * (1 - r);
      g -= df * 0.1 * (1 - g);
      b -= df * 0.1 * (1 - b);
    }

    // Saturation + Vibrance
    if (saturation !== 1 || vibrance !== 0) {
      let [h, s, l2] = rgbToHsl(
        Math.max(0, Math.min(1, r)) * 255,
        Math.max(0, Math.min(1, g)) * 255,
        Math.max(0, Math.min(1, b)) * 255,
      );
      if (saturation !== 1) s = Math.max(0, Math.min(1, s * saturation));
      if (vibrance !== 0) {
        const vf = (1 - s);
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
        const strength = (zone.saturation / 100) * zoneStrength;

        // Caminho mais curto no círculo de hue (evita rotação de 340° em vez de -20°)
        let dh = targetH - h;
        if (dh > 0.5) dh -= 1;
        if (dh < -0.5) dh += 1;

        const newH = ((h + dh * strength * 0.8) + 1) % 1;
        const newS = Math.min(1, s + strength * 0.55);
        [r, g, b] = hslToRgb(newH, newS, l2).map(v => v / 255);
      }
    }

    // Tone Curve (LUT)
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

    // Pixels com baixa saturação têm hue instável — reduzir o efeito evita artefatos
    // em tecidos, peles e áreas neutras onde o hue varia pixel a pixel
    const satWeight = Math.min(1, s * 5); // efeito zero em s=0, completo em s>=0.2

    for (const range of HSL_RANGES) {
      const v = hslMixer[range.name];
      if (!v || (v.hue === 0 && v.saturation === 0 && v.luminance === 0)) continue;

      let dist = Math.abs(hDeg - range.center);
      if (dist > 180) dist = 360 - dist;

      // Smoothstep em vez de linear: transição suave nas bordas do range
      // evita o corte abrupto que causa o efeito "quebrado"
      const t = Math.max(0, 1 - dist / range.width);
      const influence = t * t * (3 - 2 * t) * satWeight;

      if (influence < 0.001) continue;

      h = (((h * 360) + v.hue * influence) % 360 + 360) % 360 / 360;
      s = Math.max(0, Math.min(1, s + (v.saturation / 100) * influence));
      l = Math.max(0, Math.min(1, l + (v.luminance / 100) * influence));
    }

    [data[i], data[i+1], data[i+2]] = hslToRgb(h, s, l);
  }
}

// ── Sharpness ─────────────────────────────────────────────────

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

// ── Noise Reduction ───────────────────────────────────────────

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

// ── Main Entry ────────────────────────────────────────────────

/**
 * Applies the full adjustment pipeline in-place to an ImageData-like object.
 * Order: tonal → HSL → sharpness → noise → grain → vignette
 * @param {{ data: Uint8ClampedArray, width: number, height: number }} imageData
 * @param {object} adjustments
 */
export function applyPipeline(imageData, adjustments) {
  const { data, width, height } = imageData;
  const len = width * height * 4;
  const { sharpness = 0, noiseReduction = 0, grain = 0, vignette = 0, hslMixer = null } = adjustments;

  applyTonalPass(data, len, adjustments);
  if (hslMixer) applyHSLMixer(data, len, hslMixer);
  applySharpness(data, width, height, sharpness);
  applyNoiseReduction(data, width, height, noiseReduction);
  applyGrain(data, len, grain);
  applyVignette(data, width, height, vignette);

  return imageData;
}
