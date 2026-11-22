import { describe, expect, it } from 'vitest';
import {
  CriterionOverrideError,
  DEC_005_DIDACTIC,
  InputValidationError,
  VariantLibrary,
  createBaseVariant,
  createVariant,
  designClarifier,
  exportVariant,
  importVariant,
  regenerate,
  type DesignInputRaw,
} from '../src/index.js';

const T0 = '2026-01-01T00:00:00.000Z';
const hyd = (h: Record<string, unknown>): DesignInputRaw => ({ ...DEC_005_DIDACTIC, hydraulics: { ...DEC_005_DIDACTIC.hydraulics, ...h } });
const status = (d: ReturnType<typeof designClarifier>, id: string) => d.checks.find((c) => c.id === id)?.status;

describe('corona columna–pozo de alimentación', () => {
  it('si no hay corona: FAIL, sin velocidad ni deducción, y sin excepción', () => {
    // Pozo diminuto y sin mínimo constructivo: radio interior < radio de la columna.
    const d = designClarifier(hyd({ feedwellDiameterRatio: 0.02, feedwellMinDiameterM: 0 }));
    expect(status(d, 'GEO-FEEDWELL-ANNULUS')).toBe('FAIL');
    expect(d.values['feedwell.downwardVelocity.peak']).toBeUndefined();
    expect(status(d, 'HYD-FEEDWELL-VELOCITY')).toBe('NOT_EVALUATED');
    expect(d.values['volume.deduction.feedwell']!.value).toBe(0);
    expect(d.values['volume.effective']!.value).toBeLessThanOrEqual(d.values['volume.gross']!.value);
    expect(d.summary.status).toBe('FAILED');
  });
  it('con corona válida se conservan ambos cálculos', () => {
    const d = designClarifier(DEC_005_DIDACTIC);
    expect(status(d, 'GEO-FEEDWELL-ANNULUS')).toBe('PASS');
    expect(d.values['feedwell.downwardVelocity.peak']!.value).toBeGreaterThan(0);
    expect(d.values['volume.deduction.feedwell']!.value).toBeGreaterThan(0);
  });
});

describe('longitud efectiva de vertedero no positiva', () => {
  it.each([12.27, 20])('exclusión %d m: FAIL y cálculos dependientes no disponibles', (excl) => {
    const gross = designClarifier(DEC_005_DIDACTIC).values['weir.length.gross']!.value;
    const d = designClarifier(hyd({ weirExclusionLengthM: excl === 12.27 ? gross : excl }));
    expect(status(d, 'GEO-WEIR-LENGTH-POSITIVE')).toBe('FAIL');
    for (const k of ['loading.weir.avg', 'loading.weir.peak', 'weir.notchCount', 'weir.head.peak', 'weir.head.avg']) expect(d.values[k], k).toBeUndefined();
    for (const id of ['HYD-WEIR-LOADING-ADMISSIBLE', 'HYD-NOTCH-NOT-DROWNED', 'GEO-BRIDGE-CLEARANCE', 'HYD-FREEBOARD-OVER-PEAK']) expect(status(d, id), id).toBe('NOT_EVALUATED');
    expect(d.decisions.notchCount).toBe(0);
    expect(d.summary.status).toBe('FAILED');
  });
});

describe('velocidad en la conducción de lodos', () => {
  it('se comprueba también con DN fijado', () => {
    // 10 L/s de purga por un DN 100 fijado: ≈ 1,27 m/s > 1 m/s
    const base = createBaseVariant(hyd({ sludgePipeMinDn: 100, sludgeFlowFraction: 0.2 }), { createdAt: T0 });
    expect(base.calculatedOutputs.decisions.sludgeDn).toBe(100);
    const v = createVariant(base, { tag: 'X', flow: { averageLps: 50 } }, { mode: 'C', allowedResize: ['tank', 'inlet', 'feedwell', 'weir', 'effluent'] });
    expect(v.calculatedOutputs.decisions.sludgeDn).toBe(100);
    expect(v.calculatedOutputs.values['sludge.velocity']!.value).toBeCloseTo(0.01 / (Math.PI * 0.05 ** 2), 6);
    expect(v.calculatedOutputs.checks.find((c) => c.id === 'HYD-SLUDGE-VELOCITY')?.status).toBe('FAIL');
    expect(v.calculatedOutputs.checks.find((c) => c.id === 'HYD-SLUDGE-HYDRAULICS')?.status).toBe('NOT_EVALUATED');
  });
});

