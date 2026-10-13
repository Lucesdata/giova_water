import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LangProvider } from '../../src/i18n.jsx';
import Faq from '../../src/components/Faq.jsx';
import Method from '../../src/components/Method.jsx';
import fs from 'node:fs';
import path from 'node:path';
import { dictionary } from '../../src/i18n.jsx';
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

describe('Method', () => {
  const method = dictionary.es.about.method;
  it('shows four stages as a plain list and keeps the contracting note', () => {
    motion(false);
    const { container } = render(<Method method={method} />);
    expect(container.querySelectorAll('.method-stage')).toHaveLength(4);
    expect(container.textContent).toMatch(/decisiones de contratación y adjudicación corresponden a cada entidad/);
  });
  it('puts the detail of every stage in an accessible native disclosure, closed by default', () => {
    motion(false);
    const { container } = render(<Method method={method} />);
    const details = [...container.querySelectorAll('details')];
    expect(details).toHaveLength(4);
    expect(details.every((d) => !d.open && d.querySelector('summary'))).toBe(true);
  });
  it('covers the seven original steps inside the four stages', () => {
    const steps = method.stages.flatMap((s) => s.steps);
    expect(steps).toHaveLength(7);
  });
});

describe('motion rules (stylesheet)', () => {
  const css = fs.readFileSync(path.resolve(__dirname, '../../src/styles/tokens.css'), 'utf8');
  it('has no blur on entry animations and no entry transition longer than 250 ms', () => {
    const reveal = css.slice(css.indexOf('.reveal {'), css.indexOf('.reveal.is-in'));
    expect(reveal).not.toMatch(/blur|filter/);
    const times = [...css.matchAll(/(?:transition|animation)[^;{}]*?(\d+)ms/g)].map((m) => Number(m[1]));
    expect(Math.max(...times)).toBeLessThanOrEqual(250);
    const shift = reveal.match(/translateY\((\d+)px\)/);
    expect(Number(shift[1])).toBeLessThanOrEqual(12);
  });
  it('turns smooth scrolling on only when the visitor has not asked for reduced motion', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\)\s*\{\s*html \{ scroll-behavior: smooth; \}/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*scroll-behavior: auto/);
  });
  it('keeps one single anchor offset: scroll-padding from the real header height', () => {
    expect(css).toMatch(/scroll-padding-top: var\(--nav-h/);
    expect(css).not.toMatch(/scroll-margin-top/);
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
