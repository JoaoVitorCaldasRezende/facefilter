import { Link, useLocation } from 'react-router-dom';

export default function TopBar({ mode = 'idle', fileName, canUndo, canRedo, onUndo, onRedo, onNewPhoto, onExport, onToggleOriginal, splitView = false, onToggleSplitView }) {
  const location = useLocation();

  return (
    <header className="h-11 bg-bg-base border-b border-border-main flex items-center px-4 gap-3 flex-shrink-0">
      <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 select-none group">
        {/* Viewfinder logo mark */}
        <div className="w-5 h-5 relative flex items-center justify-center flex-shrink-0">
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-accent/60 group-hover:border-accent transition-colors" />
          <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-accent/60 group-hover:border-accent transition-colors" />
          <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-accent/60 group-hover:border-accent transition-colors" />
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-accent/60 group-hover:border-accent transition-colors" />
          <div className="w-1 h-1 rounded-full bg-accent/50 group-hover:bg-accent transition-colors" />
        </div>
        <span className="text-[10px] font-bold tracking-[0.22em] text-text-primary uppercase">
          FACE<span className="text-accent">FILTER</span>
        </span>
      </Link>

      {mode === 'editing' && (
        <>
          <div className="h-3 w-px bg-border-light mx-0.5" />
          {fileName && (
            <span className="text-[9px] text-text-muted truncate max-w-[180px] hidden sm:block tracking-wide italic">
              {fileName}
            </span>
          )}
          <div className="flex items-center gap-0.5">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Desfazer"
              className="w-7 h-7 flex items-center justify-center text-[11px] border border-border-main text-text-muted hover:border-accent/40 hover:text-accent disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              ↩
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Refazer"
              className="w-7 h-7 flex items-center justify-center text-[11px] border border-border-main text-text-muted hover:border-accent/40 hover:text-accent disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              ↪
            </button>
          </div>
        </>
      )}

      <nav className="ml-auto flex items-center gap-1.5">
        <Link
          to="/galeria"
          className={`px-3 h-7 flex items-center text-[9px] font-bold tracking-[0.15em] uppercase transition-all
            ${location.pathname === '/galeria'
              ? 'text-accent border border-accent/30 bg-accent/5'
              : 'text-text-muted border border-transparent hover:text-text-secondary hover:border-border-light'
            }`}
        >
          Galeria
        </Link>

        {mode === 'editing' && (
          <>
            <button
              onMouseDown={() => onToggleOriginal?.(true)}
              onMouseUp={() => onToggleOriginal?.(false)}
              onMouseLeave={() => onToggleOriginal?.(false)}
              title="Segurar para comparar com original"
              className="px-3 h-7 text-[9px] font-bold tracking-[0.15em] uppercase text-text-muted border border-border-main hover:border-border-light hover:text-text-secondary transition-all select-none"
            >
              Y
            </button>
            <button
              onClick={onToggleSplitView}
              title="Comparação lado a lado"
              className={`px-3 h-7 text-[9px] font-bold tracking-[0.15em] uppercase border transition-all select-none
                ${splitView
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-border-main text-text-muted hover:border-border-light hover:text-text-secondary'
                }`}
            >
              ◫
            </button>
            <button
              onClick={onNewPhoto}
              className="px-3 h-7 text-[9px] font-bold tracking-[0.15em] uppercase text-text-muted border border-border-main hover:border-border-light hover:text-text-secondary transition-all"
            >
              Nova foto
            </button>
            <button
              onClick={onExport}
              className="px-4 h-7 text-[9px] font-bold tracking-[0.15em] uppercase bg-accent text-bg-base hover:opacity-90 transition-all shadow-[0_0_16px_rgba(45,212,191,0.2)]"
            >
              Exportar
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
