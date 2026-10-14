import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LangProvider, dictionary } from '../../src/i18n.jsx';
import { Scope, figureAt } from '../../src/components/Cycle.jsx';
import { SCOPE_MARKS, projectBySlug } from '../../src/data/projects.js';

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem('giova_water:lang', 'es');
});

describe('figureAt: cuenta cada número con el separador del idioma', () => {
  it('llega a la cifra exacta y la deja intacta al final', () => {
    for (const v of ['37', '9 097 m', '9,097 m', '16 / 16', '10']) expect(figureAt(v, 1)).toBe(v);
  });
  it('a mitad de camino conserva el formato', () => {
    expect(figureAt('37', 0)).toBe('0');
    expect(figureAt('16 / 16', 0.5)).toBe('8 / 8');
    expect(figureAt('9 097 m', 0.5)).toBe('4 549 m');
    expect(figureAt('9,097 m', 0.5)).toBe('4,549 m');
  });
});

describe('Scope: tarjetas de cifras', () => {
  it('cada tarjeta enlaza a un proyecto real y trae rol, año y detalle en los tres idiomas', () => {
    for (const lang of ['es', 'en', 'fr']) {
      const sc = dictionary[lang].hero.scope;
      expect(sc.items).toHaveLength(SCOPE_MARKS.length);
      for (const it of sc.items) {
        expect(projectBySlug(it.slug), `${lang} ${it.slug}`).toBeDefined();
        for (const k of ['v', 'l', 'role', 'year', 'detail']) expect(it[k], `${lang} ${it.slug}.${k}`).toMatch(/\S/);
      }
    }
  });
  it('el detalle está cerrado al inicio y se abre y cierra con el botón', () => {
    render(<LangProvider><Scope /></LangProvider>);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    const b = buttons[2];
    expect(b.getAttribute('aria-expanded')).toBe('false');
    const panel = document.getElementById(b.getAttribute('aria-controls'));
    expect(panel.hidden).toBe(true);
    fireEvent.click(b);
    expect(b.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hidden).toBe(false);
    expect(panel.querySelector('a').getAttribute('href')).toBe('#proyecto/monitoreo-automatizacion-uaesp');
    fireEvent.click(b);
    expect(panel.hidden).toBe(true);
  });
  it('el nombre accesible del botón trae la cifra completa aunque la visual esté contando', () => {
    render(<LangProvider><Scope /></LangProvider>);
    expect(screen.getByRole('button', { name: /^10 PTAPs rurales con medición de caudal entregadas/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^16 \/ 16 vertidos ilegales/ })).toBeTruthy();
  });
  it('la cifra de monitoreo coincide con la ficha: 10 con caudal, no 11', () => {
    const es = dictionary.es.hero.scope.items.find((i) => i.slug === 'monitoreo-automatizacion-uaesp');
    expect(es.v).toBe('10');
    expect(JSON.stringify(dictionary.es.projects.data['P-007'].metrics)).toContain('"10"');
  });
});
