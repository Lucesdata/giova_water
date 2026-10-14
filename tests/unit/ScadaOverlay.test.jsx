import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider, dictionary } from '../../src/i18n.jsx';
import ScadaOverlay from '../../src/components/ScadaOverlay.jsx';
import { projectById } from '../../src/data/projects.js';
import { SEG, N, END, TAGS } from '../../src/lib/scadaCues.js';

const LANGS = ['es', 'en', 'fr'];

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem('giova_water:lang', 'es');
});

const labels = (lang = 'es') => dictionary[lang].hero.video;
const view = (t, { playing = true, announce = false, lang = 'es' } = {}) =>
  render(<LangProvider><ScadaOverlay t={t} playing={playing} labels={labels(lang)} announce={announce} /></LangProvider>);

describe('ScadaOverlay: una callout por variable', () => {
  it('muestra la variable que toca según el tiempo del clip', () => {
    for (let i = 0; i < N; i++) {
      const { container, unmount } = view(i * SEG + SEG / 2);
      const l = labels();
      expect(container.querySelector('.scada-name').textContent).toBe(l.vars[i]);
      expect(container.querySelector('.scada-desc').textContent).toBe(l.desc[i]);
      expect(container.querySelector('.scada-tag').textContent).toBe(TAGS[i]);
      expect(container.querySelector('.scada-count').textContent).toBe(`0${i + 1} / 06`);
      unmount();
    }
  });
  it('en pausa (o sin empezar) deja la variable 01 completamente visible y quieta', () => {
    const { container } = view(0, { playing: false });
    const c = container.querySelector('.scada-callout');
    expect(c.style.opacity).toBe('1');
    expect(c.style.transform).toBe('translateY(0px)');
    expect(container.querySelector('.scada-name').textContent).toBe(labels().vars[0]);
  });
  it('la tarjeta de cierre enlaza a la ficha real de la UAESP', () => {
    const { container } = view(N * SEG + END / 2);
    expect(container.querySelector('.scada-callout')).toBeNull();
    const a = screen.getByRole('link', { name: labels().end.cta });
    expect(a.getAttribute('href')).toBe(`#proyecto/${projectById('P-007').slug}`);
    expect(container.querySelectorAll('.scada-end-vars li')).toHaveLength(N);
  });
  it('solo anuncia (role=status) cuando la persona saltó a una variable', () => {
    const auto = view(1, { announce: false });
    expect(auto.container.querySelector('.scada-callout').getAttribute('role')).toBeNull();
    expect(auto.container.querySelector('.scada-callout').getAttribute('aria-live')).toBeNull();
    auto.unmount();
    const manual = view(1, { announce: true });
    const c = manual.container.querySelector('.scada-callout');
    expect(c.getAttribute('role')).toBe('status');
    expect(c.getAttribute('aria-live')).toBe('polite');
  });
  it('ancla, línea guía, progreso y velo están ocultos a lectores de pantalla', () => {
    const { container } = view(1);
    for (const sel of ['.scada-anchor', '.scada-guide', '.scada-progress', '.scada-veil']) {
      expect(container.querySelector(sel).getAttribute('aria-hidden'), sel).toBe('true');
    }
  });
  it('muestra el chip de rótulos ilustrativos y que es una grabación, no una conexión en vivo', () => {
    const { container } = view(1);
    expect(container.querySelector('.scada-note').textContent).toBe(labels().labelsNote);
    expect(container.querySelector('.scada-rec').textContent).toContain(labels().rec);
  });
  it.each(LANGS)('%s: ningún número de lectura en el DOM, para ninguna variable ni el cierre', (lang) => {
    for (let k = 0; k <= N; k++) {
      const { container, unmount } = view(k * SEG + 0.5 + (k === N ? 0.1 : 0), { lang });
      expect(container.textContent, `${lang} ${k}`).not.toMatch(/\d+[,.]\d/);
      unmount();
    }
  });
});

describe('textos del overlay en los tres idiomas', () => {
  it.each(LANGS)('%s: seis descripciones, tarjeta final y rótulos completos', (lang) => {
    const l = labels(lang);
    expect(l.desc).toHaveLength(N);
    expect(l.vars).toHaveLength(N);
    for (const k of ['rec', 'online', 'unit', 'labelsNote']) expect(l[k], `${lang}.${k}`).toMatch(/\S/);
    for (const k of ['kicker', 'title', 'sub', 'cta']) expect(l.end[k], `${lang}.end.${k}`).toMatch(/\S/);
    for (const d of l.desc) expect(d.length).toBeGreaterThan(10);
  });
});
