import { useState } from 'react';

export default function Gallery() {
  // Array estático de exemplo para montar os itens da galeria
  const [photos] = useState([1, 2, 3, 4, 5, 6, 7, 8]);

  return (
    <div className="animate-fade-in">
      {/* Cabeçalho da Galeria */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Minha Galeria Nuvem</h2>
          <p className="text-xs text-text-secondary">Gerencie suas criações e downloads protegidos.</p>
        </div>
        <div className="flex gap-2">
          <select className="bg-bg-surface border border-border-main rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none focus:border-blue-brand">
            <option>Mais recentes</option>
            <option>Mais antigas</option>
          </select>
        </div>
      </div>

      {/* Grid de Fotos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {photos.map((item) => (
          <div key={item} className="bg-bg-surface border border-border-main rounded-xl overflow-hidden group hover:border-border-light transition-all shadow-md">
            {/* Imagem Placeholder */}
            <div className="h-36 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-4xl relative select-none">
              📸
              {/* Overlay de Ação ao passar o Mouse (Hover) */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all p-2">
                <button className="bg-blue-brand hover:bg-blue-light p-2 rounded text-white text-xs font-bold transition-colors shadow">
                  👁 Visualizar
                </button>
                <button className="bg-bg-raised hover:bg-border-main p-2 rounded text-white text-xs font-bold transition-colors border border-border-light">
                  📥
                </button>
              </div>
            </div>
            {/* Detalhes do Card */}
            <div className="p-3">
              <h4 className="text-[11px] font-bold text-text-primary truncate">foto_render_ia_{item}.jpg</h4>
              <span className="text-[9px] text-text-muted block mt-0.5">Salvo há {item} dias</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}