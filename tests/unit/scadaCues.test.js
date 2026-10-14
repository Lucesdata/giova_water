import { describe, it, expect } from 'vitest';
import { SEG, N, END, LOOP, ANCHORS, TAGS, UNITS, cueAt, progress, seekTime } from '../../src/lib/scadaCues.js';

describe('scadaCues: línea de tiempo del clip', () => {
  it('el ciclo completo dura lo que el clip: 6 variables + cierre = 16 s', () => {
    expect(LOOP).toBeCloseTo(16, 5);
    expect(SEG * N + END).toBeCloseTo(LOOP, 5);
  });
  it('hay un ancla, una etiqueta y una unidad por variable, dentro de la pantalla HMI', () => {
    expect(ANCHORS).toHaveLength(N);
    expect(TAGS).toHaveLength(N);
    expect(UNITS).toHaveLength(N);
    for (const [x, y] of ANCHORS) { expect(x).toBeGreaterThan(21); expect(x).toBeLessThan(43); expect(y).toBeGreaterThan(13); expect(y).toBeLessThan(46); }
  });
  it('cueAt: índice correcto en los límites de cada tramo', () => {
    expect(cueAt(0).index).toBe(0);
    expect(cueAt(2.19).index).toBe(0);
    expect(cueAt(2.2).index).toBe(1);
    expect(cueAt(13.19).index).toBe(5);
    expect(cueAt(13.2).index).toBe(-1);   // empieza la tarjeta de cierre
    expect(cueAt(15.99).index).toBe(-1);
    expect(cueAt(LOOP).index).toBe(0);    // vuelve a empezar
    expect(cueAt(LOOP + 2.2).index).toBe(1);
  });
  it('cueAt: el fade entra en el primer 12 % y sale en el último 10 %', () => {
    expect(cueAt(0).fade).toBe(0);
    expect(cueAt(SEG * 0.06).fade).toBeCloseTo(0.5, 5);
    expect(cueAt(SEG * 0.12).fade).toBeCloseTo(1, 5);
    expect(cueAt(SEG * 0.5).fade).toBe(1);
    expect(cueAt(SEG * 0.95).fade).toBeCloseTo(0.5, 5);
    expect(cueAt(SEG * 6 + END * 0.05).fade).toBeCloseTo(0.5, 5);   // cierre: 10 % de entrada
    expect(cueAt(SEG * 6 + END * 0.96).fade).toBeCloseTo(0.5, 5);   // cierre: 8 % de salida
  });
  it('cueAt tolera tiempos negativos o no numéricos', () => {
    expect(cueAt(-1).index).toBe(-1);
    expect(cueAt(NaN).index).toBe(0);
    expect(cueAt(undefined).index).toBe(0);
  });
  it('progress: 7 tramos, cada uno entre 0 y 1, y la suma crece con el tiempo', () => {
    let prev = -1;
    for (let t = 0; t < LOOP; t += 0.25) {
      const p = progress(t);
      expect(p).toHaveLength(N + 1);
      for (const f of p) { expect(f).toBeGreaterThanOrEqual(0); expect(f).toBeLessThanOrEqual(1); }
      const sum = p.reduce((a, b) => a + b, 0);
      expect(sum).toBeGreaterThanOrEqual(prev);
      prev = sum;
    }
    expect(progress(0).every((f) => f === 0)).toBe(true);
    progress(3.3).forEach((f, k) => expect(f).toBeCloseTo([1, 0.5, 0, 0, 0, 0, 0][k], 5));
  });
  it('seekTime cae dentro del tramo de su variable', () => {
    for (let i = 0; i < N; i++) expect(cueAt(seekTime(i)).index).toBe(i);
  });
});
