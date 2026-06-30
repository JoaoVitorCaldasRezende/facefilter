import { useState, useCallback, useReducer, useRef } from 'react';
import { DEFAULT_ADJUSTMENTS } from '../utils/buildFilterString';

const MAX_HISTORY = 20;

function historyReducer(state, action) {
  switch (action.type) {
    case 'PUSH': {
      const sliced = state.entries.slice(0, state.index + 1);
      const entries = [...sliced, action.adjustments].slice(-MAX_HISTORY);
      return { entries, index: entries.length - 1 };
    }
    case 'UNDO':
      return { ...state, index: Math.max(0, state.index - 1) };
    case 'REDO':
      return { ...state, index: Math.min(state.entries.length - 1, state.index + 1) };
    case 'RESET':
      return { entries: [DEFAULT_ADJUSTMENTS], index: 0 };
    case 'APPLY_ALL': {
      const next = { ...action.adjustments };
      const sliced = state.entries.slice(0, state.index + 1);
      const entries = [...sliced, next].slice(-MAX_HISTORY);
      return { entries, index: entries.length - 1 };
    }
    default:
      return state;
  }
}

export function useEditor() {
  const [imageFile, setImageFile] = useState(null);
  const [imageURL, setImageURL] = useState(null);
  const [mode, setMode] = useState('idle');
  const [cropBox, setCropBox] = useState(null);
  const imageURLRef = useRef(null);

  const [history, dispatch] = useReducer(historyReducer, {
    entries: [DEFAULT_ADJUSTMENTS],
    index: 0,
  });

  const adjustments = history.entries[history.index];
  const canUndo = history.index > 0;
  const canRedo = history.index < history.entries.length - 1;

  const loadImage = useCallback((file) => {
    if (imageURLRef.current && imageURLRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(imageURLRef.current);
    }
    const url = URL.createObjectURL(file);
    imageURLRef.current = url;
    setImageFile(file);
    setImageURL(url);
    setMode('editing');
    setCropBox(null);
    dispatch({ type: 'RESET' });
  }, []);

  const loadFromDataURL = useCallback((dataURL, name) => {
    if (imageURLRef.current && imageURLRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(imageURLRef.current);
    }
    imageURLRef.current = dataURL;
    setImageFile({ name });
    setImageURL(dataURL);
    setMode('editing');
    setCropBox(null);
    dispatch({ type: 'RESET' });
  }, []);

  const applyAdjustment = useCallback((key, value) => {
    dispatch({ type: 'PUSH', adjustments: { ...history.entries[history.index], [key]: value } });
  }, [history]);

  const applyAllAdjustments = useCallback((newAdjustments) => {
    dispatch({ type: 'APPLY_ALL', adjustments: newAdjustments });
  }, []);

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

  const startCrop = useCallback(() => setMode('cropping'), []);

  const confirmCrop = useCallback((box) => {
    setCropBox(box);
    setMode('editing');
  }, []);

  const cancelCrop = useCallback(() => setMode('editing'), []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    setCropBox(null);
  }, []);

  const clearImage = useCallback(() => {
    if (imageURLRef.current && imageURLRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(imageURLRef.current);
    }
    imageURLRef.current = null;
    setImageFile(null);
    setImageURL(null);
    setMode('idle');
    setCropBox(null);
    dispatch({ type: 'RESET' });
  }, []);

  return {
    imageFile, imageURL, mode, adjustments, cropBox,
    canUndo, canRedo,
    loadImage, loadFromDataURL, applyAdjustment, applyAllAdjustments,
    undo, redo, reset, clearImage,
    startCrop, confirmCrop, cancelCrop,
  };
}
