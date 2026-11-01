import { describe, it, expect } from 'vitest';
import { defaultPlant, evaluatePlant, sanitizePlant } from '../../src/lib/plantModel.js';

describe('plantModel', () => {
  it('la planta por defecto cumple todas las comprobaciones', () => {
    const r = evaluatePlant(defaultPlant());
    expect(r.verdict).toBe('ok');
    expect(r.turbOut).toBeLessThanOrEqual(1);
    expect(r.stages.find((s) => s.id === 'sedimentation').metric).toBeCloseTo(40 * 3.6 / 80, 5);
  });
  it('sin filtración ni desinfección no cumple', () => {
    const p = defaultPlant();
    p.stages.filtration.enabled = false;
    p.stages.disinfection.enabled = false;
    const r = evaluatePlant(p);
    expect(r.verdict).toBe('fail');
    expect(r.checks.find((c) => c.id === 'filtration').ok).toBe(false);
    expect(r.checks.find((c) => c.id === 'disinfection').ok).toBe(false);
  });
  it('más caudal sobrecarga el sedimentador y sube la turbidez de salida', () => {
    const base = evaluatePlant(defaultPlant());
    const p = defaultPlant(); p.q = 120;
    const r = evaluatePlant(p);
    expect(r.stages.find((s) => s.id === 'sedimentation').status).toBe('warn');
    expect(r.turbOut).toBeGreaterThan(base.turbOut);
  });
  it('sin coagulación la turbidez de salida empeora', () => {
    const p = defaultPlant(); p.stages.coagulation.enabled = false;
    expect(evaluatePlant(p).turbOut).toBeGreaterThan(evaluatePlant(defaultPlant()).turbOut);
  });
  it('datos corruptos o vacíos se sanean y nunca dan NaN', () => {
    const p = sanitizePlant({ q: '', turb: 'x', stages: { filtration: { area: -5 } } });
    const r = evaluatePlant(p);
    expect(Number.isFinite(r.turbOut)).toBe(true);
    expect(sanitizePlant(null)).toEqual(defaultPlant());
  });
});
