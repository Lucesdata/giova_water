import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider, dictionary } from '../../src/i18n.jsx';
import { KeyFigures } from '../../src/components/Cycle.jsx';
import { projectBySlug } from '../../src/data/projects.js';

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem('giova_water:lang', 'es');
});

describe('Cifras clave', () => {
  it('cuatro cifras, cada una enlazada a un proyecto real, con rol y año en los tres idiomas', () => {
    for (const lang of ['es', 'en', 'fr']) {
      const sc = dictionary[lang].hero.scope;
      expect(sc.items).toHaveLength(4);
      for (const it of sc.items) {
        expect(projectBySlug(it.slug), `${lang} ${it.slug}`).toBeDefined();
        for (const k of ['v', 'l', 'role', 'year']) expect(it[k], `${lang} ${it.slug}.${k}`).toMatch(/\S/);
      }
    }
  });
  it('son estáticas: muestran la cifra final y un enlace a la ficha, sin botones', () => {
    const { container } = render(<LangProvider><KeyFigures /></LangProvider>);
    expect(container.querySelectorAll('button')).toHaveLength(0);
    expect([...container.querySelectorAll('.figure-v')].map((e) => e.textContent)).toEqual(['37', '9 097 m', '10', '16 / 16']);
    const link = screen.getByRole('link', { name: /^Ver proyecto: 10 PTAPs rurales con medición de caudal entregadas/ });
    expect(link.getAttribute('href')).toBe('#proyecto/monitoreo-automatizacion-uaesp');
  });
  it('la cifra de monitoreo coincide con la ficha: 10 con caudal, no 11', () => {
    const es = dictionary.es.hero.scope.items.find((i) => i.slug === 'monitoreo-automatizacion-uaesp');
    expect(es.v).toBe('10');
    expect(JSON.stringify(dictionary.es.projects.data['P-007'].metrics)).toContain('"10"');
  });
});
