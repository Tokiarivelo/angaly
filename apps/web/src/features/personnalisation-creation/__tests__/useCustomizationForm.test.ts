import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCustomizationForm } from '../hooks/useCustomizationForm';

describe('useCustomizationForm', () => {
  it('should initialize with empty or provided values', () => {
    const { result } = renderHook(() => useCustomizationForm());
    
    expect(result.current.options).toEqual({ notes: '', detailsDecoratifs: '' });
    expect(result.current.isValid).toBe(false);
  });

  it('should handle option changes', () => {
    const { result } = renderHook(() => useCustomizationForm());
    
    act(() => {
      result.current.handleOptionChange('coupe', 'Droite');
    });
    
    expect(result.current.options.coupe).toBe('Droite');
    expect(result.current.isValid).toBe(true);

    // Toggle off
    act(() => {
      result.current.handleOptionChange('coupe', 'Droite');
    });

    expect(result.current.options.coupe).toBeUndefined();
    expect(result.current.isValid).toBe(false);
  });

  it('should handle text fields', () => {
    const { result } = renderHook(() => useCustomizationForm());

    act(() => {
      result.current.setNotes('Notes here');
      result.current.setDetailsDecoratifs('Details here');
    });

    expect(result.current.notes).toBe('Notes here');
    expect(result.current.detailsDecoratifs).toBe('Details here');
    expect(result.current.options.notes).toBe('Notes here');
    expect(result.current.options.detailsDecoratifs).toBe('Details here');
  });
});
