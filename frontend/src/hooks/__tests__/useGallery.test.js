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
