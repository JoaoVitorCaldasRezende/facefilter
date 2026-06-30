import { useState, useRef } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 20 * 1024 * 1024;

function validate(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Formato inválido. Use JPG, PNG ou WebP.';
  if (file.size > MAX_SIZE_BYTES) return `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 20MB.`;
  return null;
}

export default function DropZone({ onFile }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  function handleFile(file) {
    const err = validate(file);
    if (err) { setError(err); return; }
    setError(null);
    onFile(file);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onInputChange(e) {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex-1 flex flex-col items-center justify-center cursor-pointer select-none relative overflow-hidden transition-colors duration-300
        ${dragging ? 'bg-accent/[0.025]' : 'bg-bg-base hover:bg-bg-surface/30'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={onInputChange}
        className="hidden"
      />

      {/* Corner bracket marks — viewfinder motif */}
      <div className="absolute inset-10 pointer-events-none">
        <div className={`absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 transition-colors duration-300 ${dragging ? 'border-accent' : 'border-border-light'}`} />
        <div className={`absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 transition-colors duration-300 ${dragging ? 'border-accent' : 'border-border-light'}`} />
        <div className={`absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 transition-colors duration-300 ${dragging ? 'border-accent' : 'border-border-light'}`} />
        <div className={`absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 transition-colors duration-300 ${dragging ? 'border-accent' : 'border-border-light'}`} />
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center gap-8 z-10">
        <div className={`relative transition-all duration-300 ${dragging ? 'scale-105' : ''}`}>
          <div className={`w-16 h-16 border flex items-center justify-center transition-all duration-300
            ${dragging
              ? 'border-accent/60 bg-accent/10 shadow-[0_0_40px_rgba(45,212,191,0.12)]'
              : 'border-border-light bg-bg-surface'
            }`}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              className={`transition-colors duration-300 ${dragging ? 'text-accent' : 'text-text-muted'}`}
            >
              <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12M8.5 7.5L12 4l3.5 3.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="text-center flex flex-col items-center gap-2">
          <p className={`text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-300 ${dragging ? 'text-accent' : 'text-text-primary'}`}>
            {dragging ? '— SOLTE AQUI —' : 'ARRASTE SUA FOTO'}
          </p>
          <p className="text-[9px] text-text-muted tracking-[0.05em]">
            ou{' '}
            <span className="text-accent/80 hover:text-accent underline underline-offset-2 transition-colors">
              selecione um arquivo
            </span>
          </p>
          <p className="text-[9px] text-text-muted/50 tracking-[0.12em] uppercase mt-1">
            JPG · PNG · WebP · Max 20MB
          </p>
        </div>
      </div>

      {error && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-bg-surface border border-red-500/25 text-red-400/90 text-[9px] tracking-wide whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}
