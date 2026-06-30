# FaceFilter Editor Funcional — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o protótipo FaceFilter em um editor de fotos funcional no browser — upload real, ajustes de imagem via CSS filters, recorte com handles, exportação via Canvas API e galeria com localStorage.

**Architecture:** SPA React 19 + Vite. Editor usa CSS `filter` para preview em tempo real e Canvas API para exportação final. Estado gerenciado por hooks customizados. Persistência exclusivamente via localStorage — sem backend.

**Tech Stack:** React 19, Vite 8, Tailwind CSS 4, react-router-dom 7, Vitest + @testing-library/react (hooks), Canvas API (export), File API (upload).

**Spec:** `docs/superpowers/specs/2026-06-29-facefilter-editor-design.md`

---

## File Map

```
frontend/src/
  utils/
    buildFilterString.js          CREATE — pure fn: adjustments → CSS filter string
    __tests__/
      buildFilterString.test.js   CREATE — unit tests
  hooks/
    useGallery.js                 CREATE — localStorage CRUD
    useEditor.js                  CREATE — editor state + undo/redo
    useExport.js                  CREATE — Canvas API export
    __tests__/
      useGallery.test.js          CREATE
      useEditor.test.js           CREATE
  components/
    TopBar/
      TopBar.jsx                  CREATE — navigation header
    DropZone/
      DropZone.jsx                CREATE — upload drag-and-drop
    SliderControl/
      SliderControl.jsx           REWRITE — redesign visual
    AdjustmentsPanel/
      AdjustmentsPanel.jsx        CREATE — tabs: Ajustes + Recortar
    CropOverlay/
      CropOverlay.jsx             CREATE — drag handles sobre a imagem
    EditorCanvas/
      EditorCanvas.jsx            CREATE — <img> + CSS filters + vinheta + crop overlay
    [DELETE] Sidebar/
    [DELETE] Navbar/
    [DELETE] FilterCard/
    [DELETE] ToolButton/
    [DELETE] UploadArea/
    [DELETE] ImageCanvas/
  pages/
    Editor/
      Editor.jsx                  REWRITE — monta todos os componentes
    Gallery/
      Gallery.jsx                 REWRITE — grid com localStorage
    [DELETE] Home/
  routes/
    AppRoutes.jsx                 REWRITE — usa react-router Routes
  services/
    [DELETE] ImageService.js
  test/
    setup.js                      CREATE — @testing-library/jest-dom setup
  App.jsx                         REWRITE — apenas BrowserRouter + AppRoutes
  index.css                       KEEP — Tailwind import
```

---

## Task 1: Cleanup — remover arquivos de protótipo

**Files:**
- Delete: `frontend/src/components/Sidebar/`
- Delete: `frontend/src/components/Navbar/`
- Delete: `frontend/src/components/FilterCard/`
- Delete: `frontend/src/components/ToolButton/`
- Delete: `frontend/src/components/UploadArea/`
- Delete: `frontend/src/components/ImageCanvas/`
- Delete: `frontend/src/pages/Home/`
- Delete: `frontend/src/services/ImageService.js`

- [ ] **Step 1: Deletar componentes e páginas de protótipo**

```powershell
cd frontend
Remove-Item -Recurse -Force src/components/Sidebar
Remove-Item -Recurse -Force src/components/Navbar
Remove-Item -Recurse -Force src/components/FilterCard
Remove-Item -Recurse -Force src/components/ToolButton
Remove-Item -Recurse -Force src/components/UploadArea
Remove-Item -Recurse -Force src/components/ImageCanvas
Remove-Item -Recurse -Force src/pages/Home
Remove-Item -Force src/services/ImageService.js
```

- [ ] **Step 2: Verificar que os arquivos foram removidos**

```powershell
Get-ChildItem src/components
Get-ChildItem src/pages
```

Esperado: sem Sidebar, Navbar, FilterCard, ToolButton, UploadArea, ImageCanvas. Sem pasta Home em pages.

---

## Task 2: Infraestrutura de testes — Vitest + Testing Library

**Files:**
- Modify: `frontend/vite.config.js`
- Modify: `frontend/package.json` (via pnpm add)
- Create: `frontend/src/test/setup.js`

- [ ] **Step 1: Instalar dependências de teste**

```powershell
cd frontend
pnpm add -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

- [ ] **Step 2: Atualizar `vite.config.js`**

Substituir o conteúdo completo por:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
```

- [ ] **Step 3: Criar `src/test/setup.js`**

```js
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Verificar que o Vitest funciona**

```powershell
pnpm vitest run
```

Esperado: `No test files found` (zero testes, zero falhas — setup funciona).

---

## Task 3: Utilitário `buildFilterString` (TDD)

**Files:**
- Create: `frontend/src/utils/buildFilterString.js`
- Create: `frontend/src/utils/__tests__/buildFilterString.test.js`

- [ ] **Step 1: Criar o arquivo de teste**

Criar `frontend/src/utils/__tests__/buildFilterString.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { buildFilterString, DEFAULT_ADJUSTMENTS } from '../buildFilterString';

