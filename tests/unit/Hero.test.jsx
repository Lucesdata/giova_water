import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import Hero from '../../src/components/Hero.jsx';

const T = {
  'hero.facts': ['11 años', 'Colombia y España'],
};
vi.mock('../../src/i18n.jsx', () => ({
  useT: () => (key) => (key in T ? T[key] : key),
  useLang: () => ['es', vi.fn()],
}));

describe('Hero', () => {
  it('has a single level-1 heading with the value proposition key', () => {
    const { container } = render(<Hero />);
    const h1s = container.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toBe('hero.h1');
  });

  it('puts the field photo behind the headline as a decorative image', () => {
    const { container } = render(<Hero />);
    const img = container.querySelector('.hero-photo img');
    expect(img.getAttribute('src')).toBe('/assets/giovanni-field.jpg');
    expect(img.getAttribute('alt')).toBe('');
    expect(container.querySelector('.hero-photo-note')).toBeNull();
  });

  it('has one primary and one secondary call to action', () => {
    const { container } = render(<Hero />);
    const links = [...container.querySelectorAll('.hero-actions a.btn')].map((a) => [a.getAttribute('href'), a.className, a.textContent]);
    expect(links).toEqual([
      ['#proyectos', 'btn primary', 'hero.ctaProjects →'],
      ['#contacto', 'btn hero-secondary', 'hero.ctaContact'],
    ]);
  });

  it('lists the short facts under the actions and keeps the video out of the first screen', () => {
    const { container } = render(<Hero />);
    expect([...container.querySelectorAll('.hero-facts li')].map((li) => li.textContent)).toEqual(['11 años', 'Colombia y España']);
    expect(container.querySelector('video')).toBeNull();
  });
});
