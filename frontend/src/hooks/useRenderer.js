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
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  return { imageData: ctx.getImageData(0, 0, w, h), scale };
}

export function useRenderer(imageURL, adjustments) {
  const canvasRef      = useRef(null);
  const sourceRef      = useRef(null);   // { imageData, scale }
  const naturalSizeRef = useRef(null);   // { w, h } of original
  const rafRef         = useRef(null);
  const adjustmentsRef = useRef(adjustments);

  // Always reflects latest adjustments inside the RAF callback
  adjustmentsRef.current = adjustments;

  const render = useCallback(() => {
    if (!canvasRef.current || !sourceRef.current) return;
    // Cancel any pending frame — only render the latest state
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const { imageData: src } = sourceRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = src.width;
      canvas.height = src.height;
      const ctx  = canvas.getContext('2d');
      const copy = new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
      applyPipeline(copy, adjustmentsRef.current);
      ctx.putImageData(copy, 0, 0);
    });
  }, []);

  // Reload source when imageURL changes
  useEffect(() => {
    if (!imageURL) {
      sourceRef.current      = null;
      naturalSizeRef.current = null;
      if (canvasRef.current) { canvasRef.current.width = 0; canvasRef.current.height = 0; }
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      naturalSizeRef.current = { w: img.naturalWidth, h: img.naturalHeight };
      sourceRef.current      = createScaledSource(img);
      render();
    };
    img.src = imageURL;
    return () => { cancelled = true; };
  }, [imageURL, render]);

  // Re-render on adjustment changes
  useEffect(() => { render(); }, [adjustments, render]);

  return { canvasRef, naturalSizeRef };
}
