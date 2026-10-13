import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LangProvider } from '../../src/i18n.jsx';
import Tagline from '../../src/components/Tagline.jsx';
import Faq from '../../src/components/Faq.jsx';
import CycleFlow from '../../src/components/CycleFlow.jsx';
import { Reveal } from '../../src/components/primitives.jsx';

let observers;
class FakeIO {
  constructor(cb, opts) { this.cb = cb; this.opts = opts; this.els = []; observers.push(this); }
  observe(el) { this.els.push(el); }
  unobserve() {}
  disconnect() { this.els = []; }
}
function motion(reduce) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true, configurable: true,
    value: vi.fn().mockImplementation((q) => ({
      matches: q.includes('reduced-motion') ? reduce : q.includes('max-width') ? false : false,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })),
  });
}
const wrap = (ui) => render(<LangProvider>{ui}</LangProvider>);

beforeEach(() => {
  observers = [];
  window.localStorage.clear();
  window.localStorage.setItem('giova_water:lang', 'es');
  vi.stubGlobal('IntersectionObserver', FakeIO);
});
afterEach(() => vi.unstubAllGlobals());

describe('Reveal', () => {
  it('starts hidden and shows once the element enters the viewport', () => {
    motion(false);
    const { container } = render(<Reveal>hola</Reveal>);
    const el = container.firstChild;
    expect(el.className).toContain('reveal');
    expect(el.className).not.toContain('is-in');
    act(() => observers[0].cb([{ isIntersecting: true }]));
    expect(el.className).toContain('is-in');
  });
  it('shows immediately with prefers-reduced-motion and registers no observer', () => {
    motion(true);
    const { container } = render(<Reveal>hola</Reveal>);
    expect(container.firstChild.className).toContain('is-in');
    expect(observers).toHaveLength(0);
  });
  it('uses IntersectionObserver, never a scroll listener', () => {
    motion(false);
    const spy = vi.spyOn(window, 'addEventListener');
    render(<Reveal>x</Reveal>);
    expect(spy.mock.calls.some(([type]) => type === 'scroll')).toBe(false);
    spy.mockRestore();
  });
});

describe('Tagline', () => {
  it('has at least two lines of copy and wakes words one at a time, in reading order', () => {
    motion(false);
    const { container } = wrap(<Tagline />);
    const words = [...container.querySelectorAll('.tagline-word')];
    expect(words.length).toBeGreaterThan(12);
    expect(words.some(w => w.classList.contains('on'))).toBe(false);

    // Words report their position relative to the trigger line (viewport y = 500).
    const tops = new Map(words.map((w) => [w, 900]));
    words.forEach((w) => { w.getBoundingClientRect = () => ({ top: tops.get(w) }); });
    const io = observers[0];
    const fire = (target) => act(() => io.cb([{ target, rootBounds: { bottom: 500 } }]));

    words.slice(0, 3).forEach((w) => tops.set(w, 100));
    fire(words[2]);
    expect(words.slice(0, 3).every(w => w.classList.contains('on'))).toBe(true);
    expect(words[3].classList.contains('on')).toBe(false);

    // Scrolling back up: the word goes below the line and dims again.
    tops.set(words[2], 900);
    fire(words[2]);
    expect(words[2].classList.contains('on')).toBe(false);
    expect(words[1].classList.contains('on')).toBe(true);
  });
  it('catches up after a jump: words that were skipped over are lit too', () => {
    motion(false);
    const { container } = wrap(<Tagline />);
    const words = [...container.querySelectorAll('.tagline-word')];
    // Everything but the last 3 words is now above the line; only the last ones were observed.
    words.forEach((w, i) => { w.getBoundingClientRect = () => ({ top: i < words.length - 3 ? -300 : 900 }); });
    act(() => observers[0].cb([{ target: words[words.length - 4], rootBounds: { bottom: 500 } }]));
    expect(words.filter(w => w.classList.contains('on'))).toHaveLength(words.length - 3);
  });
  it('shows the full text, with no dimming, under reduced motion', () => {
    motion(true);
    const { container } = wrap(<Tagline />);
    const words = [...container.querySelectorAll('.tagline-word')];
    expect(words.every(w => w.classList.contains('on'))).toBe(true);
  });
  it('keeps the sentence readable as plain text for assistive tech', () => {
    motion(false);
    const { container } = wrap(<Tagline />);
    expect(container.querySelector('p').textContent).toMatch(/necesidad de agua en un proyecto ejecutable/);
  });
});

describe('CycleFlow', () => {
  const cycle = { label: 'Cómo trabajo', title: 'T', note: 'N', steps: [{ t: 'Uno', d: 'a' }, { t: 'Dos', d: 'b' }, { t: 'Tres', d: 'c' }] };
  it('follows the scroll: the active step changes when a sentinel crosses the centre band', () => {
    motion(false);
    const { container } = wrap(<CycleFlow cycle={cycle} />);
    expect(container.querySelector('.cycle-stage')).not.toBeNull();
    const items = () => [...container.querySelectorAll('.cycle-item')];
    expect(items()[0].getAttribute('aria-current')).toBe('step');
    const sentinels = [...container.querySelectorAll('[data-i]')];
    act(() => observers[0].cb([{ isIntersecting: true, target: sentinels[2] }]));
    expect(items()[2].getAttribute('aria-current')).toBe('step');
    expect(items()[0].getAttribute('aria-current')).toBeNull();
    expect(container.textContent).toContain('Paso 3 de 3');
  });
  it('falls back to a plain list with reduced motion', () => {
    motion(true);
    const { container } = wrap(<CycleFlow cycle={cycle} />);
    expect(container.querySelector('.cycle-stage')).toBeNull();
    expect(container.querySelectorAll('li')).toHaveLength(3);
  });
});

describe('Faq', () => {
  it('lists 6 to 12 questions as native disclosure elements and a final CTA identical to the hero one', () => {
    motion(true);
    const { container } = wrap(<Faq />);
    const n = container.querySelectorAll('details.faq-item').length;
    expect(n).toBeGreaterThanOrEqual(6);
    expect(n).toBeLessThanOrEqual(12);
    const cta = screen.getByRole('link', { name: 'Consultar un proyecto' });
    expect(cta.getAttribute('href')).toBe('#contacto');
  });
  it('does not claim procurement powers', () => {
    motion(true);
    wrap(<Faq />);
    expect(screen.getByText(/Mi participación es técnica/)).toBeTruthy();
  });
});
