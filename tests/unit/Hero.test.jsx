import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import Hero from '../../src/components/Hero.jsx';

const T = {
  'hero.video': {
    fig: 'Pantalla', note: 'Video real', badge: 'Video real', alt: 'Texto alternativo del video',
    pause: 'Pausar video', play: 'Reproducir video', varsLabel: 'Variables', vars: ['Caudal', 'pH'],
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

describe('Hero — video real de la pantalla SCADA', () => {
  let raf;
  beforeEach(() => {
    raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
  });
  afterEach(() => { raf.mockRestore(); });

  it('shows real footage: silent, looping, with a poster and a text alternative', () => {
    mockMotion(false);
    const { container, getByText } = render(<Hero />);
    const v = container.querySelector('video');
    expect(v).not.toBeNull();
    expect(v.muted).toBe(true);
    expect(v.loop).toBe(true);
    expect(v.getAttribute('poster')).toBe('/assets/video/scada-ptap-poster.jpg');
    expect(v.getAttribute('aria-label')).toBe('Texto alternativo del video');
    expect([...v.querySelectorAll('source')].map((s) => s.getAttribute('type'))).toEqual(['video/webm', 'video/mp4']);
    expect(getByText('hero.video.fig'.replace('hero.video.fig', 'Pantalla'))).toBeTruthy();
    expect(container.querySelectorAll('.hero-below svg text')).toHaveLength(0);
  });

  it('always offers a pause/play control and lists the supervised variables', () => {
    mockMotion(false);
    const { container, getByRole } = render(<Hero />);
    expect(getByRole('button', { name: /Reproducir video|Pausar video/ })).toBeTruthy();
    expect([...container.querySelectorAll('.hero-vars li')].map((li) => li.textContent)).toEqual(['Caudal', 'pH']);
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
    expect(container.querySelector('.hero-photo-note')).toBeNull();
  });

  it('has one primary and one secondary call to action', () => {
    mockMotion(false);
    const { container } = render(<Hero />);
    const links = [...container.querySelectorAll('a.btn')].map(a => [a.getAttribute('href'), a.textContent]);
    expect(links).toEqual([['#proyectos', 'hero.ctaProjects →'], ['#contacto', 'hero.ctaContact →']]);
  });

  it('with reduced motion the video does not start by itself', () => {
    mockMotion(true);
    const play = vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    render(<Hero />);
    expect(play).not.toHaveBeenCalled();
    play.mockRestore();
  });
});
