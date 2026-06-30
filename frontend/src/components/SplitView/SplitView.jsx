import { useState, useCallback, useEffect, useRef } from 'react';
import { useRenderer } from '../../hooks/useRenderer';
import { DEFAULT_ADJUSTMENTS } from '../../utils/buildFilterString';

export default function SplitView({ imageURL, adjustments, cropBox }) {
  const [splitPos, setSplitPos]   = useState(50); // 0-100 %
  const isDragging  = useRef(false);
  const containerRef = useRef(null);

  const { canvasRef: originalRef, naturalSizeRef } = useRenderer(imageURL, DEFAULT_ADJUSTMENTS);
  const { canvasRef: editedRef }                   = useRenderer(imageURL, adjustments);

  // Drag handlers
  const onMouseMove = useCallback((e) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos  = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    setSplitPos(pos);
  }, []);

  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // Crop clip-path (percentage-based, scale-invariant)
  let cropClip;
  if (cropBox && naturalSizeRef.current) {
    const { w: nw, h: nh } = naturalSizeRef.current;
    const top    = (cropBox.y / nh * 100).toFixed(3);
    const right  = ((nw - cropBox.x - cropBox.width)  / nw * 100).toFixed(3);
    const bottom = ((nh - cropBox.y - cropBox.height) / nh * 100).toFixed(3);
    const left   = (cropBox.x / nw * 100).toFixed(3);
    cropClip = `inset(${top}% ${right}% ${bottom}% ${left}%)`;
  }

  const canvasBase = {
    display: 'block',
    maxWidth: '100%',
    maxHeight: 'calc(100vh - 60px)',
  };

  return (
    <div className="flex-1 bg-slate-950 flex items-center justify-center overflow-hidden relative">
      <div ref={containerRef} className="relative inline-block select-none">
        {/* Original — full width, clipped to left of split */}
        <canvas
          ref={originalRef}
          style={{
            ...canvasBase,
            ...(cropClip ? { clipPath: cropClip } : {}),
          }}
        />

        {/* Edited — positioned on top, clipped to right of split */}
        <canvas
          ref={editedRef}
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            clipPath: `inset(0 0 0 ${splitPos}%)`,
          }}
        />

        {/* Divider line + handle */}
        <div
          className="absolute top-0 bottom-0 z-20 flex items-center justify-center cursor-ew-resize"
          style={{ left: `${splitPos}%`, transform: 'translateX(-50%)' }}
          onMouseDown={(e) => { e.preventDefault(); isDragging.current = true; }}
        >
          {/* Linha */}
          <div className="absolute top-0 bottom-0 w-px bg-white/70" />
          {/* Handle */}
          <div className="relative z-10 w-7 h-7 rounded-full bg-bg-surface border border-white/50 flex items-center justify-center shadow-lg">
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" className="text-white/70">
              <path d="M1 5h10M4 2L1 5l3 3M8 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Labels */}
        <span
          className="absolute top-3 text-[8px] font-bold tracking-[0.18em] uppercase text-white/40 pointer-events-none"
          style={{ right: `${100 - splitPos + 2}%` }}
        >
          ANTES
        </span>
        <span
          className="absolute top-3 text-[8px] font-bold tracking-[0.18em] uppercase text-white/40 pointer-events-none"
          style={{ left: `${splitPos + 2}%` }}
        >
          DEPOIS
        </span>
      </div>
    </div>
  );
}
