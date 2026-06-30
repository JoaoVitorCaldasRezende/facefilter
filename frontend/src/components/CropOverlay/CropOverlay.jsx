import { useState, useCallback, useEffect, useRef } from 'react';

const HANDLES = ['nw','n','ne','e','se','s','sw','w'];

function getHandlePos(id, box) {
  const { x, y, w, h } = box;
  const mid = { x: x + w / 2, y: y + h / 2 };
  const pos = {
    nw: { top: y, left: x },
    n:  { top: y, left: mid.x },
    ne: { top: y, left: x + w },
    e:  { top: mid.y, left: x + w },
    se: { top: y + h, left: x + w },
    s:  { top: y + h, left: mid.x },
    sw: { top: y + h, left: x },
    w:  { top: mid.y, left: x },
  };
  const cursors = { nw:'nw-resize', n:'n-resize', ne:'ne-resize', e:'e-resize', se:'se-resize', s:'s-resize', sw:'sw-resize', w:'w-resize' };
  return { ...pos[id], cursor: cursors[id] };
}

export default function CropOverlay({ imageRef, aspectRatio, onConfirm, onCancel }) {
  const [box, setBox] = useState(null);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    let active = true;
    let retries = 0;

    function initBox() {
      if (!active) return;
      const w = img.offsetWidth;
      const h = img.offsetHeight;
      if (w === 0 || h === 0) {
        if (retries < 30) {
          retries++;
          requestAnimationFrame(initBox);
        }
        return;
      }
      const pad = 0.15;
      let bw = w * (1 - pad * 2);
      let bh = h * (1 - pad * 2);
      if (aspectRatio) {
        const [ar, ab] = aspectRatio;
        if (bw / bh > ar / ab) bw = bh * (ar / ab);
        else bh = bw * (ab / ar);
      }
      setBox({ x: (w - bw) / 2, y: (h - bh) / 2, w: bw, h: bh });
    }

    if (img.complete) {
      initBox();
    } else {
      img.addEventListener('load', initBox);
    }

    return () => {
      active = false;
      img.removeEventListener('load', initBox);
    };
  }, [aspectRatio, imageRef]);

  // ── Unified pointer event handlers (mouse + touch) ────────────
  const onPointerDown = useCallback((e, handle) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { handle, startX: e.clientX, startY: e.clientY, startBox: { ...box } };
    setDragging(true);
  }, [box]);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current || !imageRef.current) return;
    const { offsetWidth: imgW, offsetHeight: imgH } = imageRef.current;
    const { handle, startX, startY, startBox: sb } = dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    let { x, y, w, h } = sb;

    if (handle === 'move') {
      x = Math.max(0, Math.min(imgW - w, sb.x + dx));
      y = Math.max(0, Math.min(imgH - h, sb.y + dy));
    } else {
      if (handle.includes('e')) w = Math.max(40, Math.min(imgW - sb.x, sb.w + dx));
      if (handle.includes('w')) { x = Math.max(0, Math.min(sb.x + sb.w - 40, sb.x + dx)); w = sb.w - (x - sb.x); }
      if (handle.includes('s')) h = Math.max(40, Math.min(imgH - sb.y, sb.h + dy));
      if (handle.includes('n')) { y = Math.max(0, Math.min(sb.y + sb.h - 40, sb.y + dy)); h = sb.h - (y - sb.y); }
      if (aspectRatio) {
        const [ar, ab] = aspectRatio;
        if (handle.includes('e') || handle.includes('w')) h = w * (ab / ar);
        else w = h * (ar / ab);
      }
    }
    setBox({ x, y, w, h });
  }, [aspectRatio, imageRef]);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup',   onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup',   onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  function handleConfirm() {
    if (!box || !imageRef.current) return;
    const img = imageRef.current;
    const scaleX = img.naturalWidth  / img.offsetWidth;
    const scaleY = img.naturalHeight / img.offsetHeight;
    onConfirm({
      x: Math.round(box.x * scaleX),
      y: Math.round(box.y * scaleY),
      width:  Math.round(box.w * scaleX),
      height: Math.round(box.h * scaleY),
    });
  }

  if (!box) return null;

  const { x, y, w, h } = box;
  const outsidePath = `0 0, 100% 0, 100% 100%, 0 100%, 0 ${y}px, ${x}px ${y}px, ${x}px ${y+h}px, ${x+w}px ${y+h}px, ${x+w}px ${y}px, 0 ${y}px`;

  return (
    <div className="absolute inset-0 z-20" style={{ touchAction: 'none' }}>
      {/* Dark overlay outside crop area */}
      <div
        className="absolute inset-0 bg-black/60 pointer-events-none transition-colors duration-300"
        style={{ clipPath: `polygon(${outsidePath})` }}
      />

      {/* Crop box — draggable to move */}
      <div
        className="absolute border border-white shadow-[0_0_0_1.5px_rgba(0,0,0,0.6)]"
        style={{ top: y, left: x, width: w, height: h, cursor: 'move', touchAction: 'none' }}
        onPointerDown={(e) => onPointerDown(e, 'move')}
      >
        {/* Rule-of-thirds grid */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={`v${i}`}
            className={`absolute inset-y-0 w-px bg-white/35 pointer-events-none transition-opacity duration-300 ${
              dragging ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              left: `${(i + 1) * 33.33}%`,
              boxShadow: '0 0 2px rgba(0,0,0,0.5)'
            }}
          />
        ))}
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={`h${i}`}
            className={`absolute inset-x-0 h-px bg-white/35 pointer-events-none transition-opacity duration-300 ${
              dragging ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              top: `${(i + 1) * 33.33}%`,
              boxShadow: '0 0 2px rgba(0,0,0,0.5)'
            }}
          />
        ))}
      </div>

      {/* Handles — large touch target, small visual */}
      {HANDLES.map(id => {
        const { top, left, cursor } = getHandlePos(id, box);
        return (
          <div
            key={id}
            className="absolute flex items-center justify-center"
            style={{
              top, left,
              width: 44, height: 44,
              transform: 'translate(-50%, -50%)',
              cursor,
              touchAction: 'none',
            }}
            onPointerDown={(e) => onPointerDown(e, id)}
          >
            {/* Visual corner handles (L-shapes) */}
            {id === 'nw' && (
              <div className="absolute top-[20px] left-[20px] w-5 h-5 border-t-[3px] border-l-[3px] border-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.7)]" />
            )}
            {id === 'ne' && (
              <div className="absolute top-[20px] right-[20px] w-5 h-5 border-t-[3px] border-r-[3px] border-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.7)]" />
            )}
            {id === 'se' && (
              <div className="absolute bottom-[20px] right-[20px] w-5 h-5 border-b-[3px] border-r-[3px] border-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.7)]" />
            )}
            {id === 'sw' && (
              <div className="absolute bottom-[20px] left-[20px] w-5 h-5 border-b-[3px] border-l-[3px] border-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.7)]" />
            )}

            {/* Visual side handles (centered bars) */}
            {id === 'n' && (
              <div className="w-5 h-[3px] bg-white rounded-full drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.7)]" />
            )}
            {id === 's' && (
              <div className="w-5 h-[3px] bg-white rounded-full drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.7)]" />
            )}
            {id === 'e' && (
              <div className="w-[3px] h-5 bg-white rounded-full drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.7)]" />
            )}
            {id === 'w' && (
              <div className="w-[3px] h-5 bg-white rounded-full drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.7)]" />
            )}
          </div>
        );
      })}

      {/* Confirm / Cancel buttons */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30 pointer-events-auto">
        <button
          onClick={onCancel}
          className="px-5 py-2 text-[10px] font-bold tracking-[0.15em] uppercase bg-bg-surface/90 text-text-secondary border border-border-main rounded-md shadow-xl hover:text-text-primary hover:border-border-light transition-all backdrop-blur-md cursor-pointer select-none"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          className="px-5 py-2 text-[10px] font-bold tracking-[0.15em] uppercase bg-accent text-bg-base rounded-md shadow-xl hover:opacity-95 hover:shadow-[0_0_15px_rgba(45,212,191,0.4)] transition-all cursor-pointer select-none"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}
