import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { ScrollBackground } from '../../src/components/ScrollBackground.jsx';

const seekToSpy = vi.fn();

vi.mock('@remotion/player', () => ({
  Player: React.forwardRef((_props, ref) => {
    React.useImperativeHandle(ref, () => ({ seekTo: seekToSpy }));
    return React.createElement('div', { 'data-testid': 'remotion-player' });
  }),
}));

vi.mock('../../src/remotion/ScrollBG.jsx', () => ({
  ScrollBG: () => null,
}));

describe('ScrollBackground', () => {
  beforeEach(() => {
    seekToSpy.mockClear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    vi.stubGlobal('requestAnimationFrame', (fn) => { fn(); return 0; });
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  it('mounts the Player', () => {
    const { getByTestId } = render(<ScrollBackground />);
    expect(getByTestId('remotion-player')).not.toBeNull();
  });

  it('calls seekTo when scroll event fires', async () => {
    Object.defineProperty(document.body, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    vi.stubGlobal('scrollY', 600);

    render(<ScrollBackground />);

    await act(async () => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(seekToSpy).toHaveBeenCalledWith(expect.any(Number));
  });

  it('does not mount Player when prefers-reduced-motion is reduce', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const { queryByTestId } = render(<ScrollBackground />);
    expect(queryByTestId('remotion-player')).toBeNull();
  });
});
