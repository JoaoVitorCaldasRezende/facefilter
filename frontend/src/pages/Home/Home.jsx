import { useState } from 'react';

export default function Home() {
  // Simulação de dados do protótipo
  const [recentEdits] = useState([
    { id: 1, name: 'ensaio_rosto_01.jpg', filter: 'IA Smooth Face', date: 'Hoje, 14:22', status: 'Salvo', type: 'purple' },
    { id: 2, name: 'foto_perfil_fundo.png', filter: 'Remover Fundo', date: 'Ontem, 18:05', status: 'Salvo', type: 'blue' },
    { id: 3, name: 'avatar_cyberpunk.jpg', filter: 'Cyber Neon Style', date: '24 Mai, 11:40', status: 'Salvo', type: 'yellow' },
  ]);

  return (
    <div className="animate-fade-in">
      {/* Cabeçalho da Página */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">Resumo da Atividade</h2>
        <p className="text-xs text-text-secondary">Monitore o uso das suas ferramentas e processamento de IA.</p>
      </div>
      
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-bg-surface border border-border-main rounded-xl p-5 flex flex-col gap-2 hover:border-border-light transition-all">
          <div className="w-10 h-10 bg-blue-brand/15 text-blue-light text-lg rounded-lg flex items-center justify-center">🖼️</div>
          <span className="text-2xl font-black text-text-primary">1.240</span>
          <span className="text-xs text-text-secondary">Fotos Processadas</span>
          <span className="text-[10px] text-green-400">▲ +12% esta semana</span>
        </div>
        
        <div className="bg-bg-surface border border-border-main rounded-xl p-5 flex flex-col gap-2 hover:border-border-light transition-all">
          <div className="w-10 h-10 bg-purple-brand/15 text-purple-light text-lg rounded-lg flex items-center justify-center">🧠</div>
          <span className="text-2xl font-black text-text-primary">482</span>
          <span className="text-xs text-text-secondary">Melhorias por IA</span>
          <span className="text-[10px] text-green-400">▲ +24% este mês</span>
        </div>
        
        <div className="bg-bg-surface border border-border-main rounded-xl p-5 flex flex-col gap-2 hover:border-border-light transition-all">
          <div className="w-10 h-10 bg-green-500/15 text-green-400 text-lg rounded-lg flex items-center justify-center">⚡</div>
          <span className="text-2xl font-black text-text-primary">0.4s</span>
          <span className="text-xs text-text-secondary">Tempo Médio p/ Foto</span>
          <span className="text-[10px] text-green-400">▼ Alta Performance</span>
        </div>
        
        <div className="bg-bg-surface border border-border-main rounded-xl p-5 flex flex-col gap-2 hover:border-border-light transition-all">
          <div className="w-10 h-10 bg-yellow-500/15 text-yellow-400 text-lg rounded-lg flex items-center justify-center">💾</div>
          <span className="text-2xl font-black text-text-primary">74%</span>
          <span className="text-xs text-text-secondary">Espaço Armazenado</span>
          <span className="text-[10px] text-yellow-400">7.4 GB de 10 GB</span>
        </div>
      </div>

      {/* Grid Inferior: Tabela + Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabela */}
        <div className="bg-bg-surface border border-border-main rounded-xl p-5 lg:col-span-2">
          <h3 className="text-sm font-bold mb-4 uppercase text-text-muted tracking-wide">Últimas Edições</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-main text-[11px] text-text-muted font-bold uppercase">
                  <th className="pb-3">Arquivo</th>
                  <th className="pb-3">Filtro Aplicado</th>
                  <th className="pb-3">Data</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs text-text-secondary">
                {recentEdits.map((edit) => (
                  <tr key={edit.id} className="border-b border-border-main hover:bg-white/5 transition-all">
                    <td className="py-3 text-text-primary font-medium">{edit.name}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] 
                        ${edit.type === 'purple' && 'bg-purple-brand/20 text-purple-light'}
                        ${edit.type === 'blue' && 'bg-blue-brand/20 text-blue-light'}
                        ${edit.type === 'yellow' && 'bg-yellow-500/20 text-yellow-400'}
                      `}>
                        {edit.filter}
                      </span>
                    </td>
                    <td className="py-3">{edit.date}</td>
                    <td className="py-3 text-green-400">{edit.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Painel Lateral de Dicas / Boas-vindas */}
        <div className="bg-bg-surface border border-border-main rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold mb-3 uppercase text-text-muted tracking-wide">Dica do Dia</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Utilize o novo módulo <strong className="text-purple-light">Face IA</strong> para suavizar texturas de pele automaticamente e manter os poros nítidos usando a nossa rede neural treinada.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-border-main flex items-center justify-between text-xs text-text-muted">
            <span>Versão do Front: 1.0.0</span>
            <span className="text-blue-light font-medium">Ver notas</span>
          </div>
        </div>
      </div>
    </div>
  );
}