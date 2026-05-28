import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import Hero from '../../src/components/Hero.jsx';

const SCHEMATIC_LABELS = {
  captacion: 'Captación', coagFloc: 'Coag/Floc', sedimentacion: 'Sedim.',
  lamelar: 'Lamelar', filtracion: 'Filtr.', desinfeccion: 'Desin.',
  reserva: 'Reserva', liveBadge: '● LIVE',
  sensors: { caudal: 'Caudal', presion: 'Presión', turb: 'Turbidez', ph: 'pH' },
};

vi.mock('../../src/i18n.jsx', () => ({
  LangProvider: ({ children }) => children,
  useT: () => (key) => key === 'hero.schematicLabels' ? SCHEMATIC_LABELS : key,
  useLang: () => ['es', vi.fn()],
}));

vi.mock('../../src/components/primitives.jsx', () => ({
  useTick: () => 0,
  jitter: () => 0,
  StatusDot: ({ label }) => React.createElement('span', null, label),
  Logo: () => React.createElement('span', null, 'logo'),
  AnimatedNumber: ({ value }) => React.createElement('span', null, String(value)),
  useInView: () => [React.createRef(), true],
}));

describe('Hero schematic — intro video phase', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
  });

  it('renders a <video> pointing to /assets/ptap-intro.mp4 on first load', () => {
    const { container } = render(<Hero />);
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video.getAttribute('src')).toBe('/assets/ptap-intro.mp4');
    expect(video.muted).toBe(true);
  });

  it('switches to live SVG schematic when video fires onEnded', async () => {
    const { container } = render(<Hero />);
    const video = container.querySelector('video');
    expect(video).not.toBeNull();

    await act(async () => {
      video.dispatchEvent(new Event('ended'));
    });

    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('skips video and shows SVG immediately when prefers-reduced-motion is reduce', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    const { container } = render(<Hero />);
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
