import { useState } from 'react';

export default function ExportModal({ onConfirm, onCancel }) {
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(0.95);

  const qualityPercent = Math.round(quality * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-bg-surface border border-border-light w-[300px] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-main">
          <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-text-primary">
            Baixar Foto
          </h2>
        </div>

        <div className="px-5 py-5 flex flex-col gap-5">
          {/* Format selector */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-text-muted">Formato</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setFormat('png')}
                className={`flex-1 py-2.5 flex flex-col items-center gap-1 text-[9px] font-bold tracking-wide border transition-all
                  ${format === 'png' ? 'border-accent text-accent bg-accent/5' : 'border-border-main text-text-muted hover:border-border-light hover:text-text-secondary'}`}
              >
                PNG
                <span className="text-[8px] font-normal opacity-70">sem perda</span>
              </button>
              <button
                onClick={() => setFormat('jpeg')}
                className={`flex-1 py-2.5 flex flex-col items-center gap-1 text-[9px] font-bold tracking-wide border transition-all
                  ${format === 'jpeg' ? 'border-accent text-accent bg-accent/5' : 'border-border-main text-text-muted hover:border-border-light hover:text-text-secondary'}`}
              >
                JPEG
                <span className="text-[8px] font-normal opacity-70">arquivo menor</span>
              </button>
            </div>
          </div>

          {/* JPEG quality slider */}
          {format === 'jpeg' && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-baseline">
                <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-text-muted">Qualidade</span>
                <span className={`text-[10px] font-bold tabular-nums ${quality >= 0.9 ? 'text-accent' : quality >= 0.75 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {qualityPercent}%
                </span>
              </div>
              <div className="relative h-px bg-border-main" style={{ marginTop: '2px' }}>
                <div
                  className="absolute inset-y-0 left-0 bg-accent/70"
                  style={{ width: `${((quality - 0.5) / 0.5) * 100}%` }}
                />
                <div
                  className="absolute w-px h-2.5 bg-accent shadow-[0_0_5px_rgba(45,212,191,0.5)]"
                  style={{ left: `${((quality - 0.5) / 0.5) * 100}%`, top: '50%', transform: 'translate(-50%,-50%)' }}
                />
                <input
                  type="range" min={0.5} max={1.0} step={0.01} value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="absolute w-full opacity-0 cursor-pointer"
                  style={{ height: '20px', top: '50%', transform: 'translateY(-50%)', left: 0 }}
                />
              </div>
              <p className="text-[8px] text-text-muted leading-relaxed">
                {quality >= 0.9
                  ? 'Alta qualidade — diferença mínima para PNG.'
                  : quality >= 0.75
                  ? 'Qualidade média — artefatos leves em bordas finas.'
                  : 'Qualidade baixa — artefatos visíveis.'}
              </p>
            </div>
          )}

          {/* PNG info */}
          {format === 'png' && (
            <p className="text-[8px] text-text-muted leading-relaxed">
              PNG preserva cada pixel exatamente como processado. Arquivo maior, qualidade máxima. Ideal para continuar editando.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex border-t border-border-main">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-[9px] font-bold tracking-[0.15em] uppercase text-text-muted hover:text-text-secondary border-r border-border-main transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(format, quality)}
            className="flex-1 py-3 text-[9px] font-bold tracking-[0.15em] uppercase bg-accent text-bg-base hover:opacity-90 transition-all"
          >
            Baixar
          </button>
        </div>
      </div>
    </div>
  );
}
