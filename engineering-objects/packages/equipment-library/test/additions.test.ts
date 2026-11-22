import { describe, expect, it } from 'vitest';
import { convert } from '@eo/engineering-core';
import {
  DEC_005_DIDACTIC,
  OPERATIONAL_RECORD_FORMAT,
  OPERATIONAL_VARIABLES,
  createBaseVariant,
  designClarifier,
  parseOperationalRecord,
  readAgainstDesign,
} from '../src/index.js';

const withGeometry = (g: Record<string, unknown>) => ({ ...DEC_005_DIDACTIC, geometry: { ...DEC_005_DIDACTIC.geometry, ...g } });

describe('carga de sólidos (SLR = Q·Cs/A)', () => {
  const d = designClarifier(DEC_005_DIDACTIC); // 5 L/s, 250 mg/L, A = 12 m², Fp = 2,5
  it('calcula la carga afluente y la SLR media y punta', () => {
    expect(d.values['solids.influentLoad.avg']!.value).toBeCloseTo(432 * 0.25, 10); // 108 kg/d
    expect(d.values['loading.solids.avg']!.value).toBeCloseTo(9, 10);
    expect(d.values['loading.solids.peak']!.value).toBeCloseTo(22.5, 10);
    expect(d.values['loading.solids.avg']!.unit).toBe('kg/(m2.d)');
  });
  it('sin criterio con fuente queda NOT_EVALUATED; con criterio se evalúa', () => {
    expect(d.checks.find((c) => c.id === 'HYD-SLR-CRITERION')?.status).toBe('NOT_EVALUATED');
    const d2 = designClarifier({ ...DEC_005_DIDACTIC, criteriaOverrides: { solidsLoadingPeak: { max: 20, sourceId: 'USER', note: 'Criterio de prueba' } } });
    expect(d2.checks.find((c) => c.id === 'HYD-SLR-CRITERION')?.status).toBe('FAIL');
  });
  it('sin SST no se calcula y se dice por qué', () => {
    const d3 = designClarifier({ ...DEC_005_DIDACTIC, influent: {} });
    expect(d3.values['loading.solids.avg']).toBeUndefined();
    expect(d3.checks.find((c) => c.id === 'HYD-SLR-CRITERION')?.message).toMatch(/SST/);
  });
  it('unidades de carga de sólidos coherentes', () => {
    expect(convert(24, 'kg/(m2.d)', 'kg/(m2.h)')).toBeCloseTo(1, 12);
  });
});

describe('manto de lodos de diseño', () => {
  const base = designClarifier(DEC_005_DIDACTIC);
  const m = base.model;
  it('sin definir: no se descuenta y la comprobación queda NOT_EVALUATED', () => {
    expect(base.values['volume.deduction.sludgeBlanket']).toBeUndefined();
    expect(base.checks.find((c) => c.id === 'HYD-SLUDGE-BLANKET')?.status).toBe('NOT_EVALUATED');
  });
  it('descuenta la tolva y la capa hasta la cota del manto (neto de columna)', () => {
    const h = 0.5;
    const d = designClarifier(withGeometry({ sludgeBlanketDepthM: h }));
    const rc = m.rColumnOuter;
    const expected = base.values['volume.floorCone']!.value - Math.PI * rc ** 2 * m.sumpDrop + Math.PI * (m.R ** 2 - rc ** 2) * h;
    expect(d.values['volume.deduction.sludgeBlanket']!.value).toBeCloseTo(expected, 10);
    expect(d.values['volume.effective']!.value).toBeCloseTo(base.values['volume.effective']!.value - expected, 10);
    expect(d.values['hrt.avg']!.value).toBeLessThan(base.values['hrt.avg']!.value);
    expect(d.checks.find((c) => c.id === 'HYD-SLUDGE-BLANKET')?.status).toBe('PASS');
  });
  it('un manto que alcanza el pozo de alimentación es FAIL', () => {
    const d = designClarifier(withGeometry({ sludgeBlanketDepthM: 2.2 })); // pozo: 3,0 − 1,0 = 2,0 m
    expect(d.checks.find((c) => c.id === 'HYD-SLUDGE-BLANKET')?.status).toBe('FAIL');
    expect(d.summary.status).toBe('FAILED');
  });
});

describe('contrato de datos de operación', () => {
  const v = createBaseVariant(withGeometry({ sludgeBlanketDepthM: 0.5 }), { createdAt: 'x' });
  const rec = (values: Record<string, number>, extra: Record<string, unknown> = {}) => ({
    format: OPERATIONAL_RECORD_FORMAT,
    formatVersion: 1,
    variantId: v.variantId,
    recordedAt: '2026-11-22T08:00:00Z',
    origin: 'MEASURED',
    values,
    ...extra,
  });

  it('cada variable declara unidad', () => {
    for (const [k, def] of Object.entries(OPERATIONAL_VARIABLES)) expect(def.unit, k).toBeTruthy();
  });
  it('valida registros y rechaza variables desconocidas, vacíos y fechas inválidas', () => {
    expect(parseOperationalRecord(rec({ flowLps: 4 })).values.flowLps).toBe(4);
    expect(() => parseOperationalRecord(rec({ phantom: 1 }))).toThrow();
    expect(() => parseOperationalRecord(rec({}))).toThrow();
    expect(() => parseOperationalRecord(rec({ flowLps: -1 }))).toThrow();
    expect(() => parseOperationalRecord(rec({ flowLps: 1 }, { recordedAt: 'ayer' }))).toThrow();
  });
  it('lee el registro frente al diseño sin modificar la variante', () => {
    const snapshot = JSON.stringify(v);
    const r = readAgainstDesign(parseOperationalRecord(rec({ flowLps: 14, sludgeBlanketDepthM: 0.8, influentTssMgL: 250, effluentTssMgL: 150 })), v);
    expect(r.find((x) => x.key === 'flow.ratioToDesign')).toMatchObject({ observed: 2.8, status: 'OUTSIDE_DESIGN' });
    expect(r.find((x) => x.key === 'sludgeBlanket.clearanceToFeedwell')).toMatchObject({ status: 'OUTSIDE_DESIGN' });
    expect(r.find((x) => x.key === 'removal.tss.observed')!.observed).toBeCloseTo(40, 10);
    expect(JSON.stringify(v)).toBe(snapshot);
  });
  it('rechaza registros de otra variante', () => {
    expect(() => readAgainstDesign(parseOperationalRecord(rec({ flowLps: 1 }, { variantId: 'otra' })), v)).toThrow(/pertenece/);
  });
});
