import { useNavigate } from 'react-router-dom';
import { useGallery } from '../../hooks/useGallery';
import TopBar from '../../components/TopBar/TopBar';

export default function Gallery() {
  const { photos, deletePhoto } = useGallery();
  const navigate = useNavigate();

  function handleOpenInEditor(id) {
    navigate('/', { state: { galleryId: id } });
  }

  function handleDownload(photo) {
    const a = document.createElement('a');
    a.href = photo.dataURL;
    a.download = photo.name;
    a.click();
  }

  return (
    <div className="h-screen flex flex-col bg-bg-base overflow-hidden">
      <TopBar mode="idle" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-text-primary">Minha Galeria</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {photos.length > 0 ? `${photos.length} foto${photos.length !== 1 ? 's' : ''} salva${photos.length !== 1 ? 's' : ''}` : 'Fotos exportadas neste navegador'}
          </p>
        </div>

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-bg-surface border border-border-main flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-text-muted text-sm mb-4">Nenhuma foto exportada ainda.</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-xs font-bold bg-blue-brand text-white rounded-lg hover:bg-blue-light transition-all"
            >
              Começar a editar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {photos.map(photo => (
              <div
                key={photo.id}
                className="group bg-bg-surface border border-border-main rounded-xl overflow-hidden hover:border-border-light transition-all"
              >
                <div className="relative h-36 overflow-hidden bg-slate-900">
                  <img
                    src={photo.dataURL}
                    alt={photo.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-all duration-150 p-2">
                    <button
                      onClick={() => handleOpenInEditor(photo.id)}
                      className="px-2.5 py-1.5 bg-blue-brand hover:bg-blue-light rounded-lg text-white text-[11px] font-bold transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDownload(photo)}
                      className="p-1.5 bg-bg-raised hover:bg-border-main border border-border-light rounded-lg text-white text-xs transition-colors"
                      title="Baixar"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="p-1.5 bg-red-500/15 hover:bg-red-500/30 border border-red-500/25 rounded-lg text-red-400 text-xs transition-colors"
                      title="Remover"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-[11px] font-medium text-text-primary truncate">{photo.name}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {new Date(photo.savedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