describe('overrides que añaden o endurecen, nunca relajan', () => {
  const pre = (o: Record<string, unknown>): DesignInputRaw => ({ ...DEC_005_DIDACTIC, profileId: 'preliminary-hydraulic', criteriaOverrides: { surfaceLoadingAvg: { sourceId: 'USER', note: 'Pliego', ...o } } });
  it('un override parcial conserva el máximo obligatorio del perfil y su fuente', () => {
    const d = designClarifier({ ...pre({ warnMin: 1.0 }), designCriteria: { surfaceLoadingAvgM_h: 3 } });
    const c = d.checks.find((x) => x.id === 'HYD-CHS-AVG-CRITERION')!;
    expect(c.status).toBe('FAIL'); // 3 m/h > 50/24 del perfil
    expect(c.message).toMatch(/Conserva del perfil \(METCALF-EDDY-2014\)/);
    expect(d.criteria.surfaceLoadingAvg!.constraint.max).toBeCloseTo(50 / 24, 12);
    expect(d.criteria.surfaceLoadingAvg!.inheritedSourceIds).toContain('METCALF-EDDY-2014');
  });
  it('se puede endurecer el máximo', () => {
    const d = designClarifier(pre({ max: 1.4 }));
    expect(d.checks.find((x) => x.id === 'HYD-CHS-AVG-CRITERION')?.status).toBe('FAIL');
  });
  it('relajar un límite duro se rechaza', () => {
    expect(() => designClarifier(pre({ max: 3 }))).toThrow(CriterionOverrideError);
    expect(() => designClarifier({ ...DEC_005_DIDACTIC, profileId: 'preliminary-hydraulic', criteriaOverrides: { hrtAvg: { min: 1.0, sourceId: 'USER', note: 'x' } } })).toThrow(/relaja el mínimo/);
  });
});

describe('materiales de hormigón', () => {
  it('los campos de hormigón rechazan materiales de otra familia', () => {
    expect(() => designClarifier({ ...DEC_005_DIDACTIC, civil: { ...DEC_005_DIDACTIC.civil, concrete: 'SS-1.4301' } })).toThrow(InputValidationError);
    expect(() => designClarifier({ ...DEC_005_DIDACTIC, civil: { ...DEC_005_DIDACTIC.civil, fillConcrete: 'STEEL-S275JR-HDG' } })).toThrow(InputValidationError);
  });
});

describe('modo B: geometría instalada fija', () => {
  it('al subir el caudal no cambian pozo, deflector, barredor ni caja; las láminas de operación sí', () => {
    const b = createBaseVariant(DEC_005_DIDACTIC, { createdAt: T0 });
    const v = createVariant(b, { tag: 'E', flow: { averageLps: 8 } }, { mode: 'B' });
    const db = regenerate(b);
    const dv = regenerate(v);
    for (const id of ['HYD-002', 'MEC-006', 'MEC-004', 'MEC-005', 'CIV-002', 'HYD-004']) {
      expect(dv.assembly.components.find((c) => c.componentId === id)!.hash, id).toBe(db.assembly.components.find((c) => c.componentId === id)!.hash);
    }
    expect(dv.model.yWaterPeakOperating).toBeGreaterThan(db.model.yWaterPeakOperating);
    expect(dv.model.yFeedwellTop).toBe(db.model.yFeedwellTop);
    expect(dv.checks.find((c) => c.id === 'HYD-SHELLS-ABOVE-WATER')?.status).toBe('PASS');
  });
  it('si la lámina de operación rebasa la coronación instalada: FAIL', () => {
    const b = createBaseVariant(hyd({ notchSpacingM: 2.0, notchDepthM: 0.5 }), { createdAt: T0 });
    const v = createVariant(b, { tag: 'E', flow: { averageLps: 100 } }, { mode: 'B' }); // lámina punta +0,17 m > resguardo de 0,15 m
    expect(v.calculatedOutputs.checks.find((c) => c.id === 'HYD-SHELLS-ABOVE-WATER')?.status).toBe('FAIL');
  });
});

