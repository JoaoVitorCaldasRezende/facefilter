export default function ExportingOverlay({ format }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        {/* Spinner com ring pulsante */}
        <div className="relative w-14 h-14">
          {/* Ring pulsante de fundo */}
          <div
            className="absolute inset-0 rounded-full border border-accent/30 animate-pulse-ring"
          />
          {/* Arco giratório */}
          <svg
            className="absolute inset-0 w-full h-full animate-spin-slow"
            viewBox="0 0 56 56"
            fill="none"
          >
            <circle
              cx="28" cy="28" r="24"
              stroke="#2DD4BF"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="75 76"
              strokeDashoffset="0"
            />
          </svg>
          {/* Ponto central */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          </div>
        </div>

        {/* Texto */}
        <div className="text-center flex flex-col gap-1.5">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-text-primary">
            Preparando arquivo
          </p>
          <p className="text-[9px] text-text-muted tracking-wide">
            Aplicando ajustes em resolução original
            {format === 'png' ? ' · PNG' : ' · JPEG'}
            <span className="inline-block w-8 text-left ml-0.5 animate-[ellipsis_1.5s_steps(4,end)_infinite]">...</span>
          </p>
        </div>
      </div>
    </div>
  );
}
