import { useState } from 'react';

export default function Editor({ currentTab, setCurrentTab }) {
  // Estados para os Sliders de Ajuste
  const [brilho, setBrilho] = useState(0);
  const [contraste, setContraste] = useState(0);
  const [saturacao, setSaturacao] = useState(0);
  const [exposicao, setExposicao] = useState(0);
  
  // Estados de Visualização
  const [selectedFilter, setSelectedFilter] = useState('original');
  const [zoom, setZoom] = useState(100);

  // Lista de Filtros Disponíveis (Aba Filtros)
  const filtrosPreset = [
    { id: 'original', name: 'Original', icon: '☀️' },
    { id: 'bw', name: 'P&B Clássico', icon: '🌑' },
    { id: 'sepia', name: 'Sépia Retro', icon: '🍂' },
    { id: 'vintage', name: 'Vintage Look', icon: '🎞️' },
    { id: 'neon', name: 'Cyber Neon', icon: '🔮' },
  ];

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-140px)] border border-border-main rounded-xl overflow-hidden bg-bg-base">
      
      {/* ── BARRA DE FERRAMENTAS SUPERIOR ── */}
      <div className="h-12 bg-bg-surface border-b border-border-main flex items-center px-4 gap-4 flex-shrink-0">
        <button className="px-3 py-1 bg-bg-raised text-xs rounded border border-border-light hover:bg-border-main transition-all font-semibold text-text-primary">
          ↩ Desfazer
        </button>
        <button className="px-3 py-1 bg-bg-raised text-xs rounded border border-border-light hover:bg-border-main transition-all font-semibold text-text-primary">
          ↪ Refazer
        </button>
        <div className="h-5 w-[1px] bg-border-main"></div>
        
        <span className="text-xs text-text-muted hidden sm:inline">Arquivo: <strong className="text-text-secondary">foto_perfil.jpg</strong></span>

        <button className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded shadow transition-all ml-auto">
          💾 Exportar Foto
        </button>
      </div>

      {/* ── CORPO DO EDITOR (CANVAS + PAINEL DE CONTROLES) ── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LADO ESQUERDO: CANVAS DE VISUALIZAÇÃO */}
        <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center relative p-6 overflow-auto">
          
          {/* Box de Exibição da Imagem (Aplica filtros CSS com base no estado) */}
          <div 
            style={{ transform: `scale(${zoom / 100})` }}
            className={`w-[440px] h-[340px] bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 rounded-xl flex flex-col items-center justify-center text-7xl shadow-2xl relative border border-white/5 transition-all duration-300
              ${selectedFilter === 'bw' ? 'grayscale' : ''}
              ${selectedFilter === 'sepia' ? 'sepia' : ''}
              ${selectedFilter === 'vintage' ? 'sepia contrast-125 saturate-75' : ''}
              ${selectedFilter === 'neon' ? 'hue-rotate-90 saturate-200' : ''}
            `}
          >
            📸
            <span className="text-[11px] text-white/30 mt-4 font-mono tracking-wider">Visualizador de Efeitos</span>
            
            {/* Overlay indicando alterações ativas */}
            {(brilho !== 0 || contraste !== 0 || selectedFilter !== 'original') && (
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur text-[10px] text-purple-light font-bold px-2 py-0.5 rounded border border-purple-brand/30">
                Modificado
              </div>
            )}
          </div>
          
          {/* CONTROLE DE ZOOM INTEGRADO */}
          <div className="absolute bottom-4 right-4 bg-bg-surface/80 border border-border-main backdrop-blur px-3 py-1.5 rounded-lg flex items-center gap-3 text-xs text-text-secondary shadow-lg z-10">
            <span>Zoom: <strong>{zoom}%</strong></span>
            <input 
              type="range" 
              min="50" 
              max="150" 
              value={zoom} 
              onChange={(e) => setZoom(Number(e.target.value))} 
              className="w-20 accent-blue-brand h-1 bg-bg-raised rounded cursor-pointer" 
            />
          </div>
        </div>

        {/* LADO DIREITO: PAINEL LATERAL DE AJUSTES E ABAS NATIVAS */}
        <div className="w-[320px] bg-bg-surface border-l border-border-main flex flex-col overflow-y-auto flex-shrink-0">
          
          {/* ABAS SUPERIORES DO PAINEL */}
          <div className="flex border-b border-border-main text-xs font-bold sticky top-0 bg-bg-surface z-10">
            <button 
              onClick={() => setCurrentTab('ajustes')} 
              className={`flex-1 py-3 text-center border-b-2 transition-all ${currentTab === 'ajustes' ? 'border-blue-light text-blue-light bg-bg-raised/20' : 'border-transparent text-text-muted hover:text-text-primary'}`}
            >
              Ajustes
            </button>
            <button 
              onClick={() => setCurrentTab('filtros')} 
              className={`flex-1 py-3 text-center border-b-2 transition-all ${currentTab === 'filtros' ? 'border-blue-light text-blue-light bg-bg-raised/20' : 'border-transparent text-text-muted hover:text-text-primary'}`}
            >
              Filtros
            </button>
            <button 
              onClick={() => setCurrentTab('faceAI')} 
              className={`flex-1 py-3 text-center border-b-2 transition-all ${currentTab === 'faceAI' ? 'border-blue-light text-blue-light bg-bg-raised/20' : 'border-transparent text-text-muted hover:text-text-primary'}`}
            >
              Face IA
            </button>
          </div>

          {/* CONTEÚDO REATIVO CONFORME ABA SELECCIONADA */}
          <div className="p-4 flex flex-col gap-5">
            
            {/* 1. CONTEÚDO: ABA AJUSTES SLIDERS */}
            {currentTab === 'ajustes' && (
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">Parâmetros de Imagem</span>
                
                {/* Slider Brilho */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Brilho</span>
                    <span className="text-blue-light font-bold">{brilho > 0 ? `+${brilho}` : brilho}</span>
                  </div>
                  <input type="range" min="-100" max="100" value={brilho} onChange={(e) => setBrilho(Number(e.target.value))} className="w-full accent-blue-brand h-1 bg-bg-raised rounded cursor-pointer" />
                </div>

                {/* Slider Contraste */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Contraste</span>
                    <span className="text-blue-light font-bold">{contraste > 0 ? `+${contraste}` : contraste}</span>
                  </div>
                  <input type="range" min="-100" max="100" value={contraste} onChange={(e) => setContraste(Number(e.target.value))} className="w-full accent-blue-brand h-1 bg-bg-raised rounded cursor-pointer" />
                </div>

                {/* Slider Saturação */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Saturação</span>
                    <span className="text-blue-light font-bold">{saturacao > 0 ? `+${saturacao}` : saturacao}</span>
                  </div>
                  <input type="range" min="-100" max="100" value={saturacao} onChange={(e) => setSaturacao(Number(e.target.value))} className="w-full accent-blue-brand h-1 bg-bg-raised rounded cursor-pointer" />
                </div>

                {/* Slider Exposição */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Exposição</span>
                    <span className="text-blue-light font-bold">{exposicao > 0 ? `+${exposicao}` : exposicao}</span>
                  </div>
                  <input type="range" min="-100" max="100" value={exposicao} onChange={(e) => setExposicao(Number(e.target.value))} className="w-full accent-blue-brand h-1 bg-bg-raised rounded cursor-pointer" />
                </div>
                
                <button 
                  onClick={() => { setBrilho(0); setContraste(0); setSaturacao(0); setExposicao(0); }}
                  className="mt-2 text-center text-xs text-text-muted hover:text-white transition-colors py-1 bg-bg-raised/30 rounded border border-border-main"
                >
                  🔄 Resetar Sliders
                </button>
              </div>
            )}

            {/* 2. CONTEÚDO: ABA PRESETS DE FILTROS */}
            {currentTab === 'filtros' && (
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">Filtros de Um Clique</span>
                <div className="grid grid-cols-2 gap-2">
                  {filtrosPreset.map((f) => (
                    <div 
                      key={f.id} 
                      onClick={() => setSelectedFilter(f.id)} 
                      className={`border-2 rounded-xl p-2.5 bg-bg-raised/30 text-center cursor-pointer transition-all ${selectedFilter === f.id ? 'border-blue-brand bg-blue-brand/5' : 'border-transparent hover:border-border-light'}`}
                    >
                      <div className="h-10 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-lg mb-1.5 select-none">
                        {f.icon}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-text-secondary block truncate">{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. CONTEÚDO: ABA INTELIGÊNCIA ARTIFICIAL FACIAL */}
            {currentTab === 'faceAI' && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">Módulos Neurais Ativos</span>
                
                <div className="p-3 bg-bg-raised/40 border border-border-main rounded-xl hover:border-purple-brand cursor-pointer transition-all flex items-center gap-3 group">
                  <span className="text-lg group-hover:scale-110 transition-transform">✨</span>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">Suavizar Pele Pro</h4>
                    <p className="text-[10px] text-text-muted">Ajuste inteligente de texturas</p>
                  </div>
                </div>

                <div className="p-3 bg-bg-raised/40 border border-border-main rounded-xl hover:border-purple-brand cursor-pointer transition-all flex items-center gap-3 group">
                  <span className="text-lg group-hover:scale-110 transition-transform">🦷</span>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">Clareamento Maxilar</h4>
                    <p className="text-[10px] text-text-muted">Contraste de sorrisos 100% natural</p>
                  </div>
                </div>

                <div className="p-3 bg-bg-raised/40 border border-border-main rounded-xl hover:border-purple-brand cursor-pointer transition-all flex items-center gap-3 group">
                  <span className="text-lg group-hover:scale-110 transition-transform">👁️</span>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">Realce de Íris</h4>
                    <p className="text-[10px] text-text-muted">Foco e nitidez nos olhos</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}