describe('modo C: cambios geométricos fuera de los grupos permitidos', () => {
  const b = createBaseVariant(DEC_005_DIDACTIC, { createdAt: T0 });
  it('rechaza cambiar la poceta con solo el efluente permitido', () => {
    expect(() => createVariant(b, { tag: 'X', geometry: { sumpDepthM: 0.8 } }, { mode: 'C', allowedResize: ['effluent'] })).toThrow(/geometry\.sumpDepthM.*tank/);
  });
  it('un parche solo de efluente sigue funcionando', () => {
    const v = createVariant(b, { tag: 'X', hydraulics: { effluentMaxVelocityM_s: 0.8 } }, { mode: 'C', allowedResize: ['effluent'] });
    expect(v.calculatedOutputs.decisions.effluentDn).toBeGreaterThan(b.calculatedOutputs.decisions.effluentDn);
    expect(v.calculatedOutputs.decisions.diameterM).toBe(b.calculatedOutputs.decisions.diameterM);
  });
  it('los cambios mecánicos requieren el grupo mechanical; los materiales no', () => {
    expect(() => createVariant(b, { tag: 'X', mechanical: { armCount: 4 } }, { mode: 'C', allowedResize: [] })).toThrow(/mechanical/);
    expect(createVariant(b, { tag: 'X', mechanical: { armCount: 4 } }, { mode: 'C', allowedResize: ['mechanical'] }).designInputs.mechanical.armCount).toBe(4);
    expect(() => createVariant(b, { tag: 'X', mechanical: { materials: { ...DEC_005_DIDACTIC.mechanical.materials, submerged: 'SS-1.4404' } } }, { mode: 'C', allowedResize: [] })).not.toThrow();
  });
});

describe('importación: bloqueos coherentes con el modo', () => {
  const b = createBaseVariant(DEC_005_DIDACTIC, { createdAt: T0 });
  const evalB = createVariant(b, { tag: 'E', flow: { averageLps: 10 } }, { mode: 'B', createdAt: T0 });
  const tamper = (v: typeof evalB, f: (env: { variant: Record<string, unknown> }) => void) => {
    const env = JSON.parse(exportVariant(v));
    f(env);
    return JSON.stringify(env);
  };
  it('un archivo de modo B sin el diámetro bloqueado se rechaza, aunque declare otro modelo', () => {
    const json = tamper(evalB, (env) => {
      delete (env.variant.lockedDecisions as Record<string, number>).diameterM;
      env.variant.engineeringModelVersion = 'PC-ENG-0.9.0';
    });
    expect(() => importVariant(json)).toThrow(/faltan: diameterM/);
  });
  it('rechaza nombres y valores de bloqueo inválidos', () => {
    expect(() => importVariant(tamper(evalB, (env) => ((env.variant.lockedDecisions as Record<string, unknown>).foo = 1)))).toThrow();
    expect(() => importVariant(tamper(evalB, (env) => ((env.variant.lockedDecisions as Record<string, unknown>).inletDn = -5)))).toThrow();
    expect(() => importVariant(tamper(b as typeof evalB, (env) => ((env.variant.lockedDecisions as Record<string, unknown>).diameterM = 4)))).toThrow(/sobran: diameterM/);
  });
  it('un archivo válido de modo B se sigue importando verificado', () => {
    expect(importVariant(exportVariant(evalB)).verified).toBe(true);
  });
});

