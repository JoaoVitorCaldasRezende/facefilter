import { Link, useLocation } from 'react-router-dom';

export default function TopBar({ mode = 'idle', fileName, canUndo, canRedo, onUndo, onRedo, onNewPhoto, onExport, splitView = false, onToggleSplitView }) {
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

      <nav className="ml-auto flex items-center gap-1.5 min-w-0">
        {/* Galeria — oculto no mobile para ganhar espaço */}
        <Link
          to="/galeria"
          className={`hidden sm:flex px-3 h-7 items-center text-[9px] font-bold tracking-[0.15em] uppercase transition-all
            ${location.pathname === '/galeria'
              ? 'text-accent border border-accent/30 bg-accent/5'
              : 'text-text-muted border border-transparent hover:text-text-secondary hover:border-border-light'
            }`}
        >
          Galeria
        </Link>

        {mode === 'editing' && (
          <>

            {/* Split — visível no mobile e desktop */}
            <button
              onClick={onToggleSplitView}
              title="Comparação lado a lado"
              className={`flex px-3 h-7 items-center justify-center border transition-all select-none
                ${splitView
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-border-main text-text-muted hover:border-border-light hover:text-text-secondary'
                }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="1.5" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </svg>
            </button>

            {/* Nova foto — apenas desktop */}
            <button
              onClick={onNewPhoto}
              title="Nova foto"
              className="hidden sm:block h-7 px-3 text-[9px] font-bold tracking-[0.15em] uppercase text-text-muted border border-border-main hover:border-border-light hover:text-text-secondary transition-all"
            >
              Nova foto
            </button>

            {/* Exportar — sempre visível */}
            <button
              onClick={onExport}
              className="px-3 sm:px-4 h-7 text-[9px] font-bold tracking-[0.15em] uppercase bg-accent text-bg-base hover:opacity-90 transition-all shadow-[0_0_16px_rgba(45,212,191,0.2)] flex-shrink-0"
            >
              Baixar
            </button>
          </>
        )}

        {/* Galeria como ícone no mobile (quando editando) */}
        {mode === 'editing' && (
          <Link
            to="/galeria"
            className="sm:hidden flex items-center justify-center w-7 h-7 text-text-muted border border-border-main hover:border-border-light transition-all"
            title="Galeria"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="1.5"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        )}

        {/* Galeria no idle mobile */}
        {mode !== 'editing' && (
          <Link
            to="/galeria"
            className="sm:hidden px-3 h-7 flex items-center text-[9px] font-bold tracking-[0.15em] uppercase transition-all text-text-muted border border-transparent hover:text-text-secondary hover:border-border-light"
          >
            Galeria
          </Link>
        )}
      </nav>
    </header>
  );
}
