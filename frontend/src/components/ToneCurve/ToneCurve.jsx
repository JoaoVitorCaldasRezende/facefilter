import { useState, useCallback, useRef, useEffect } from 'react';

const SIZE = 200;

function sortPoints(points) {
  return [...points].sort((a, b) => a[0] - b[0]);
}

function pointsToSvgPath(points) {
  if (points.length < 2) return '';
  const sorted = sortPoints(points);
  
  // Convert points to SVG coordinates
  const svgPoints = sorted.map(([x, y]) => [
    (x * SIZE) / 255,
    SIZE - (y * SIZE) / 255
  ]);

  const k = svgPoints.length - 1;
  const slopes = [];
  
  // Calculate slopes/tangents at each control point
  for (let i = 0; i <= k; i++) {
    if (i === 0) {
      const dx = svgPoints[1][0] - svgPoints[0][0];
      const dy = svgPoints[1][1] - svgPoints[0][1];
      slopes.push(dx === 0 ? 0 : dy / dx);
    } else if (i === k) {
      const dx = svgPoints[k][0] - svgPoints[k - 1][0];
      const dy = svgPoints[k][1] - svgPoints[k - 1][1];
      slopes.push(dx === 0 ? 0 : dy / dx);
    } else {
      const dxL = svgPoints[i][0] - svgPoints[i - 1][0];
      const dyL = svgPoints[i][1] - svgPoints[i - 1][1];
      const slopeL = dxL === 0 ? 0 : dyL / dxL;

      const dxR = svgPoints[i + 1][0] - svgPoints[i][0];
      const dyR = svgPoints[i + 1][1] - svgPoints[i][1];
      const slopeR = dxR === 0 ? 0 : dyR / dxR;

      slopes.push((slopeL + slopeR) / 2);
    }
  }

  let d = `M ${svgPoints[0].join(' ')}`;
  for (let i = 0; i < k; i++) {
    const [x1, y1] = svgPoints[i];
    const [x2, y2] = svgPoints[i + 1];
    const dx = x2 - x1;
    const s_i = slopes[i];
    const s_next = slopes[i + 1];

    const cpx1 = x1 + dx / 3;
    const cpy1 = y1 + s_i * (dx / 3);
    const cpx2 = x2 - dx / 3;
    const cpy2 = y2 - s_next * (dx / 3);

    d += ` C ${cpx1.toFixed(3)} ${cpy1.toFixed(3)}, ${cpx2.toFixed(3)} ${cpy2.toFixed(3)}, ${x2.toFixed(3)} ${y2.toFixed(3)}`;
  }
  return d;
}

export default function ToneCurve({ curvePoints, onChange }) {
  const svgRef = useRef(null);
  const draggingRef = useRef(null); // { index, startX, startY, startPoint }
  const wasDraggingRef = useRef(false);
  const [, forceUpdate] = useState(0);

  const toSvgCoords = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(SIZE, ((e.clientX - rect.left) / rect.width) * SIZE));
    const y = Math.max(0, Math.min(SIZE, ((e.clientY - rect.top) / rect.height) * SIZE));
    return [Math.round(x * 255 / SIZE), Math.round((SIZE - y) * 255 / SIZE)];
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!draggingRef.current) return;
    wasDraggingRef.current = true;
    const { index } = draggingRef.current;
    const [nx, ny] = toSvgCoords(e);
    const newPoints = [...curvePoints];
    // Endpoints can only move on Y axis
    if (curvePoints[index][0] === 0) newPoints[index] = [0, ny];
    else if (curvePoints[index][0] === 255) newPoints[index] = [255, ny];
    else newPoints[index] = [nx, ny];
    onChange(newPoints);
  }, [curvePoints, onChange, toSvgCoords]);

  const onPointerUp = useCallback(() => {
    draggingRef.current = null;
    forceUpdate(n => n + 1);
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup',   onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup',   onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  function handleSvgClick(e) {
    if (wasDraggingRef.current) {
      // Consume the drag release click
      wasDraggingRef.current = false;
      return;
    }
    if (draggingRef.current) return;
    const [nx, ny] = toSvgCoords(e);
    // Don't add if too close to existing point
    const tooClose = curvePoints.some(p => Math.abs(p[0] - nx) < 12);
    if (tooClose || curvePoints.length >= 8) return;
    onChange([...curvePoints, [nx, ny]]);
  }

  function handlePointPointerDown(e, index) {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = { index };
    wasDraggingRef.current = false;
    e.target.setPointerCapture(e.pointerId);
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
        Clique para adicionar ponto · Clique direito (ou pressione e segure no celular) para remover
      </p>

      <div className="border border-border-main bg-bg-base p-1">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full aspect-square cursor-crosshair select-none"
          style={{ touchAction: 'none' }}
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
                r="7"
                fill="#090910"
                stroke="#2DD4BF"
                strokeWidth="1.5"
                style={{ cursor: 'grab', touchAction: 'none' }}
                onPointerDown={(e) => handlePointPointerDown(e, origIdx)}
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
