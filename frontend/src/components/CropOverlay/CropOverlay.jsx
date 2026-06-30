import { useState, useCallback, useEffect, useRef } from 'react';

const HANDLES = ['nw','n','ne','e','se','s','sw','w'];

function getHandleStyle(id, box) {
  const { x, y, w, h } = box;
  const mid = { x: x + w / 2, y: y + h / 2 };
  const pos = {
    nw: { top: y - 5, left: x - 5 },
    n:  { top: y - 5, left: mid.x - 5 },
    ne: { top: y - 5, left: x + w - 5 },
    e:  { top: mid.y - 5, left: x + w - 5 },
    se: { top: y + h - 5, left: x + w - 5 },
    s:  { top: y + h - 5, left: mid.x - 5 },
    sw: { top: y + h - 5, left: x - 5 },
    w:  { top: mid.y - 5, left: x - 5 },
  };
  const cursors = { nw:'nw-resize', n:'n-resize', ne:'ne-resize', e:'e-resize', se:'se-resize', s:'s-resize', sw:'sw-resize', w:'w-resize' };
  return { ...pos[id], cursor: cursors[id] };
}

export default function CropOverlay({ imageRef, aspectRatio, onConfirm, onCancel }) {
  const [box, setBox] = useState(null);
  const dragRef = useRef(null);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;
    const { offsetWidth: w, offsetHeight: h } = img;
    const pad = 0.15;
    let bw = w * (1 - pad * 2);
    let bh = h * (1 - pad * 2);
    if (aspectRatio) {
      const [ar, ab] = aspectRatio;
      if (bw / bh > ar / ab) bw = bh * (ar / ab);
      else bh = bw * (ab / ar);
    }
    setBox({ x: (w - bw) / 2, y: (h - bh) / 2, w: bw, h: bh });
  }, [aspectRatio, imageRef]);

  const onMouseDown = useCallback((e, handle) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { handle, startX: e.clientX, startY: e.clientY, startBox: { ...box } };
  }, [box]);

  const onMouseMove = useCallback((e) => {
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
      if (handle.includes('e')) w = Math.max(30, Math.min(imgW - sb.x, sb.w + dx));
      if (handle.includes('w')) { x = Math.max(0, Math.min(sb.x + sb.w - 30, sb.x + dx)); w = sb.w - (x - sb.x); }
      if (handle.includes('s')) h = Math.max(30, Math.min(imgH - sb.y, sb.h + dy));
      if (handle.includes('n')) { y = Math.max(0, Math.min(sb.y + sb.h - 30, sb.y + dy)); h = sb.h - (y - sb.y); }
      if (aspectRatio) {
        const [ar, ab] = aspectRatio;
        if (handle.includes('e') || handle.includes('w')) h = w * (ab / ar);
        else w = h * (ar / ab);
      }
    }
    setBox({ x, y, w, h });
  }, [aspectRatio, imageRef]);

  const onMouseUp = useCallback(() => { dragRef.current = null; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  function handleConfirm() {
    if (!box || !imageRef.current) return;
    const img = imageRef.current;
    const scaleX = img.naturalWidth / img.offsetWidth;
    const scaleY = img.naturalHeight / img.offsetHeight;
    onConfirm({
      x: Math.round(box.x * scaleX),
      y: Math.round(box.y * scaleY),
      width: Math.round(box.w * scaleX),
      height: Math.round(box.h * scaleY),
    });
  }

  if (!box) return null;

  const { x, y, w, h } = box;
  const outsidePath = `0 0, 100% 0, 100% 100%, 0 100%, 0 ${y}px, ${x}px ${y}px, ${x}px ${y+h}px, ${x+w}px ${y+h}px, ${x+w}px ${y}px, 0 ${y}px`;

  return (
    <div className="absolute inset-0 z-20">
      <div className="absolute inset-0 bg-black/55 pointer-events-none" style={{ clipPath: `polygon(${outsidePath})` }} />

      <div
        className="absolute border border-white/70"
        style={{ top: y, left: x, width: w, height: h, cursor: 'move' }}
        onMouseDown={(e) => onMouseDown(e, 'move')}
      >
        {/* Rule-of-thirds grid */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`v${i}`} className="absolute inset-y-0 border-l border-white/20" style={{ left: `${(i+1) * 33.33}%` }} />
          ))}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`h${i}`} className="absolute inset-x-0 border-t border-white/20" style={{ top: `${(i+1) * 33.33}%` }} />
          ))}
        </div>
      </div>

      {HANDLES.map(id => (
        <div
          key={id}
          className="absolute w-2.5 h-2.5 bg-white border border-black/20 rounded-sm shadow-sm"
          style={{ position: 'absolute', ...getHandleStyle(id, box) }}
          onMouseDown={(e) => onMouseDown(e, id)}
        />
      ))}

      <div className="absolute flex gap-2 z-10" style={{ top: Math.min(y + h + 10, (imageRef.current?.offsetHeight ?? 400) - 50), left: x }}>
        <button onClick={handleConfirm} className="px-3 py-1.5 text-xs font-bold bg-blue-brand text-white rounded-lg shadow-lg hover:bg-blue-light transition-all">
          Confirmar
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 text-xs font-bold bg-bg-surface/90 text-text-secondary border border-border-main rounded-lg shadow-lg hover:text-white transition-all">
          Cancelar
        </button>
      </div>
    </div>
  );
}
