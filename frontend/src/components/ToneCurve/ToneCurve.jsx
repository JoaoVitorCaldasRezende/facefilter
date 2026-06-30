import { useState, useCallback, useRef, useEffect } from 'react';

const SIZE = 200;

function sortPoints(points) {
  return [...points].sort((a, b) => a[0] - b[0]);
}

function pointsToSvgPath(points) {
  if (points.length < 2) return '';
  const sorted = sortPoints(points);
  const toSvg = ([x, y]) => [x * SIZE / 255, SIZE - y * SIZE / 255];

  let d = `M ${toSvg(sorted[0]).join(' ')}`;
  for (let i = 1; i < sorted.length; i++) {
    const [x1, y1] = toSvg(sorted[i - 1]);
    const [x2, y2] = toSvg(sorted[i]);
    const cpx = (x2 - x1) * 0.4;
    d += ` C ${x1 + cpx} ${y1}, ${x2 - cpx} ${y2}, ${x2} ${y2}`;
  }
  return d;
}

export default function ToneCurve({ curvePoints, onChange }) {
  const svgRef = useRef(null);
  const draggingRef = useRef(null); // { index, startX, startY, startPoint }
  const [, forceUpdate] = useState(0);

  const toSvgCoords = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(SIZE, ((e.clientX - rect.left) / rect.width) * SIZE));
    const y = Math.max(0, Math.min(SIZE, ((e.clientY - rect.top) / rect.height) * SIZE));
    return [Math.round(x * 255 / SIZE), Math.round((SIZE - y) * 255 / SIZE)];
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!draggingRef.current) return;
    const { index } = draggingRef.current;
    const [nx, ny] = toSvgCoords(e);
    const newPoints = [...curvePoints];
    // Endpoints can only move on Y axis
    if (curvePoints[index][0] === 0) newPoints[index] = [0, ny];
    else if (curvePoints[index][0] === 255) newPoints[index] = [255, ny];
    else newPoints[index] = [nx, ny];
    onChange(newPoints);
  }, [curvePoints, onChange, toSvgCoords]);

  const onMouseUp = useCallback(() => {
    draggingRef.current = null;
    forceUpdate(n => n + 1);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  function handleSvgClick(e) {
    if (draggingRef.current) return;
    const [nx, ny] = toSvgCoords(e);
    // Don't add if too close to existing point
    const tooClose = curvePoints.some(p => Math.abs(p[0] - nx) < 12);
    if (tooClose || curvePoints.length >= 8) return;
    onChange([...curvePoints, [nx, ny]]);
  }

  function handlePointMouseDown(e, index) {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = { index };
  }

  function handlePointRightClick(e, index) {
    e.preventDefault();
    // Cannot remove endpoints
    if (curvePoints[index][0] === 0 || curvePoints[index][0] === 255 || curvePoints.length <= 2) return;
    onChange(curvePoints.filter((_, i) => i !== index));
  }

  const sorted = sortPoints(curvePoints);
  const path = pointsToSvgPath(sorted);
  const gridLines = [0.25, 0.5, 0.75];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[9px] text-text-muted tracking-wide leading-relaxed">
        Clique para adicionar ponto · Clique direito para remover
      </p>

      <div className="border border-border-main bg-bg-base p-1">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full aspect-square cursor-crosshair select-none"
          onMouseLeave={() => { draggingRef.current = null; }}
          onClick={handleSvgClick}
        >
          {/* Grid lines */}
          {gridLines.map(t => (
            <g key={t}>
              <line x1={t * SIZE} y1={0} x2={t * SIZE} y2={SIZE} stroke="#1A1A27" strokeWidth="1" />
              <line x1={0} y1={t * SIZE} x2={SIZE} y2={t * SIZE} stroke="#1A1A27" strokeWidth="1" />
            </g>
          ))}

          {/* Baseline diagonal */}
          <line x1={0} y1={SIZE} x2={SIZE} y2={0} stroke="#24243A" strokeWidth="1" strokeDasharray="4 4" />

          {/* Curve */}
          {path && (
            <path d={path} fill="none" stroke="#2DD4BF" strokeWidth="1.5" strokeLinecap="round" />
          )}

          {/* Control points */}
          {sorted.map((pt, i) => {
            const origIdx = curvePoints.findIndex(p => p[0] === pt[0] && p[1] === pt[1]);
            return (
              <circle
                key={`${pt[0]}-${pt[1]}-${i}`}
                cx={pt[0] * SIZE / 255}
                cy={SIZE - pt[1] * SIZE / 255}
                r="5"
                fill="#090910"
                stroke="#2DD4BF"
                strokeWidth="1.5"
                style={{ cursor: 'grab' }}
                onMouseDown={(e) => handlePointMouseDown(e, origIdx)}
                onContextMenu={(e) => handlePointRightClick(e, origIdx)}
              />
            );
          })}
        </svg>
      </div>

      <button
        onClick={() => onChange([[0, 0], [255, 255]])}
        className="py-2 text-[9px] font-bold tracking-[0.15em] uppercase text-text-muted hover:text-accent border border-border-main hover:border-accent/25 transition-all"
      >
        RESETAR CURVA
      </button>
    </div>
  );
}
