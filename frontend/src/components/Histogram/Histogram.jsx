import { useEffect, useRef } from 'react';

export default function Histogram({ imageURL, adjustments }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!imageURL || !canvasRef.current) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Sample at small size for speed
      const size = 80;
      const scale = Math.min(1, size / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);

      const offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      const ctx = offscreen.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);

      const r = new Uint32Array(256);
      const g = new Uint32Array(256);
      const b = new Uint32Array(256);
      for (let i = 0; i < data.length; i += 4) {
        r[data[i]]++;
        g[data[i + 1]]++;
        b[data[i + 2]]++;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const cctx = canvas.getContext('2d');
      cctx.clearRect(0, 0, cw, ch);

      const maxVal = Math.max(...r, ...g, ...b, 1);
      const barW = cw / 256;

      const drawChannel = (counts, color) => {
        cctx.fillStyle = color;
        cctx.beginPath();
        for (let i = 0; i < 256; i++) {
          const barH = (counts[i] / maxVal) * ch;
          cctx.rect(i * barW, ch - barH, barW, barH);
        }
        cctx.fill();
      };

      drawChannel(r, 'rgba(239,68,68,0.55)');
      drawChannel(g, 'rgba(34,197,94,0.55)');
      drawChannel(b, 'rgba(59,130,246,0.55)');
    };
    img.src = imageURL;
  }, [imageURL]);

  return (
    <canvas
      ref={canvasRef}
      width={256}
      height={44}
      className="w-full"
      style={{ imageRendering: 'pixelated', display: 'block' }}
    />
  );
}
