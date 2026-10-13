import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import Hero from '../../src/components/Hero.jsx';

const T = {
  'hero.schematicLabels': {
    captacion: 'Captación', coagFloc: 'Coag/Floc', sedimentacion: 'Sedim.',
    lamelar: 'Lamelar', filtracion: 'Filtr.', desinfeccion: 'Desin.', reserva: 'Reserva',
    sensors: { caudal: 'Caudal', presion: 'Presión', turb: 'Turbidez', ph: 'pH' },
  },
  'hero.stats': [{ v: '11', l: 'años' }],
};
vi.mock('../../src/i18n.jsx', () => ({
  useT: () => (key) => (key in T ? T[key] : key),
  useLang: () => ['es', vi.fn()],
}));

function mockMotion(reduce) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((q) => ({
      matches: q.includes('prefers-reduced-motion') ? reduce : false,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })),
  });
}

describe('Hero — portada sin vídeo', () => {
  let raf;
  beforeEach(() => {
    raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
  });
  afterEach(() => { raf.mockRestore(); });

  it('shows the illustrative schematic and never requests a video', () => {
    mockMotion(false);
    const { container } = render(<Hero />);
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.innerHTML).not.toMatch(/ptap-intro|\.mp4/);
  });

  it('labels the diagram as illustrative and exposes a text alternative', () => {
    mockMotion(false);
    const { getByText, getByRole } = render(<Hero />);
    expect(getByText('hero.badge')).toBeTruthy();
    expect(getByText('hero.figNote')).toBeTruthy();
    expect(getByRole('img', { name: 'hero.schematicAlt' })).toBeTruthy();
  });

  it('has a single level-1 heading with the value proposition key', () => {
    mockMotion(false);
    const { container } = render(<Hero />);
    const h1s = container.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toBe('hero.h1');
  });

  it('puts the field photo behind the headline as a decorative image, labelled as illustrative', () => {
    mockMotion(false);
    const { container, getByText } = render(<Hero />);
    const img = container.querySelector('.hero-photo img');
    expect(img.getAttribute('src')).toBe('/assets/giovanni-field.jpg');
    expect(img.getAttribute('alt')).toBe('');
    expect(getByText('hero.imageNote')).toBeTruthy();
  });

  it('has one primary and one secondary call to action', () => {
    mockMotion(false);
    const { container } = render(<Hero />);
    const links = [...container.querySelectorAll('a.btn')].map(a => [a.getAttribute('href'), a.textContent]);
    expect(links).toEqual([['#proyectos', 'hero.ctaProjects →'], ['#contacto', 'hero.ctaContact →']]);
  });

  it('animates the flow when motion is allowed', () => {
    mockMotion(false);
    render(<Hero />);
    expect(raf).toHaveBeenCalled();
  });

  it('keeps a static diagram (no animation loop) with prefers-reduced-motion', () => {
    mockMotion(true);
    const { container } = render(<Hero />);
    expect(raf).not.toHaveBeenCalled();
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
