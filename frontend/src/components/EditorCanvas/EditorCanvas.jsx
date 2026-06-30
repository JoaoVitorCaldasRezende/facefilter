import { useRef, useState, useCallback, useEffect } from 'react';
import PreviewCanvas from '../PreviewCanvas/PreviewCanvas';
import CropOverlay from '../CropOverlay/CropOverlay';
import SplitView from '../SplitView/SplitView';

const ZOOM_MIN  = 0.1;
const ZOOM_MAX  = 10;
const ZOOM_SNAP = [0.25, 0.5, 1, 1.5, 2, 3, 4]; // double-click cycles through these

export default function EditorCanvas({
  imageURL, adjustments, mode, cropBox,
  cropAspectRatio, onConfirmCrop, onCancelCrop,
  splitView = false,
}) {
  const imgRef       = useRef(null);
  const containerRef = useRef(null);
  const dragRef      = useRef(null); // { startX, startY, startPanX, startPanY }

  const [zoom, setZoom]         = useState(1);
  const [pan, setPan]           = useState({ x: 0, y: 0 });
  const [isDragging, setDragging] = useState(false);

  // Pan ref keeps in sync for use inside RAF-based mouse handlers
  const panRef  = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  panRef.current  = pan;
  zoomRef.current = zoom;

  // Reset when a new image is loaded
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [imageURL]);

  // ── Wheel zoom (centered on cursor) ──────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const prevZoom = zoomRef.current;
    const nextZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prevZoom * factor));
    if (nextZoom === prevZoom) return;

    const rect   = containerRef.current.getBoundingClientRect();
    const cx     = e.clientX - rect.left  - rect.width  / 2;
    const cy     = e.clientY - rect.top   - rect.height / 2;
    const scale  = nextZoom / prevZoom;
    const prevPan = panRef.current;

    setZoom(nextZoom);
    setPan({
      x: cx - (cx - prevPan.x) * scale,
      y: cy - (cy - prevPan.y) * scale,
    });
  }, []);

  // Attach wheel with { passive: false } so preventDefault works
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Pan (drag when zoomed in, middle-click, or left-click) ──
  const handleMouseDown = useCallback((e) => {
    if (mode === 'cropping') return; // CropOverlay handles its own drag
    const isPanGesture = e.button === 1 || e.button === 0;
    if (!isPanGesture) return;
    e.preventDefault();
    setDragging(true);
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      startPanX: panRef.current.x, startPanY: panRef.current.y,
    };
  }, [mode]);

  const handleMouseMove = useCallback((e) => {
    if (!dragRef.current) return;
    const { startX, startY, startPanX, startPanY } = dragRef.current;
    setPan({
      x: startPanX + (e.clientX - startX),
      y: startPanY + (e.clientY - startY),
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup',   handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup',   handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // ── Pinch zoom + single-touch pan ────────────────────────────
  const lastPinchDist = useRef(null);

  function handleTouchStart(e) {
    if (mode === 'cropping') return;
    if (e.touches.length === 2) {
      e.preventDefault();
      const [t1, t2] = e.touches;
      lastPinchDist.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    } else if (e.touches.length === 1) {
      e.preventDefault();
      setDragging(true);
      dragRef.current = {
        startX: e.touches[0].clientX, startY: e.touches[0].clientY,
        startPanX: panRef.current.x,  startPanY: panRef.current.y,
      };
    }
  }

  function handleTouchMove(e) {
    if (mode === 'cropping') return;
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      e.preventDefault();
      const [t1, t2] = e.touches;
      const newDist  = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const factor   = newDist / lastPinchDist.current;
      const prevZoom = zoomRef.current;
      const nextZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prevZoom * factor));

      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mx    = (t1.clientX + t2.clientX) / 2;
        const my    = (t1.clientY + t2.clientY) / 2;
        const cx    = mx - rect.left  - rect.width  / 2;
        const cy    = my - rect.top   - rect.height / 2;
        const scale = nextZoom / prevZoom;
        setZoom(nextZoom);
        setPan(p => ({ x: cx - (cx - p.x) * scale, y: cy - (cy - p.y) * scale }));
      }
      lastPinchDist.current = newDist;
    } else if (e.touches.length === 1 && dragRef.current) {
      e.preventDefault();
      const { startX, startY, startPanX, startPanY } = dragRef.current;
      setPan({
        x: startPanX + (e.touches[0].clientX - startX),
        y: startPanY + (e.touches[0].clientY - startY),
      });
    }
  }

  function handleTouchEnd(e) {
    if (e.touches.length < 2) lastPinchDist.current = null;
    if (e.touches.length === 0) {
      dragRef.current = null;
      setDragging(false);
    }
  }

  // ── Double-click: cycle through snap zoom levels ──────────────
  const handleDblClick = useCallback(() => {
    const current = zoomRef.current;
    const next    = ZOOM_SNAP.find(z => z > current + 0.05) ?? ZOOM_SNAP[0];
    setZoom(next);
    // Center on double-click position
    setPan({ x: 0, y: 0 });
  }, []);

  // ── Zoom controls ─────────────────────────────────────────────
  const zoomTo = useCallback((next) => {
    setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next)));
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomPercent = Math.round(zoom * 100);
  const isPannable  = true;

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-slate-950 overflow-hidden relative select-none"
      style={{
        cursor: isDragging ? 'grabbing' : isPannable ? 'grab' : 'default',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDblClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Transformed content layer */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center',
          willChange: 'transform',
        }}
      >
        <div className="relative inline-block">
          {mode === 'cropping' && (
            <img
              ref={imgRef}
              src={imageURL}
              aria-hidden alt=""
              className="absolute inset-0 opacity-0 pointer-events-none"
              style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 60px)', display: 'block' }}
            />
          )}
          {splitView && mode !== 'cropping' ? (
            <SplitView imageURL={imageURL} adjustments={adjustments} cropBox={cropBox} />
          ) : (
            <PreviewCanvas
              imageURL={imageURL}
              adjustments={adjustments}
              cropBox={mode !== 'cropping' ? cropBox : null}
              rotation={adjustments.rotation ?? 0}
              flipH={adjustments.flipH ?? false}
              flipV={adjustments.flipV ?? false}
            />
          )}

          {mode === 'cropping' && (
            <CropOverlay
              imageRef={imgRef}
              aspectRatio={cropAspectRatio}
              onConfirm={onConfirmCrop}
              onCancel={onCancelCrop}
            />
          )}
        </div>
      </div>

      {/* Zoom controls — bottom right */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-px bg-bg-surface/90 border border-border-main backdrop-blur-sm">
        <button
          onClick={() => zoomTo(zoom / 1.25)}
          className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-raised transition-all text-sm"
          title="Diminuir zoom (scroll ↓)"
        >
          −
        </button>

        <button
          onClick={() => zoomTo(1)}
          className="h-7 px-2 text-[9px] font-bold tabular-nums tracking-wide text-text-muted hover:text-accent hover:bg-bg-raised transition-all w-14 text-center"
          title="Zoom 100% — clique para resetar"
        >
          {zoomPercent}%
        </button>

        <button
          onClick={() => zoomTo(zoom * 1.25)}
          className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-raised transition-all text-sm"
          title="Aumentar zoom (scroll ↑)"
        >
          +
        </button>
      </div>
    </div>
  );
}
