import { describe, it, expect } from 'vitest';
import { simReducer, initialState, readingsFor, statusOf, SCENARIO_IDS, TARGETS } from '../../src/lib/twinSim.js';

describe('simulación ilustrativa del gemelo', () => {
  it('arranca en operación normal y todo en rango', () => {
    const s = initialState();
    expect(s.scenario).toBe('normal');
    expect(s.tick).toBe(0);
    for (const k of ['q', 'p', 'tu', 'ph']) expect(statusOf(k, s.readings[k]).status).toBe('ok');
  });

  it('demanda alta: sube el caudal, baja la presión y se acerca el límite de turbidez en cualquier muestra', () => {
    for (let tick = 0; tick < 200; tick++) {
      const n = readingsFor('normal', tick);
      const a = readingsFor('alta', tick);
      expect(a.q).toBeGreaterThan(n.q);
      expect(a.p).toBeLessThan(n.p);
      expect(a.tu).toBeGreaterThan(n.tu);
      expect(statusOf('q', a.q).status).toBe('warn');
      expect(statusOf('p', a.p)).toEqual({ status: 'warn', dir: 'low' });
      expect(statusOf('tu', a.tu).status).toBe('warn');
    }
  });

  it('caudal reducido: el caudal cae bajo el rango esperado y se marca como bajo', () => {
    for (let tick = 0; tick < 200; tick++) {
      const r = readingsFor('reducido', tick);
      expect(r.q).toBeLessThan(TARGETS.normal.q);
      expect(statusOf('q', r.q)).toEqual({ status: 'warn', dir: 'low' });
      expect(statusOf('p', r.p).status).toBe('ok');
    }
  });

  it('cambiar de escenario añade una muestra con los valores nuevos y no avanza el reloj', () => {
    const s0 = initialState();
    const s1 = simReducer(s0, { type: 'scenario', id: 'alta' });
    expect(s1.scenario).toBe('alta');
    expect(s1.tick).toBe(0);
    expect(s1.readings.q).toBeGreaterThan(s0.readings.q);
    expect(s1.series.q.at(-1)).toBe(s1.readings.q);
    expect(s1.series.q).toHaveLength(s0.series.q.length);
  });

  it('un escenario desconocido o el mismo escenario no cambian el estado', () => {
    const s = initialState();
    expect(simReducer(s, { type: 'scenario', id: 'inventado' })).toBe(s);
    expect(simReducer(s, { type: 'scenario', id: 'normal' })).toBe(s);
  });

  it('cada muestra avanza el reloj y desplaza la serie', () => {
    let s = initialState();
    s = simReducer(s, { type: 'tick' });
    s = simReducer(s, { type: 'tick' });
    expect(s.tick).toBe(2);
    expect(s.series.ph.at(-1)).toBe(s.readings.ph);
  });

  it('restablecer devuelve exactamente el estado inicial', () => {
    let s = initialState();
    s = simReducer(s, { type: 'scenario', id: 'reducido' });
    for (let i = 0; i < 5; i++) s = simReducer(s, { type: 'tick' });
    expect(simReducer(s, { type: 'reset' })).toEqual(initialState());
  });

  it('tiene exactamente los tres escenarios pedidos', () => {
    expect(SCENARIO_IDS).toEqual(['normal', 'alta', 'reducido']);
  });
});
