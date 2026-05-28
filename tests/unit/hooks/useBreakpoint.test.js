import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBreakpoint } from '../../../src/hooks/useBreakpoint.js';

describe('useBreakpoint', () => {
  let changeHandler;
  const mockMQ = {
    matches: false,
    addEventListener: vi.fn((_, h) => { changeHandler = h; }),
    removeEventListener: vi.fn(),
  };

  beforeEach(() => {
    changeHandler = undefined;
    mockMQ.matches = false;
    mockMQ.addEventListener.mockClear();
    mockMQ.removeEventListener.mockClear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn(() => mockMQ),
    });
  });

  it('returns isMobile=true when innerWidth <= 768', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.isMobile).toBe(true);
  });

  it('returns isMobile=false when innerWidth > 768', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.isMobile).toBe(false);
  });

  it('updates isMobile when matchMedia fires change event', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.isMobile).toBe(false);
    act(() => { changeHandler({ matches: true }); });
    expect(result.current.isMobile).toBe(true);
  });
});
