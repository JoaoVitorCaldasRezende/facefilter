import { useState, useCallback } from 'react';

const PRESETS_KEY = 'facefilter_presets';

function load() {
  try { return JSON.parse(localStorage.getItem(PRESETS_KEY)) ?? []; }
  catch { return []; }
}

export function usePresets() {
  const [presets, setPresets] = useState(() => load());

  const savePreset = useCallback((name, adjustments) => {
    const preset = {
      id: crypto.randomUUID(),
      name,
      adjustments,
      savedAt: new Date().toISOString(),
    };
    setPresets(prev => {
      const updated = [preset, ...prev];
      localStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deletePreset = useCallback((id) => {
    setPresets(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { presets, savePreset, deletePreset };
}
