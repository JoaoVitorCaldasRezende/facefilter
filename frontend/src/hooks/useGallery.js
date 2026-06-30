import { useState, useCallback } from 'react';

const STORAGE_KEY = 'facefilter_gallery';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useGallery() {
  const [photos, setPhotos] = useState(() => loadFromStorage());

  const savePhoto = useCallback((dataURL, name) => {
    const id = crypto.randomUUID();
    const newPhoto = { id, name, dataURL, savedAt: new Date().toISOString() };
    setPhotos(prev => {
      const updated = [newPhoto, ...prev];
      saveToStorage(updated);
      return updated;
    });
    return id;
  }, []);

  const deletePhoto = useCallback((id) => {
    setPhotos(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const getPhotoById = useCallback((id) => {
    return loadFromStorage().find(p => p.id === id) ?? null;
  }, []);

  return { photos, savePhoto, deletePhoto, getPhotoById };
}
