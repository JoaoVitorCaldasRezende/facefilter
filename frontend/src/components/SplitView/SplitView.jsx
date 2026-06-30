import { useState, useCallback, useEffect, useRef } from 'react';
import { useRenderer } from '../../hooks/useRenderer';
import { DEFAULT_ADJUSTMENTS } from '../../utils/buildFilterString';

export default function SplitView({ imageURL, adjustments, cropBox }) {
  const [splitPos, setSplitPos] = useState(50); // 0-100 %
  const [dragging, setDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const containerRef = useRef(null);

  const { canvasRef: originalRef, naturalSize } = useRenderer(imageURL, DEFAULT_ADJUSTMENTS);
  const { canvasRef: editedRef } = useRenderer(imageURL, adjustments);

  // Unified pointer handlers (mouse + touch)
  const onPointerMove = useCallback((e) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos  = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setSplitPos(pos);
  }, []);

  const onPointerUp = useCallback(() => {
    isDraggingRef.current = false;
    setDragging(false);
  }, []);

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation(); // Avoid triggering pan/grabbing on parent canvas container
    isDraggingRef.current = true;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup',   onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup',   onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  // Crop clip-path (percentage-based, scale-invariant)
  let cropClip;
  if (cropBox && naturalSize) {
    const { w: nw, h: nh } = naturalSize;
    const top    = (cropBox.y / nh * 100).toFixed(3);
    const right  = ((nw - cropBox.x - cropBox.width)  / nw * 100).toFixed(3);
    const bottom = ((nh - cropBox.y - cropBox.height) / nh * 100).toFixed(3);
    const left   = (cropBox.x / nw * 100).toFixed(3);
    cropClip = `inset(${top}% ${right}% ${bottom}% ${left}%)`;
  }

  const canvasBase = {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '100%',
  };

  return (
    <div ref={containerRef} className="relative inline-block select-none group/split">
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
        className="absolute top-0 bottom-0 z-20 flex items-center justify-center cursor-ew-resize w-10"
        style={{
          left: `${splitPos}%`,
          transform: 'translateX(-50%)',
          touchAction: 'none'
        }}
        onPointerDown={onPointerDown}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Vertical line with gradient and glow on hover/drag */}
        <div className={`absolute top-0 bottom-0 w-[2px] transition-all duration-300 ${
          dragging
            ? 'bg-accent shadow-[0_0_10px_rgba(45,212,191,0.8)]'
            : 'bg-gradient-to-b from-white/10 via-white/40 to-white/10 group-hover/split:via-white/70'
        }`} />

        {/* Glassmorphic Handle */}
        <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.6)] border ${
          dragging
            ? 'bg-bg-base/90 border-accent scale-110 shadow-[0_0_20px_rgba(45,212,191,0.5)]'
            : 'bg-bg-base/80 border-border-main hover:border-accent hover:scale-105 group-hover/split:border-border-light'
        } backdrop-blur-md`}>
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none" className={`transition-colors duration-300 ${
            dragging ? 'text-accent' : 'text-text-muted hover:text-text-primary'
          }`}>
            {/* Left arrow */}
            <path d="M5 2.5L1.5 6L5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Right arrow */}
            <path d="M9 2.5L12.5 6L9 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Labels - elegant pill badges floating at corners, fading when dragging */}
      <div
        className={`absolute left-4 top-4 z-10 px-2.5 py-1 rounded-md bg-bg-base/80 border border-border-main text-[9px] font-bold tracking-[0.15em] uppercase text-text-muted select-none backdrop-blur-sm pointer-events-none transition-all duration-300 shadow-md ${
          dragging ? 'opacity-0 scale-95 translate-y-[-4px]' : 'opacity-100 scale-100 translate-y-0'
        }`}
      >
        Antes
      </div>
      <div
        className={`absolute right-4 top-4 z-10 px-2.5 py-1 rounded-md bg-bg-base/80 border border-border-main text-[9px] font-bold tracking-[0.15em] uppercase text-text-muted select-none backdrop-blur-sm pointer-events-none transition-all duration-300 shadow-md ${
          dragging ? 'opacity-0 scale-95 translate-y-[-4px]' : 'opacity-100 scale-100 translate-y-0'
        }`}
      >
        Depois
      </div>
    </div>
  );
}
