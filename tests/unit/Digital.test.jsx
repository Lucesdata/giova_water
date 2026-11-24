import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LangProvider } from '../../src/i18n.jsx';
import Digital, { LAB_URL } from '../../src/components/Digital.jsx';

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
const renderDigital = () => render(<LangProvider><Digital /></LangProvider>);

describe('Operación digital', () => {
  let play; let pause;
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem('giova_water:lang', 'es');
    play = vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    pause = vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });
  afterEach(() => { play.mockRestore(); pause.mockRestore(); });

  it('keeps the old #gemelos and #objetos anchors', () => {
    mockMotion(false);
    const { container } = renderDigital();
    expect(container.querySelector('section#gemelos')).not.toBeNull();
    expect(container.querySelector('#gemelos #objetos')).not.toBeNull();
  });

  it('shows real footage: silent, looping, with a poster, a text alternative and the supervised variables', () => {
    mockMotion(false);
    const { container } = renderDigital();
    const v = container.querySelector('video');
    expect(v.muted).toBe(true);
    expect(v.loop).toBe(true);
    expect(v.getAttribute('poster')).toBe('/assets/video/scada-ptap-poster.jpg');
    expect(v.getAttribute('aria-label')).toMatch(/SCADA/);
    expect([...v.querySelectorAll('source')].map((s) => s.getAttribute('type'))).toEqual(['video/webm', 'video/mp4']);
    expect([...container.querySelectorAll('.pill-list li')].map((li) => li.textContent))
      .toEqual(['Caudal', 'Niveles de tanque', 'Turbiedad', 'pH', 'Oxígeno', 'Cloro residual']);
    expect(screen.getByRole('link', { name: /Ver el proyecto UAESP/ }).getAttribute('href')).toBe('#proyecto/monitoreo-automatizacion-uaesp');
  });

  it('always offers a pause/play control', () => {
    mockMotion(false);
    renderDigital();
    const b = screen.getByRole('button', { name: /Reproducir video|Pausar video/ });
    fireEvent.click(b);
    expect(b).toBeTruthy();
  });

  it('with reduced motion the video does not start by itself', () => {
    mockMotion(true);
    renderDigital();
    expect(play).not.toHaveBeenCalled();
  });

  it('shows the twin capture, says its values are simulated and links to its sheet', () => {
    mockMotion(false);
    renderDigital();
    expect(screen.getByText('Captura de la plataforma')).toBeTruthy();
    expect(screen.getByText(/sus valores son simulados/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /^Ver el proyecto$/ }).getAttribute('href')).toBe('#proyecto/gemelo-digital-la-voragine');
  });

  it('has no simulated dashboard: no gauges, scenarios or progress bars', () => {
    mockMotion(false);
    const { container } = renderDigital();
    expect(container.querySelectorAll('[role="progressbar"], canvas')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: /Demanda alta|Restablecer/ })).toBeNull();
  });

  it('links each piece of equipment and the lab', () => {
    mockMotion(false);
    const { container } = renderDigital();
    const hrefs = [...container.querySelectorAll('#objetos a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain(`${LAB_URL}?equipo=primary-clarifier`);
    expect(hrefs).toContain(`${LAB_URL}?equipo=clariflocculator`);
    expect(hrefs).toContain(LAB_URL);
  });
});
