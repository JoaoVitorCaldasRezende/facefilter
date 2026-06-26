
export default function Sidebar({ currentPage, setCurrentPage, handleLogout }) {
  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: '📊' },
    { id: 'editor', label: 'Editor de Fotos', icon: '🎨' },
    { id: 'gallery', label: 'Minha Galeria', icon: '🖼️', badge: 12 },
  ];

  const aiItems = [
    { id: 'recursosIA', label: 'Modelos e Filtros', icon: '🧠' }
  ];

  return (
    <aside className="w-60 bg-bg-surface border-r border-border-main fixed h-full flex flex-col z-30">
      {/* Logo */}
      <div className="h-16 px-5 border-b border-border-main flex items-center gap-2.5 flex-shrink-0">
        <div className="w-8 h-8 rounded bg-gradient-to-r from-blue-brand to-purple-brand flex items-center justify-center text-sm font-bold">✨</div>
        <span className="font-extrabold text-lg bg-gradient-to-r from-blue-light to-purple-light bg-clip-text text-transparent">FaceFilter</span>
      </div>
      
      {/* Links de Navegação */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5">
        <span className="text-[10px] font-bold text-text-muted tracking-wider uppercase px-2 py-3">Menu Principal</span>
        
        {menuItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setCurrentPage(item.id)} 
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === item.id ? 'bg-blue-brand/15 text-blue-light' : 'text-text-secondary hover:bg-bg-raised hover:text-text-primary'}`}
          >
            <span className="text-base">{item.icon}</span> 
            {item.label}
            {item.badge && (
              <span className="ml-auto bg-blue-brand text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}

        <span className="text-[10px] font-bold text-text-muted tracking-wider uppercase px-2 py-3 mt-2">Recursos IA</span>

        {aiItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setCurrentPage(item.id)} 
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === item.id ? 'bg-blue-brand/15 text-blue-light' : 'text-text-secondary hover:bg-bg-raised hover:text-text-primary'}`}
          >
            <span className="text-base">{item.icon}</span> {item.label}
          </button>
        ))}

        <span className="text-[10px] font-bold text-text-muted tracking-wider uppercase px-2 py-3 mt-auto">Suporte</span>

        <button onClick={() => setCurrentPage('configuracoes')} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === 'configuracoes' ? 'bg-blue-brand/15 text-blue-light' : 'text-text-secondary hover:bg-bg-raised hover:text-text-primary'}`}>
          <span className="text-base">⚙️</span> Configurações
        </button>
        
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
          <span className="text-base">🚪</span> Sair
        </button>
      </nav>
    </aside>
  );
}