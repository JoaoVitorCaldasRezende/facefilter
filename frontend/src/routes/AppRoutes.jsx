import Home from '../pages/Home/home';
import Editor from '../pages/Editor/editor';
import Gallery from '../pages/Gallery/gallery';

export default function AppRoutes({ currentPage, currentTab, setCurrentTab }) {
  // Renderização condicional baseada na rota/página ativa selecionada na Sidebar
  switch (currentPage) {
    case 'home':
    case 'dashboard':
      return <Home />;
      
    case 'editor':
      return <Editor currentTab={currentTab} setCurrentTab={setCurrentTab} />;
      
    case 'gallery':
    case 'galeria':
      return <Gallery />;
      
    case 'recursosIA':
      return (
        <div className="animate-fade-in">
          <div className="bg-gradient-to-r from-blue-950 to-purple-950 border border-purple-500/20 rounded-2xl p-6 mb-6 text-center">
            <h1 className="text-2xl font-black mb-1">Filtros Inteligentes Premium</h1>
            <p className="text-text-secondary text-sm max-w-md mx-auto mb-4">Modelos neurais treinados para redefinir iluminação profissional e estética facial com um clique.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-bg-surface border border-border-main rounded-xl p-5 hover:border-purple-brand transition-all">
              <span className="px-2 py-0.5 bg-purple-brand/20 text-purple-light rounded-md font-bold text-[9px] tracking-wide uppercase">RECONHECIMENTO FACIAL</span>
              <h3 className="text-sm font-bold mt-2 mb-1">Filtro Smart Beauty 3.0</h3>
              <p className="text-xs text-text-muted">Remove imperfeições mantendo a textura natural dos poros e traços originais.</p>
            </div>
            <div className="bg-bg-surface border border-border-main rounded-xl p-5 hover:border-purple-brand transition-all">
              <span className="px-2 py-0.5 bg-blue-brand/20 text-blue-light rounded-md font-bold text-[9px] tracking-wide uppercase">ILUMINAÇÃO</span>
              <h3 className="text-sm font-bold mt-2 mb-1">Studio Light Pro</h3>
              <p className="text-xs text-text-muted">Simula softboxes tridimensionais ao redor do rosto para fotos profissionais de estúdio.</p>
            </div>
          </div>
        </div>
      );

    case 'configuracoes':
      return (
        <div className="animate-fade-in bg-bg-surface border border-border-main rounded-xl p-6">
          <h2 className="text-lg font-bold mb-2">Configurações do Sistema</h2>
          <p className="text-xs text-text-secondary mb-6">Gerencie suas preferências de conta e segurança da plataforma.</p>
          <div className="p-4 bg-bg-raised/40 border border-blue-brand/50 rounded-xl max-w-xs flex items-center justify-between">
            <span className="text-xs font-bold">🌑 Modo Escuro (Fixo)</span>
            <span className="text-[10px] font-bold bg-blue-brand text-white px-2 py-0.5 rounded">Ativo</span>
          </div>
        </div>
      );

    default:
      return <Home />;
  }
}