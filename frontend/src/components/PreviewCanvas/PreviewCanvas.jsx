import { useRenderer } from '../../hooks/useRenderer';

export default function PreviewCanvas({ imageURL, adjustments, cropBox, rotation = 0, flipH = false, flipV = false }) {
  const { canvasRef, naturalSizeRef } = useRenderer(imageURL, adjustments);

  // Clip-path for crop preview using percentage coords
  let clipPath;
  if (cropBox && naturalSizeRef.current) {
    const { w: nw, h: nh } = naturalSizeRef.current;
    const top    = (cropBox.y / nh * 100).toFixed(3);
    const right  = ((nw - cropBox.x - cropBox.width)  / nw * 100).toFixed(3);
    const bottom = ((nh - cropBox.y - cropBox.height) / nh * 100).toFixed(3);
    const left   = (cropBox.x / nw * 100).toFixed(3);
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
