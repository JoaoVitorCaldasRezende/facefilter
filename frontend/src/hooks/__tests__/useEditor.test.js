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
