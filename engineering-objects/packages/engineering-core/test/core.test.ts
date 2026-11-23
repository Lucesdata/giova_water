import { describe, expect, it } from 'vitest';
import {
  CalcTrace,
  CheckList,
  UnitError,
  circleDiameterFromArea,
  conicalFloorVolume,
  contentHash,
  convert,
  deepFreeze,
  evaluateRange,
  lateralSpillChannelUpstreamDepth,
  lpsToM3h,
  requiredSurfaceArea,
  selectDn,
  stableStringify,
  summarize,
  vNotchFlow,
  vNotchHead,
} from '../src/index.js';

describe('unidades', () => {
  it('Q[m³/h] = 3,6·Q[L/s] (spec §5.1)', () => {
    expect(lpsToM3h(5)).toBeCloseTo(18, 12);
    expect(lpsToM3h(1)).toBeCloseTo(3.6, 12);
  });
  it('convierte entre unidades de la misma dimensión', () => {
    expect(convert(1, 'm3/(m2.h)', 'm3/(m2.d)')).toBeCloseTo(24, 12);
    expect(convert(90, 'deg', 'rad')).toBeCloseTo(Math.PI / 2, 12);
    expect(convert(250, 'mm', 'm')).toBeCloseTo(0.25, 12);
  });
  it('nunca convierte en silencio entre dimensiones distintas', () => {
    expect(() => convert(1, 'm', 'L/s')).toThrow(UnitError);
  });
});

describe('hidráulica genérica', () => {
  it('A = Q/CHS y D = √(4A/π)', () => {
    const a = requiredSurfaceArea(18, 1.5);
    expect(a).toBeCloseTo(12, 12);
    expect(circleDiameterFromArea(a)).toBeCloseTo(3.9088, 4);
  });
  it('rechaza cargas superficiales no positivas', () => {
    expect(() => requiredSurfaceArea(1, 0)).toThrow();
  });
  it('vNotchHead es la inversa de vNotchFlow', () => {
    const th = Math.PI / 2;
    for (const h of [0.01, 0.03, 0.08]) expect(vNotchHead(vNotchFlow(h, th, 0.58), th, 0.58)).toBeCloseTo(h, 12);
  });
  it('canal con aporte lateral: y₀ = √3·yc', () => {
    const q = 0.01;
    const b = 0.4;
    const yc = Math.cbrt((q * q) / (9.80665 * b * b));
    expect(lateralSpillChannelUpstreamDepth(q, b)).toBeCloseTo(Math.sqrt(3) * yc, 12);
  });
  it('volumen del fondo cónico = integración numérica', () => {
    const s = 0.08;
    const rs = 2.2;
    const rp = 0.4;
    let num = 0;
    const n = 200000;
    for (let i = 0; i < n; i++) {
      const r = ((i + 0.5) / n) * rs;
      const depth = s * (rs - Math.max(r, rp));
      num += 2 * Math.PI * r * depth * (rs / n);
    }
    expect(conicalFloorVolume(s, rs, rp)).toBeCloseTo(num, 6);
  });
  it('selecciona el menor DN que cumple la velocidad máxima', () => {
    const sel = selectDn(0.0125, 1.5);
    expect(sel.dn).toBe(125);
    expect(sel.velocityAtDesignM_s).toBeLessThanOrEqual(1.5);
    expect(selectDn(0.0001, 1, 150).dn).toBe(150);
    expect(selectDn(100, 1).exhausted).toBe(true);
  });
});

describe('restricciones y validación', () => {
  it('evaluateRange distingue FAIL y WARNING', () => {
    expect(evaluateRange(5, { max: 4 }).status).toBe('FAIL');
    expect(evaluateRange(3.5, { max: 4, warnMax: 3 }).status).toBe('WARNING');
    expect(evaluateRange(2, { min: 1, warnMax: 3 }).status).toBe('PASS');
    expect(evaluateRange(Number.NaN, {}).status).toBe('FAIL');
  });
  it('estado global: crítica pendiente ⇒ INCOMPLETE, FAIL ⇒ FAILED', () => {
    const c = new CheckList();
    c.add({ id: 'a', level: 2, status: 'PASS', title: '', message: '' });
    expect(summarize(c.list()).status).toBe('VALIDATED');
    c.add({ id: 'b', level: 4, status: 'NOT_EVALUATED', title: '', message: '', critical: true });
    expect(summarize(c.list()).status).toBe('INCOMPLETE');
    c.add({ id: 'c', level: 3, status: 'FAIL', title: '', message: '' });
    expect(summarize(c.list()).status).toBe('FAILED');
    expect(() => c.add({ id: 'a', level: 1, status: 'PASS', title: '', message: '' })).toThrow();
  });
});

describe('trazabilidad', () => {
  it('registra ecuación, unidad, versión y dependencias', () => {
    const t = new CalcTrace('TEST-1');
    t.record('q', 18, { label: 'Q', unit: 'm3/h', inputs: ['input.q'], equation: 'dato', origin: 'INPUT' });
    t.record('a', 12, { label: 'A', unit: 'm2', inputs: ['q', 'input.chs'], equation: 'A = Q/CHS' });
    t.record('d', 3.9, { label: 'D', unit: 'm', inputs: ['a'], equation: 'D = √(4A/π)' });
    expect(t.entry('d')?.methodVersion).toBe('TEST-1');
    expect(t.dependenciesOf('d')).toEqual(['a', 'input.chs', 'input.q', 'q']);
  });
  it('impide dependencias no calculadas y valores no finitos', () => {
    const t = new CalcTrace('T');
    expect(() => t.record('x', 1, { label: '', unit: 'm', inputs: ['y'], equation: '' })).toThrow();
    expect(() => t.record('z', Number.NaN, { label: '', unit: 'm', equation: '' })).toThrow();
  });
});

describe('utilidades de reproducibilidad', () => {
  it('stableStringify y contentHash no dependen del orden de claves', () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe(stableStringify({ a: { c: 3, d: 2 }, b: 1 }));
    expect(contentHash({ b: 1, a: 2 })).toBe(contentHash({ a: 2, b: 1 }));
    expect(contentHash({ a: 1 })).not.toBe(contentHash({ a: 2 }));
  });
  it('deepFreeze congela en profundidad', () => {
    const o = deepFreeze({ a: { b: [1, 2] } });
    expect(Object.isFrozen(o.a.b)).toBe(true);
  });
});
