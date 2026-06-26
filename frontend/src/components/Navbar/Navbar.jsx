
export default function Navbar() {
  return (
    <header className="h-16 bg-bg-surface border-b border-border-main flex items-center px-6 gap-4 sticky top-0 z-20 w-full">
      {/* Campo de Busca */}
      <div className="flex-1 max-w-[380px] flex items-center gap-2.5 bg-bg-raised border border-border-main rounded-lg px-3 py-1.5 text-sm text-text-muted">
        <span>🔍</span>
        <input 
          type="text" 
          placeholder="Buscar fotos, filtros ou edições..." 
          className="bg-transparent text-text-primary placeholder-text-muted text-xs outline-none w-full" 
        />
      </div>
      
      {/* Lado Direito: Notificação e Usuário */}
      <div className="flex items-center gap-3 ml-auto">
        <div className="relative w-9 h-9 bg-bg-raised border border-border-main rounded-md flex items-center justify-center text-sm cursor-pointer text-text-secondary hover:bg-border-main transition-all">
          🔔 
          <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-bg-surface"></div>
        </div>
        
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-brand to-purple-brand flex items-center justify-center font-bold text-xs border border-border-light cursor-pointer">
          JD
        </div>
      </div>
    </header>
  );
}