describe('biblioteca de variantes', () => {
  it('una repetición idéntica devuelve lo registrado y un id reutilizado se rechaza', () => {
    const b = createBaseVariant(DEC_005_DIDACTIC, { createdAt: T0, variantId: 'V' });
    const lib = new VariantLibrary();
    expect(lib.add(b)).toBe(b);
    expect(lib.add(createBaseVariant(DEC_005_DIDACTIC, { createdAt: T0, variantId: 'V' }))).toBe(b);
    expect(() => createVariant(b, { tag: 'DEC-005' }, { variantId: 'V' })).toThrow(/propia variante padre/);
    const forged = { ...createVariant(b, { tag: 'DEC-005' }), variantId: 'V' };
    expect(() => lib.add(forged)).toThrow(/distinta/);
    expect(lib.lineage('V')).toHaveLength(1);
  });
});

describe('segunda revisión', () => {
  it('cargas de SST trazadas a caudal medio y punta; la SLR se reproduce desde sus entradas', () => {
    const d = designClarifier(DEC_005_DIDACTIC);
    expect(d.values['solids.influentLoad.peak']!.value).toBeCloseTo(270, 10);
    for (const k of ['avg', 'peak'] as const) {
      const slr = d.values[`loading.solids.${k}`]!;
      expect(slr.inputs).toEqual([`solids.influentLoad.${k}`, 'tank.area']);
      expect(slr.value).toBeCloseTo(d.values[`solids.influentLoad.${k}`]!.value / d.values['tank.area']!.value, 12);
    }
  });
  it('el tramo del pozo dentro del manto se descuenta una sola vez', () => {
    const geo = (h: number) => designClarifier({ ...DEC_005_DIDACTIC, geometry: { ...DEC_005_DIDACTIC.geometry, sludgeBlanketDepthM: h } });
    const below = geo(2.0); // manto justo en el fondo del pozo (y = 2,0)
    const above = geo(2.2);
    const m = below.model;
    // Subir el manto 0,2 m dentro del pozo solo debe quitar la corona exterior al pozo.
    const dV = below.values['volume.effective']!.value - above.values['volume.effective']!.value;
    expect(dV).toBeCloseTo(Math.PI * (m.R ** 2 - m.rFeedwellInner ** 2) * 0.2, 9);
    expect(above.checks.find((c) => c.id === 'HYD-SLUDGE-BLANKET')?.status).toBe('FAIL');
  });
  it('número de escotaduras fijado en 0 con vertedero útil: FAIL sin excepción', () => {
    const gross = designClarifier(DEC_005_DIDACTIC).values['weir.length.gross']!.value;
    const parent = createBaseVariant(hyd({ weirExclusionLengthM: gross + 1 }), { createdAt: T0 });
    expect(parent.calculatedOutputs.decisions.notchCount).toBe(0);
    const child = createVariant(parent, { tag: 'X', hydraulics: { weirExclusionLengthM: 0 } }, { mode: 'C', allowedResize: ['tank'] });
    const c = (id: string) => child.calculatedOutputs.checks.find((x) => x.id === id)?.status;
    expect(c('GEO-WEIR-LENGTH-POSITIVE')).toBe('PASS');
    expect(c('HYD-NOTCH-COUNT')).toBe('FAIL');
    expect(c('HYD-NOTCH-NOT-DROWNED')).toBe('NOT_EVALUATED');
    expect(c('GEO-BRIDGE-CLEARANCE')).toBe('NOT_EVALUATED');
    expect(child.calculatedOutputs.values['weir.head.peak']).toBeUndefined();
    expect(child.calculatedOutputs.values['level.water.avg']).toBeUndefined();
    expect(child.validationStatus).toBe('FAILED');
  });
  it('los límites mecánicos de solo comprobación no exigen el grupo mechanical', () => {
    const b = createBaseVariant(DEC_005_DIDACTIC, { createdAt: T0 });
    expect(() => createVariant(b, { tag: 'X', mechanical: { bridgeClearanceAboveWaterMinM: 0.6 } }, { mode: 'C', allowedResize: [] })).not.toThrow();
    expect(() => createVariant(b, { tag: 'X', mechanical: { bridgeGirderDepthM: 0.5 } }, { mode: 'C', allowedResize: [] })).toThrow(/mechanical/);
  });
});