describe('buildFilterString', () => {
  it('retorna string de filtro com valores padrão', () => {
    const result = buildFilterString(DEFAULT_ADJUSTMENTS);
    expect(result).toContain('brightness(1.000)');
    expect(result).toContain('contrast(1.000)');
    expect(result).toContain('saturate(1.000)');
    expect(result).toContain('sepia(0)');
  });

  it('multiplica brightness e exposure num único valor', () => {
    const result = buildFilterString({ ...DEFAULT_ADJUSTMENTS, brightness: 1.5, exposure: 1.2 });
    expect(result).toContain('brightness(1.800)');
  });

  it('inclui url(#sharpen) quando sharpness > 0', () => {
    const result = buildFilterString({ ...DEFAULT_ADJUSTMENTS, sharpness: 1 });
    expect(result).toContain('url(#sharpen)');
  });

  it('não inclui url(#sharpen) quando sharpness é 0', () => {
    const result = buildFilterString(DEFAULT_ADJUSTMENTS);
    expect(result).not.toContain('url(#sharpen)');
  });

  it('aplica sepia para temperatura quente (positiva)', () => {
    const result = buildFilterString({ ...DEFAULT_ADJUSTMENTS, temperature: 100 });
    expect(result).toContain('sepia(0.300)');
    expect(result).toContain('hue-rotate(-20.0deg)');
  });

  it('não aplica sepia para temperatura fria (negativa)', () => {
    const result = buildFilterString({ ...DEFAULT_ADJUSTMENTS, temperature: -100 });
    expect(result).toContain('sepia(0)');
    expect(result).toContain('hue-rotate(20.0deg)');
  });
});
```

- [ ] **Step 2: Rodar teste e confirmar que falha**

```powershell
pnpm vitest run src/utils/__tests__/buildFilterString.test.js
```

Esperado: FAIL com `Cannot find module '../buildFilterString'`

- [ ] **Step 3: Criar `src/utils/buildFilterString.js`**

```js
export const DEFAULT_ADJUSTMENTS = {
  brightness: 1.0,
  exposure: 1.0,
  contrast: 1.0,
  saturation: 1.0,
  temperature: 0,
  sharpness: 0,
  vignette: 0,
};

export function buildFilterString(adjustments) {
  const { brightness, exposure, contrast, saturation, temperature, sharpness } = adjustments;

  const brightnessVal = (brightness * exposure).toFixed(3);
  const contrastVal = contrast.toFixed(3);
  const saturateVal = saturation.toFixed(3);

  const tempSepia = temperature > 0 ? ((temperature / 100) * 0.3).toFixed(3) : '0';
  const tempHue = (-(temperature / 100) * 20).toFixed(1);

  let filter = `brightness(${brightnessVal}) contrast(${contrastVal}) saturate(${saturateVal}) sepia(${tempSepia}) hue-rotate(${tempHue}deg)`;

  if (sharpness > 0) {
    filter += ' url(#sharpen)';
  }

  return filter;
}
```

- [ ] **Step 4: Rodar teste e confirmar que passa**

```powershell
pnpm vitest run src/utils/__tests__/buildFilterString.test.js
```

Esperado: 6 testes passando.

---

## Task 4: Hook `useGallery` (TDD)

**Files:**
- Create: `frontend/src/hooks/useGallery.js`
- Create: `frontend/src/hooks/__tests__/useGallery.test.js`

- [ ] **Step 1: Criar o arquivo de teste**

Criar `frontend/src/hooks/__tests__/useGallery.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGallery } from '../useGallery';

beforeEach(() => {
  localStorage.clear();
});

