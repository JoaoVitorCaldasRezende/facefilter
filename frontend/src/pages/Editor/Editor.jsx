import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useEditor } from '../../hooks/useEditor';
import { useExport } from '../../hooks/useExport';
import { useGallery } from '../../hooks/useGallery';
import { usePresets } from '../../hooks/usePresets';
import { DEFAULT_ADJUSTMENTS } from '../../utils/buildFilterString';
import { buildCurveLUT } from '../../utils/buildCurveLUT';
import TopBar from '../../components/TopBar/TopBar';
import DropZone from '../../components/DropZone/DropZone';
import EditorCanvas from '../../components/EditorCanvas/EditorCanvas';
import AdjustmentsPanel from '../../components/AdjustmentsPanel/AdjustmentsPanel';
import ExportModal from '../../components/ExportModal/ExportModal';
import ExportingOverlay from '../../components/ExportModal/ExportingOverlay';

export default function Editor() {
  const location = useLocation();
  const editor = useEditor();
  const { exportToDataURL } = useExport();
  const { savePhoto, getPhotoById } = useGallery();
  const { presets, savePreset, deletePreset } = usePresets();
  const [cropAspectRatio, setCropAspectRatio] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [exportingFormat, setExportingFormat] = useState(null); // null = not exporting

  // Derive curveLUT from curvePoints — not stored in history, computed on-demand
  const curveLUT = useMemo(() => {
    const pts = editor.adjustments.curvePoints;
    if (!pts) return null;
    // Identity curve: no LUT needed
    if (pts.length === 2 && pts[0][0] === 0 && pts[0][1] === 0 && pts[1][0] === 255 && pts[1][1] === 255) return null;
    return buildCurveLUT(pts);
  }, [editor.adjustments.curvePoints]);

  const activeAdjustments = useMemo(
    () => (showOriginal ? DEFAULT_ADJUSTMENTS : { ...editor.adjustments, curveLUT }),
    [showOriginal, editor.adjustments, curveLUT]
  );

  useEffect(() => {
    const galleryId = location.state?.galleryId;
    if (galleryId) {
      const photo = getPhotoById(galleryId);
      if (photo) editor.loadFromDataURL(photo.dataURL, photo.name);
    }
  }, []);

  function handleStartCrop(ratio) {
    setCropAspectRatio(ratio);
    editor.startCrop();
  }

  function handleApplyPreset(presetAdjustments) {
    editor.applyAllAdjustments(presetAdjustments);
  }

  function handleExport() {
    if (!editor.imageURL || !editor.imageFile) return;
    setShowExportModal(true);
  }

  async function handleConfirmExport(format, quality) {
    setShowExportModal(false);
    setExportingFormat(format);
    try {
      const dataURL = await exportToDataURL(
        editor.imageURL, activeAdjustments, editor.cropBox,
        { format, quality },
      );
      const baseName = editor.imageFile.name.replace(/\.[^/.]+$/, '');
      const ext = format === 'png' ? 'png' : 'jpg';
      const fileName = `${baseName}_editado.${ext}`;
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = fileName;
      a.click();
      savePhoto(dataURL, fileName);
    } catch (err) {
      console.error('Erro ao exportar:', err);
    } finally {
      setExportingFormat(null);
    }
  }

  const isEditing = editor.mode === 'editing' || editor.mode === 'cropping';

  return (
    <div className="h-screen flex flex-col bg-bg-base overflow-hidden">
      {showExportModal && (
        <ExportModal
          onConfirm={handleConfirmExport}
          onCancel={() => setShowExportModal(false)}
        />
      )}
      {exportingFormat && <ExportingOverlay format={exportingFormat} />}
      <TopBar
        mode={isEditing ? 'editing' : 'idle'}
        fileName={editor.imageFile?.name}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onNewPhoto={editor.clearImage}
        onExport={handleExport}
        onToggleOriginal={setShowOriginal}
        splitView={splitView}
        onToggleSplitView={() => setSplitView(v => !v)}
      />

      {!isEditing ? (
        <DropZone onFile={editor.loadImage} />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <EditorCanvas
            imageURL={editor.imageURL}
            adjustments={activeAdjustments}
            mode={editor.mode}
            cropBox={editor.cropBox}
            cropAspectRatio={cropAspectRatio}
            onConfirmCrop={editor.confirmCrop}
            onCancelCrop={editor.cancelCrop}
            splitView={splitView}
          />
          <AdjustmentsPanel
            adjustments={activeAdjustments}
            onAdjust={editor.applyAdjustment}
            onReset={editor.reset}
            onStartCrop={handleStartCrop}
            imageURL={editor.imageURL}
            presets={presets}
            onSavePreset={(name) => savePreset(name, editor.adjustments)}
            onDeletePreset={deletePreset}
            onApplyPreset={handleApplyPreset}
            onCurveChange={(pts) => editor.applyAdjustment('curvePoints', pts)}
          />
        </div>
      )}
    </div>
  );
}