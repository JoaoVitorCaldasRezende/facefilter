import { useCallback } from 'react';
import { applyPipeline } from '../utils/renderPipeline';

export function useExport() {
  const exportToDataURL = useCallback(async (imageURL, adjustments, cropBox, { format = 'jpeg', quality = 0.95 } = {}) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageURL;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const src = cropBox ?? { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight };
    const rot = adjustments.rotation ?? 0;

    // For 90°/270° rotations, swap canvas dimensions
    const swapDims = Math.abs(rot) === 90 || Math.abs(rot) === 270;
    const canvasW = swapDims ? src.height : src.width;
    const canvasH = swapDims ? src.width  : src.height;

    const canvas = document.createElement('canvas');
    canvas.width  = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');

    // Apply geometric transforms (rotation + flip)
    ctx.save();
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.rotate((rot * Math.PI) / 180);
    if (adjustments.flipH) ctx.scale(-1, 1);
    if (adjustments.flipV) ctx.scale(1, -1);
    ctx.drawImage(
      img,
      src.x, src.y, src.width, src.height,
      -src.width / 2, -src.height / 2, src.width, src.height,
    );
    ctx.restore();

    // Apply pixel pipeline (all color/tonal adjustments)
    const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
    applyPipeline(imageData, adjustments);
    ctx.putImageData(imageData, 0, 0);

    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    return canvas.toDataURL(mimeType, format === 'png' ? undefined : quality);
  }, []);

  return { exportToDataURL };
}