describe('useGallery', () => {
  it('retorna array vazio quando localStorage está vazio', () => {
    const { result } = renderHook(() => useGallery());
    expect(result.current.photos).toEqual([]);
  });

  it('salva foto e retorna na lista', () => {
    const { result } = renderHook(() => useGallery());
    act(() => {
      result.current.savePhoto('data:image/jpeg;base64,abc', 'test.jpg');
    });
    expect(result.current.photos).toHaveLength(1);
    expect(result.current.photos[0].name).toBe('test.jpg');
    expect(result.current.photos[0].dataURL).toBe('data:image/jpeg;base64,abc');
    expect(result.current.photos[0].id).toBeDefined();
    expect(result.current.photos[0].savedAt).toBeDefined();
  });

  it('retorna id ao salvar', () => {
    const { result } = renderHook(() => useGallery());
    let id;
    act(() => {
      id = result.current.savePhoto('data:image/jpeg;base64,abc', 'test.jpg');
    });
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('deleta foto pelo id', () => {
    const { result } = renderHook(() => useGallery());
    let id;
    act(() => { id = result.current.savePhoto('data:image/jpeg;base64,abc', 'test.jpg'); });
    act(() => { result.current.deletePhoto(id); });
    expect(result.current.photos).toHaveLength(0);
  });

  it('persiste no localStorage ao salvar', () => {
    const { result } = renderHook(() => useGallery());
    act(() => { result.current.savePhoto('data:image/jpeg;base64,abc', 'test.jpg'); });
    const stored = JSON.parse(localStorage.getItem('facefilter_gallery'));
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('test.jpg');
  });

  it('persiste deleção no localStorage', () => {
    const { result } = renderHook(() => useGallery());
    let id;
    act(() => { id = result.current.savePhoto('data:image/jpeg;base64,abc', 'test.jpg'); });
    act(() => { result.current.deletePhoto(id); });
    const stored = JSON.parse(localStorage.getItem('facefilter_gallery'));
    expect(stored).toHaveLength(0);
  });

  it('getPhotoById retorna a foto correta', () => {
    const { result } = renderHook(() => useGallery());
    let id;
    act(() => { id = result.current.savePhoto('data:image/jpeg;base64,xyz', 'photo.jpg'); });
    const photo = result.current.getPhotoById(id);
    expect(photo?.dataURL).toBe('data:image/jpeg;base64,xyz');
  });

  it('getPhotoById retorna null para id inexistente', () => {
    const { result } = renderHook(() => useGallery());
    expect(result.current.getPhotoById('nonexistent')).toBeNull();
  });

  it('novas fotos aparecem no início da lista', () => {
    const { result } = renderHook(() => useGallery());
    act(() => { result.current.savePhoto('data:image/jpeg;base64,first', 'first.jpg'); });
    act(() => { result.current.savePhoto('data:image/jpeg;base64,second', 'second.jpg'); });
    expect(result.current.photos[0].name).toBe('second.jpg');
  });
});
```

- [ ] **Step 2: Rodar teste e confirmar falha**

```powershell
pnpm vitest run src/hooks/__tests__/useGallery.test.js
```

Esperado: FAIL com `Cannot find module '../useGallery'`

- [ ] **Step 3: Criar `src/hooks/useGallery.js`**

```js
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
```

- [ ] **Step 4: Rodar teste e confirmar que passa**

```powershell
pnpm vitest run src/hooks/__tests__/useGallery.test.js
```

Esperado: 9 testes passando.

---

## Task 5: Hook `useEditor` (TDD)

**Files:**
- Create: `frontend/src/hooks/useEditor.js`
- Create: `frontend/src/hooks/__tests__/useEditor.test.js`

- [ ] **Step 1: Criar o arquivo de teste**

Criar `frontend/src/hooks/__tests__/useEditor.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditor } from '../useEditor';
import { DEFAULT_ADJUSTMENTS } from '../../utils/buildFilterString';

beforeEach(() => {
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
});

const makeFile = (name = 'test.jpg') => new File([''], name, { type: 'image/jpeg' });

describe('useEditor', () => {
  it('começa em modo idle', () => {
    const { result } = renderHook(() => useEditor());
    expect(result.current.mode).toBe('idle');
    expect(result.current.imageURL).toBeNull();
    expect(result.current.imageFile).toBeNull();
  });

  it('loadImage muda para modo editing', () => {
    const { result } = renderHook(() => useEditor());
    act(() => result.current.loadImage(makeFile()));
    expect(result.current.mode).toBe('editing');
    expect(result.current.imageURL).toBe('blob:mock-url');
  });

  it('loadFromDataURL carrega dataURL diretamente', () => {
    const { result } = renderHook(() => useEditor());
    act(() => result.current.loadFromDataURL('data:image/jpeg;base64,abc', 'foto.jpg'));
    expect(result.current.mode).toBe('editing');
    expect(result.current.imageURL).toBe('data:image/jpeg;base64,abc');
    expect(result.current.imageFile.name).toBe('foto.jpg');
  });

  it('applyAdjustment atualiza valor e habilita undo', () => {
    const { result } = renderHook(() => useEditor());
    act(() => result.current.loadImage(makeFile()));
    act(() => result.current.applyAdjustment('brightness', 1.5));
    expect(result.current.adjustments.brightness).toBe(1.5);
    expect(result.current.canUndo).toBe(true);
  });

  it('undo reverte último ajuste', () => {
    const { result } = renderHook(() => useEditor());
    act(() => result.current.loadImage(makeFile()));
    act(() => result.current.applyAdjustment('brightness', 1.5));
    act(() => result.current.undo());
    expect(result.current.adjustments.brightness).toBe(DEFAULT_ADJUSTMENTS.brightness);
    expect(result.current.canUndo).toBe(false);
  });

  it('redo restaura ajuste após undo', () => {
    const { result } = renderHook(() => useEditor());
    act(() => result.current.loadImage(makeFile()));
    act(() => result.current.applyAdjustment('contrast', 1.8));
    act(() => result.current.undo());
    expect(result.current.canRedo).toBe(true);
    act(() => result.current.redo());
    expect(result.current.adjustments.contrast).toBe(1.8);
    expect(result.current.canRedo).toBe(false);
  });

  it('novo ajuste após undo apaga o histórico futuro', () => {
    const { result } = renderHook(() => useEditor());
    act(() => result.current.loadImage(makeFile()));
    act(() => result.current.applyAdjustment('contrast', 1.8));
    act(() => result.current.undo());
    act(() => result.current.applyAdjustment('saturation', 2.0));
    expect(result.current.canRedo).toBe(false);
  });

  it('reset volta adjustments para padrão e limpa cropBox', () => {
    const { result } = renderHook(() => useEditor());
    act(() => result.current.loadImage(makeFile()));
    act(() => result.current.applyAdjustment('brightness', 1.9));
    act(() => result.current.confirmCrop({ x: 10, y: 10, width: 200, height: 150 }));
    act(() => result.current.reset());
    expect(result.current.adjustments).toEqual(DEFAULT_ADJUSTMENTS);
    expect(result.current.cropBox).toBeNull();
  });

  it('clearImage retorna ao modo idle e revoga blob URL', () => {
    const { result } = renderHook(() => useEditor());
    act(() => result.current.loadImage(makeFile()));
    act(() => result.current.clearImage());
    expect(result.current.mode).toBe('idle');
    expect(result.current.imageURL).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('startCrop muda para modo cropping', () => {
    const { result } = renderHook(() => useEditor());
    act(() => result.current.loadImage(makeFile()));
    act(() => result.current.startCrop());
    expect(result.current.mode).toBe('cropping');
  });

  it('confirmCrop salva cropBox e volta para editing', () => {
    const { result } = renderHook(() => useEditor());
    act(() => result.current.loadImage(makeFile()));
    act(() => result.current.startCrop());
    act(() => result.current.confirmCrop({ x: 10, y: 20, width: 300, height: 200 }));
    expect(result.current.mode).toBe('editing');
    expect(result.current.cropBox).toEqual({ x: 10, y: 20, width: 300, height: 200 });
  });

  it('cancelCrop volta para editing sem alterar cropBox', () => {
    const { result } = renderHook(() => useEditor());
    act(() => result.current.loadImage(makeFile()));
    act(() => result.current.startCrop());
    act(() => result.current.cancelCrop());
    expect(result.current.mode).toBe('editing');
    expect(result.current.cropBox).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar teste e confirmar falha**

```powershell
pnpm vitest run src/hooks/__tests__/useEditor.test.js
```

Esperado: FAIL com `Cannot find module '../useEditor'`

- [ ] **Step 3: Criar `src/hooks/useEditor.js`**

```js
import { useState, useCallback, useReducer } from 'react';
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
    default:
      return state;
  }
}

export function useEditor() {
  const [imageFile, setImageFile] = useState(null);
  const [imageURL, setImageURL] = useState(null);
  const [mode, setMode] = useState('idle');
  const [cropBox, setCropBox] = useState(null);

  const [history, dispatch] = useReducer(historyReducer, {
    entries: [DEFAULT_ADJUSTMENTS],
    index: 0,
  });

  const adjustments = history.entries[history.index];
  const canUndo = history.index > 0;
  const canRedo = history.index < history.entries.length - 1;

  const loadImage = useCallback((file) => {
    const url = URL.createObjectURL(file);
    setImageFile(file);
    setImageURL(url);
    setMode('editing');
    setCropBox(null);
    dispatch({ type: 'RESET' });
  }, []);

  const loadFromDataURL = useCallback((dataURL, name) => {
    setImageFile({ name });
    setImageURL(dataURL);
    setMode('editing');
    setCropBox(null);
    dispatch({ type: 'RESET' });
  }, []);

  const applyAdjustment = useCallback((key, value) => {
    dispatch({ type: 'PUSH', adjustments: { ...history.entries[history.index], [key]: value } });
  }, [history]);

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
    if (imageURL && imageURL.startsWith('blob:')) URL.revokeObjectURL(imageURL);
    setImageFile(null);
    setImageURL(null);
    setMode('idle');
    setCropBox(null);
    dispatch({ type: 'RESET' });
  }, [imageURL]);

  return {
    imageFile, imageURL, mode, adjustments, cropBox,
    canUndo, canRedo,
    loadImage, loadFromDataURL, applyAdjustment,
    undo, redo, reset, clearImage,
    startCrop, confirmCrop, cancelCrop,
  };
}
```

- [ ] **Step 4: Rodar teste e confirmar que passa**

```powershell
pnpm vitest run src/hooks/__tests__/useEditor.test.js
```

Esperado: 13 testes passando.

- [ ] **Step 5: Rodar todos os testes**

```powershell
pnpm vitest run
```

Esperado: todos os testes passando (buildFilterString + useGallery + useEditor).

---

## Task 6: Hook `useExport`

**Files:**
- Create: `frontend/src/hooks/useExport.js`

Nota: useExport usa Canvas API extensivamente. jsdom não suporta canvas de forma real, então este hook é verificado via teste manual (Task 14).

- [ ] **Step 1: Criar `src/hooks/useExport.js`**

```js
import { useCallback } from 'react';

function applySharpnessKernel(ctx, width, height, amount) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const copy = new Uint8ClampedArray(data);
  const k = amount * 0.3;

  const kernel = [0, -k, 0, -k, 1 + 4 * k, -k, 0, -k, 0];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const v =
          kernel[0] * copy[((y-1)*width+(x-1))*4+c] + kernel[1] * copy[((y-1)*width+x)*4+c]   + kernel[2] * copy[((y-1)*width+(x+1))*4+c] +
          kernel[3] * copy[(y*width+(x-1))*4+c]     + kernel[4] * copy[i+c]                    + kernel[5] * copy[(y*width+(x+1))*4+c]     +
          kernel[6] * copy[((y+1)*width+(x-1))*4+c] + kernel[7] * copy[((y+1)*width+x)*4+c]   + kernel[8] * copy[((y+1)*width+(x+1))*4+c];
        data[i + c] = Math.min(255, Math.max(0, v));
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

function applyVignetteCanvas(ctx, width, height, amount) {
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.3,
    width / 2, height / 2, Math.max(width, height) * 0.7
  );
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, `rgba(0,0,0,${(amount * 0.8).toFixed(2)})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

export function useExport() {
  const exportToDataURL = useCallback(async (imageURL, adjustments, cropBox) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageURL;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const src = cropBox ?? { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight };

    const canvas = document.createElement('canvas');
    canvas.width = src.width;
    canvas.height = src.height;
    const ctx = canvas.getContext('2d');

    const { brightness, exposure, contrast, saturation, temperature, sharpness, vignette } = adjustments;
    const brightnessVal = (brightness * exposure).toFixed(3);
    const tempSepia = temperature > 0 ? ((temperature / 100) * 0.3).toFixed(3) : '0';
    const tempHue = (-(temperature / 100) * 20).toFixed(1);

    ctx.filter = `brightness(${brightnessVal}) contrast(${contrast}) saturate(${saturation}) sepia(${tempSepia}) hue-rotate(${tempHue}deg)`;
    ctx.drawImage(img, src.x, src.y, src.width, src.height, 0, 0, src.width, src.height);
    ctx.filter = 'none';

    if (sharpness > 0) {
      applySharpnessKernel(ctx, src.width, src.height, sharpness);
    }

    if (vignette > 0) {
      applyVignetteCanvas(ctx, src.width, src.height, vignette);
    }

    return canvas.toDataURL('image/jpeg', 0.92);
  }, []);

  return { exportToDataURL };
}
```

---

## Task 7: Componente `TopBar`

**Files:**
- Create: `frontend/src/components/TopBar/TopBar.jsx`

- [ ] **Step 1: Criar `src/components/TopBar/TopBar.jsx`**

```jsx
import { Link, useLocation } from 'react-router-dom';

export default function TopBar({ mode = 'idle', fileName, canUndo, canRedo, onUndo, onRedo, onNewPhoto, onExport }) {
  const location = useLocation();

  return (
    <header className="h-13 bg-bg-surface border-b border-border-main flex items-center px-5 gap-3 flex-shrink-0">
      <Link to="/" className="flex items-center gap-2 flex-shrink-0 select-none">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-brand to-purple-brand flex items-center justify-center text-[11px] font-black text-white">F</div>
        <span className="font-extrabold text-sm bg-gradient-to-r from-blue-light to-purple-light bg-clip-text text-transparent tracking-tight">FaceFilter</span>
      </Link>

      {mode === 'editing' && (
        <>
          {fileName && (
            <span className="text-xs text-text-muted truncate max-w-[180px] hidden sm:block border-l border-border-main pl-3 ml-1">
              {fileName}
            </span>
          )}
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Desfazer"
              className="px-2.5 py-1 text-xs rounded-md border border-border-main text-text-muted hover:text-text-primary hover:border-border-light disabled:opacity-25 disabled:cursor-not-allowed transition-all"
            >
              ↩
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Refazer"
              className="px-2.5 py-1 text-xs rounded-md border border-border-main text-text-muted hover:text-text-primary hover:border-border-light disabled:opacity-25 disabled:cursor-not-allowed transition-all"
            >
              ↪
            </button>
          </div>
        </>
      )}

      <nav className="ml-auto flex items-center gap-2">
        <Link
          to="/galeria"
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all
            ${location.pathname === '/galeria'
              ? 'bg-blue-brand/15 text-blue-light'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-raised'
            }`}
        >
          Galeria
        </Link>

        {mode === 'editing' && (
          <>
            <button
              onClick={onNewPhoto}
              className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-raised rounded-lg transition-all"
            >
              Nova foto
            </button>
            <button
              onClick={onExport}
              className="px-4 py-1.5 text-xs font-bold bg-green-600 hover:bg-green-500 text-white rounded-lg shadow transition-all"
            >
              Exportar
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
```

---

## Task 8: Componente `DropZone`

**Files:**
- Create: `frontend/src/components/DropZone/DropZone.jsx`

- [ ] **Step 1: Criar `src/components/DropZone/DropZone.jsx`**

```jsx
import { useState, useRef } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 20 * 1024 * 1024;

function validate(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Formato inválido. Use JPG, PNG ou WebP.';
  if (file.size > MAX_SIZE_BYTES) return `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 20MB.`;
  return null;
}

export default function DropZone({ onFile }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  function handleFile(file) {
    const err = validate(file);
    if (err) { setError(err); return; }
    setError(null);
    onFile(file);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onInputChange(e) {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex-1 flex flex-col items-center justify-center gap-6 m-6 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer select-none
        ${dragging
          ? 'border-blue-brand bg-blue-brand/5 scale-[1.005]'
          : 'border-border-main hover:border-border-light hover:bg-bg-surface/40'
        }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={onInputChange}
        className="hidden"
      />

      <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center transition-all duration-200
        ${dragging ? 'bg-blue-brand/10 border-blue-brand/40' : 'bg-bg-surface border-border-main'}`}
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
          className={`transition-colors duration-200 ${dragging ? 'text-blue-light' : 'text-text-muted'}`}
        >
          <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12M8.5 7.5L12 4l3.5 3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className="text-center">
        <p className={`font-semibold text-base transition-colors ${dragging ? 'text-blue-light' : 'text-text-primary'}`}>
          {dragging ? 'Solte aqui' : 'Arraste sua foto aqui'}
        </p>
        <p className="text-text-muted text-sm mt-1.5">
          ou <span className="text-blue-light underline underline-offset-2">selecione um arquivo</span>
        </p>
        <p className="text-text-muted text-xs mt-3">JPG, PNG ou WebP — até 20MB</p>
      </div>

      {error && (
        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 max-w-xs text-center">
          {error}
        </p>
      )}
    </div>
  );
}
```

---

## Task 9: Redesign `SliderControl`

**Files:**
- Modify: `frontend/src/components/SliderControl/SliderControl.jsx`

- [ ] **Step 1: Substituir o conteúdo de `SliderControl.jsx`**

```jsx
export default function SliderControl({ label, value, min, max, step = 0.01, onChange }) {
  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const isInteger = Number.isInteger(step);
  const display = isInteger ? value : value.toFixed(2);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-xs font-bold text-blue-light tabular-nums">{display}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-bg-raised">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-brand to-purple-brand pointer-events-none"
          style={{ width: `${percent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-1.5 opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
```

---

## Task 10: Componente `AdjustmentsPanel`

**Files:**
- Create: `frontend/src/components/AdjustmentsPanel/AdjustmentsPanel.jsx`

- [ ] **Step 1: Criar `src/components/AdjustmentsPanel/AdjustmentsPanel.jsx`**

```jsx
import { useState } from 'react';
import SliderControl from '../SliderControl/SliderControl';

const SLIDERS = [
  { key: 'brightness',   label: 'Brilho',       min: 0.0, max: 2.0, step: 0.01 },
  { key: 'exposure',     label: 'Exposição',     min: 0.5, max: 1.5, step: 0.01 },
  { key: 'contrast',     label: 'Contraste',     min: 0.0, max: 2.0, step: 0.01 },
  { key: 'saturation',   label: 'Saturação',     min: 0.0, max: 3.0, step: 0.01 },
  { key: 'temperature',  label: 'Temperatura',   min: -100, max: 100, step: 1   },
  { key: 'sharpness',    label: 'Nitidez',       min: 0,   max: 3.0, step: 0.1  },
  { key: 'vignette',     label: 'Vinheta',       min: 0,   max: 1.0, step: 0.01 },
];

const RATIOS = [
  { label: 'Livre',  value: null },
  { label: '1:1',    value: [1, 1] },
  { label: '4:3',    value: [4, 3] },
  { label: '16:9',   value: [16, 9] },
  { label: '9:16',   value: [9, 16] },
];

export default function AdjustmentsPanel({ adjustments, onAdjust, onReset, onStartCrop }) {
  const [tab, setTab] = useState('ajustes');

  return (
    <aside className="w-[290px] flex-shrink-0 bg-bg-surface border-l border-border-main flex flex-col overflow-hidden">
      <div className="flex border-b border-border-main flex-shrink-0">
        {['ajustes', 'recortar'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-bold tracking-wide uppercase transition-all border-b-2
              ${tab === t
                ? 'border-blue-light text-blue-light'
                : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
          >
            {t === 'ajustes' ? 'Ajustes' : 'Recortar'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'ajustes' && (
          <div className="flex flex-col gap-5">
            {SLIDERS.map(s => (
              <SliderControl
                key={s.key}
                label={s.label}
                value={adjustments[s.key]}
                min={s.min}
                max={s.max}
                step={s.step}
                onChange={(v) => onAdjust(s.key, v)}
              />
            ))}
            <button
              onClick={onReset}
              className="mt-1 py-2 text-xs text-text-muted hover:text-text-primary border border-border-main hover:border-border-light rounded-lg bg-bg-raised/20 transition-all"
            >
              Resetar tudo
            </button>
          </div>
        )}

        {tab === 'recortar' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-text-secondary leading-relaxed">
              Escolha uma proporção e arraste os handles para ajustar a área de recorte.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {RATIOS.map(r => (
                <button
                  key={r.label}
                  onClick={() => onStartCrop(r.value)}
                  className="py-2.5 text-xs font-bold border border-border-main hover:border-blue-brand hover:text-blue-light rounded-xl bg-bg-raised/20 transition-all"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
```

---

## Task 11: Componente `CropOverlay`

**Files:**
- Create: `frontend/src/components/CropOverlay/CropOverlay.jsx`

- [ ] **Step 1: Criar `src/components/CropOverlay/CropOverlay.jsx`**

```jsx
import { useState, useCallback, useEffect, useRef } from 'react';

const HANDLES = ['nw','n','ne','e','se','s','sw','w'];

function getHandleStyle(id, box) {
  const { x, y, w, h } = box;
  const mid = { x: x + w / 2, y: y + h / 2 };
  const pos = {
    nw: { top: y - 5, left: x - 5 },
    n:  { top: y - 5, left: mid.x - 5 },
    ne: { top: y - 5, left: x + w - 5 },
    e:  { top: mid.y - 5, left: x + w - 5 },
    se: { top: y + h - 5, left: x + w - 5 },
    s:  { top: y + h - 5, left: mid.x - 5 },
    sw: { top: y + h - 5, left: x - 5 },
    w:  { top: mid.y - 5, left: x - 5 },
  };
  const cursors = { nw:'nw-resize', n:'n-resize', ne:'ne-resize', e:'e-resize', se:'se-resize', s:'s-resize', sw:'sw-resize', w:'w-resize' };
  return { ...pos[id], cursor: cursors[id] };
}

export default function CropOverlay({ imageRef, aspectRatio, onConfirm, onCancel }) {
  const [box, setBox] = useState(null);
  const dragRef = useRef(null);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;
    const { offsetWidth: w, offsetHeight: h } = img;
    const pad = 0.15;
    let bw = w * (1 - pad * 2);
    let bh = h * (1 - pad * 2);
    if (aspectRatio) {
      const [ar, ab] = aspectRatio;
      if (bw / bh > ar / ab) bw = bh * (ar / ab);
      else bh = bw * (ab / ar);
    }
    setBox({ x: (w - bw) / 2, y: (h - bh) / 2, w: bw, h: bh });
  }, [aspectRatio, imageRef]);

  const onMouseDown = useCallback((e, handle) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { handle, startX: e.clientX, startY: e.clientY, startBox: { ...box } };
  }, [box]);

  const onMouseMove = useCallback((e) => {
    if (!dragRef.current || !imageRef.current) return;
    const { offsetWidth: imgW, offsetHeight: imgH } = imageRef.current;
    const { handle, startX, startY, startBox: sb } = dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    let { x, y, w, h } = sb;

    if (handle === 'move') {
      x = Math.max(0, Math.min(imgW - w, sb.x + dx));
      y = Math.max(0, Math.min(imgH - h, sb.y + dy));
    } else {
      if (handle.includes('e')) w = Math.max(30, Math.min(imgW - sb.x, sb.w + dx));
      if (handle.includes('w')) { x = Math.max(0, Math.min(sb.x + sb.w - 30, sb.x + dx)); w = sb.w - (x - sb.x); }
      if (handle.includes('s')) h = Math.max(30, Math.min(imgH - sb.y, sb.h + dy));
      if (handle.includes('n')) { y = Math.max(0, Math.min(sb.y + sb.h - 30, sb.y + dy)); h = sb.h - (y - sb.y); }
      if (aspectRatio) {
        const [ar, ab] = aspectRatio;
        if (handle.includes('e') || handle.includes('w')) h = w * (ab / ar);
        else w = h * (ar / ab);
      }
    }
    setBox({ x, y, w, h });
  }, [aspectRatio, imageRef]);

  const onMouseUp = useCallback(() => { dragRef.current = null; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  function handleConfirm() {
    if (!box || !imageRef.current) return;
    const img = imageRef.current;
    const scaleX = img.naturalWidth / img.offsetWidth;
    const scaleY = img.naturalHeight / img.offsetHeight;
    onConfirm({
      x: Math.round(box.x * scaleX),
      y: Math.round(box.y * scaleY),
      width: Math.round(box.w * scaleX),
      height: Math.round(box.h * scaleY),
    });
  }

  if (!box) return null;

  const { x, y, w, h } = box;
  const outsidePath = `0 0, 100% 0, 100% 100%, 0 100%, 0 ${y}px, ${x}px ${y}px, ${x}px ${y+h}px, ${x+w}px ${y+h}px, ${x+w}px ${y}px, 0 ${y}px`;

  return (
    <div className="absolute inset-0 z-20">
      <div className="absolute inset-0 bg-black/55 pointer-events-none" style={{ clipPath: `polygon(${outsidePath})` }} />

      <div
        className="absolute border border-white/70"
        style={{ top: y, left: x, width: w, height: h, cursor: 'move' }}
        onMouseDown={(e) => onMouseDown(e, 'move')}
      >
        {/* Rule-of-thirds grid */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`v${i}`} className="absolute inset-y-0 border-l border-white/20" style={{ left: `${(i+1) * 33.33}%` }} />
          ))}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`h${i}`} className="absolute inset-x-0 border-t border-white/20" style={{ top: `${(i+1) * 33.33}%` }} />
          ))}
        </div>
      </div>

      {HANDLES.map(id => (
        <div
          key={id}
          className="absolute w-2.5 h-2.5 bg-white border border-black/20 rounded-sm shadow-sm"
          style={{ position: 'absolute', ...getHandleStyle(id, box) }}
          onMouseDown={(e) => onMouseDown(e, id)}
        />
      ))}

      <div className="absolute flex gap-2 z-10" style={{ top: Math.min(y + h + 10, (imageRef.current?.offsetHeight ?? 400) - 50), left: x }}>
        <button onClick={handleConfirm} className="px-3 py-1.5 text-xs font-bold bg-blue-brand text-white rounded-lg shadow-lg hover:bg-blue-light transition-all">
          Confirmar
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 text-xs font-bold bg-bg-surface/90 text-text-secondary border border-border-main rounded-lg shadow-lg hover:text-white transition-all">
          Cancelar
        </button>
      </div>
    </div>
  );
}
```

---

## Task 12: Componente `EditorCanvas`

**Files:**
- Create: `frontend/src/components/EditorCanvas/EditorCanvas.jsx`

- [ ] **Step 1: Criar `src/components/EditorCanvas/EditorCanvas.jsx`**

```jsx
import { useRef } from 'react';
import { buildFilterString } from '../../utils/buildFilterString';
import CropOverlay from '../CropOverlay/CropOverlay';

export default function EditorCanvas({ imageURL, adjustments, mode, cropAspectRatio, onConfirmCrop, onCancelCrop }) {
  const imgRef = useRef(null);
  const filterString = buildFilterString(adjustments);
  const { sharpness, vignette } = adjustments;

  return (
    <div className="flex-1 bg-slate-950 flex items-center justify-center overflow-hidden relative">
      {sharpness > 0 && (
        <svg width="0" height="0" className="absolute" aria-hidden="true">
          <defs>
            <filter id="sharpen">
              <feConvolveMatrix
                order="3"
                kernelMatrix={`0 -${(sharpness * 0.3).toFixed(2)} 0 -${(sharpness * 0.3).toFixed(2)} ${(1 + sharpness * 1.2).toFixed(2)} -${(sharpness * 0.3).toFixed(2)} 0 -${(sharpness * 0.3).toFixed(2)} 0`}
                preserveAlpha="true"
              />
            </filter>
          </defs>
        </svg>
      )}

      <div className="relative inline-block max-w-full max-h-full">
        <img
          ref={imgRef}
          src={imageURL}
          alt="Foto sendo editada"
          className="block select-none"
          style={{
            filter: filterString,
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 60px)',
            objectFit: 'contain',
          }}
          draggable={false}
        />

        {vignette > 0 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,${(vignette * 0.85).toFixed(2)}) 100%)` }}
          />
        )}

        {mode === 'cropping' && (
          <CropOverlay
            imageRef={imgRef}
            aspectRatio={cropAspectRatio}
            onConfirm={onConfirmCrop}
            onCancel={onCancelCrop}
          />
        )}
      </div>
    </div>
  );
}
```

---

## Task 13: Página `Editor` (assembly)

**Files:**
- Modify: `frontend/src/pages/Editor/Editor.jsx`

- [ ] **Step 1: Substituir `src/pages/Editor/Editor.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useEditor } from '../../hooks/useEditor';
import { useExport } from '../../hooks/useExport';
import { useGallery } from '../../hooks/useGallery';
import TopBar from '../../components/TopBar/TopBar';
import DropZone from '../../components/DropZone/DropZone';
import EditorCanvas from '../../components/EditorCanvas/EditorCanvas';
import AdjustmentsPanel from '../../components/AdjustmentsPanel/AdjustmentsPanel';

export default function Editor() {
  const location = useLocation();
  const editor = useEditor();
  const { exportToDataURL } = useExport();
  const { savePhoto, getPhotoById } = useGallery();
  const [cropAspectRatio, setCropAspectRatio] = useState(null);

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

  async function handleExport() {
    if (!editor.imageURL || !editor.imageFile) return;
    try {
      const dataURL = await exportToDataURL(editor.imageURL, editor.adjustments, editor.cropBox);
      const baseName = editor.imageFile.name.replace(/\.[^/.]+$/, '');
      const fileName = `${baseName}_editado.jpg`;
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = fileName;
      a.click();
      savePhoto(dataURL, fileName);
    } catch (err) {
      console.error('Erro ao exportar:', err);
    }
  }

  const isEditing = editor.mode === 'editing' || editor.mode === 'cropping';

  return (
    <div className="h-screen flex flex-col bg-bg-base overflow-hidden">
      <TopBar
        mode={isEditing ? 'editing' : 'idle'}
        fileName={editor.imageFile?.name}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onNewPhoto={editor.clearImage}
        onExport={handleExport}
      />

      {!isEditing ? (
        <DropZone onFile={editor.loadImage} />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <EditorCanvas
            imageURL={editor.imageURL}
            adjustments={editor.adjustments}
            mode={editor.mode}
            cropAspectRatio={cropAspectRatio}
            onConfirmCrop={editor.confirmCrop}
            onCancelCrop={editor.cancelCrop}
          />
          <AdjustmentsPanel
            adjustments={editor.adjustments}
            onAdjust={editor.applyAdjustment}
            onReset={editor.reset}
            onStartCrop={handleStartCrop}
          />
        </div>
      )}
    </div>
  );
}
```

---

## Task 14: Página `Gallery`

**Files:**
- Modify: `frontend/src/pages/Gallery/Gallery.jsx`

- [ ] **Step 1: Substituir `src/pages/Gallery/Gallery.jsx`**

```jsx
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
```

---

## Task 15: Routing — `App.jsx` + `AppRoutes.jsx`

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/routes/AppRoutes.jsx`

- [ ] **Step 1: Substituir `src/App.jsx`**

```jsx
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Substituir `src/routes/AppRoutes.jsx`**

```jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Editor from '../pages/Editor/Editor';
import Gallery from '../pages/Gallery/Gallery';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Editor />} />
      <Route path="/galeria" element={<Gallery />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

- [ ] **Step 3: Remover o import do App.css que não existe mais**

Verificar se `src/App.css` ainda existe e se é importado em algum lugar. Se sim, deletar o arquivo e remover o import.

```powershell
if (Test-Path src/App.css) { Remove-Item src/App.css }
```

- [ ] **Step 4: Iniciar o servidor de desenvolvimento**

```powershell
pnpm dev
```

Esperado: servidor sobe em `http://localhost:5173` sem erros de compilação.

- [ ] **Step 5: Verificar no browser que o app funciona**

Abrir `http://localhost:5173`. Esperado:
- Tela do editor com drop zone centralizada
- TopBar com logo e link "Galeria"
- Navegar para `/galeria` — mensagem de galeria vazia com botão "Começar a editar"
- Voltar para `/` — editor com drop zone

---

## Task 16: Teste funcional manual (end-to-end)

**Files:** nenhum (apenas verificação manual)

- [ ] **Step 1: Testar upload**

Com o servidor rodando em `http://localhost:5173`:
1. Arrastar uma foto JPG para a drop zone → imagem deve aparecer no canvas
2. Clicar na drop zone → abrir seletor de arquivo → selecionar PNG → imagem deve aparecer
3. Tentar upload de arquivo `.txt` → mensagem de erro inline deve aparecer

- [ ] **Step 2: Testar ajustes em tempo real**

Com imagem carregada:
1. Mover slider Brilho → imagem deve clarear/escurecer em tempo real
2. Mover slider Temperatura para +100 → imagem deve ficar mais quente (dourada)
3. Mover slider Temperatura para -100 → imagem deve ficar mais fria (azulada)
4. Mover slider Vinheta → bordas devem escurecer
5. Mover slider Nitidez → sharpness aplicado
6. Clicar "Resetar tudo" → sliders voltam ao centro, imagem ao original

- [ ] **Step 3: Testar undo/redo**

1. Ajustar Brilho → botão ↩ deve habilitar
2. Clicar ↩ → Brilho volta ao valor anterior
3. Clicar ↪ → Brilho retorna ao valor ajustado
4. Botão ↩ desabilitado quando não há histórico

- [ ] **Step 4: Testar recorte**

1. Clicar aba "Recortar"
2. Clicar "1:1" → CropOverlay aparece sobre a imagem com proporção 1:1
3. Arrastar handles → box deve redimensionar
4. Clicar "Confirmar" → overlay some, modo volta para editing
5. Clicar "Recortar" → "Livre" → arrastar livremente
6. Clicar "Cancelar" → overlay some sem alterar nada

- [ ] **Step 5: Testar exportação e galeria**

1. Com imagem editada, clicar "Exportar"
2. Download deve iniciar automaticamente (arquivo `*_editado.jpg`)
3. Navegar para `/galeria` → foto exportada deve aparecer no grid
4. Hover na foto → botões "Editar", "↓", "×" aparecem
5. Clicar "×" → foto removida da galeria e do localStorage
6. Clicar "Editar" → volta para editor com a foto carregada
7. Clicar "↓" → download da foto

- [ ] **Step 6: Rodar todos os testes unitários**

```powershell
pnpm vitest run
```

Esperado: todos passando.

---

## Task 17: Visual design polish (frontend-design skill)

**Files:** vários componentes

- [ ] **Step 1: Invocar a skill `frontend-design`**

Invocar `frontend-design:frontend-design` para refinar a identidade visual do FaceFilter com um design único e profissional. Ao invocar, passar o contexto:

> "O FaceFilter é um editor de fotos no browser. Já tem todos os componentes funcionando: TopBar, DropZone, EditorCanvas, AdjustmentsPanel, CropOverlay, Gallery. O design atual usa dark theme (#111827 base, blue/purple accents). Preciso de uma identidade visual única e profissional — não genérica. Foco especial em: DropZone (tela de entrada do usuário), EditorCanvas (área principal), AdjustmentsPanel (sliders e abas). Tailwind CSS 4 com design tokens já configurados."

---

## Notas de Implementação

- **Ordem das tasks:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17
- **Tasks 3-5 são TDD:** escrever teste → confirmar falha → implementar → confirmar passou
- **Task 6** (useExport) não tem testes unitários — testada manualmente na Task 16
- **Task 17** deve ser feita após Task 16 confirmada funcionando — design polish não deve quebrar funcionalidade
- **CSS files dos componentes deletados** (`Sidebar.css`, `Navbar.css`, etc.): já foram removidos junto com os componentes na Task 1
- **`Editor.css` e `Gallery.css` antigos:** substituídos pelas novas versões. Se existirem arquivos `.css` nas pastas, podem ser esvaziados ou deletados — estilos agora são todos via Tailwind inline
