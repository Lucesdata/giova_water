import { describe, expect, it } from 'vitest';
import { diffAssemblies } from '@eo/geometry-engine';
import { isMaterialId } from '@eo/material-library';
import {
  COMPONENT_IDS,
  DEC_005_CONCEPTUAL,
  DEC_005_DIDACTIC,
  InputValidationError,
  PrimaryClarifier,
  VariantLibrary,
  compareVariants,
  createBaseVariant,
  createVariant,
  designClarifier,
  exportVariant,
  importVariant,
  regenerate,
  renderReport,
  reproduces,
  type DesignInputRaw,
} from '../src/index.js';
import { CalcTrace } from '@eo/engineering-core';

const T0 = '2026-01-01T00:00:00.000Z';
const base = () => createBaseVariant(DEC_005_DIDACTIC, { createdAt: T0 });
const family = () => {
  const b = base();
  return {
    dec005: b,
    dec010: createVariant(b, { tag: 'DEC-010', flow: { averageLps: 10 } }, { createdAt: T0 }),
    dec003: createVariant(b, { tag: 'DEC-003', flow: { averageLps: 3 } }, { createdAt: T0 }),
  };
};
const val = (v: ReturnType<typeof base>, k: string) => v.calculatedOutputs.values[k]!.value;
const check = (v: ReturnType<typeof base>, id: string) => v.calculatedOutputs.checks.find((c) => c.id === id);

describe('caso de prueba obligatorio (spec §6.2): CHS = 1,5 m/h', () => {
  const f = family();
  it.each([
    ['DEC-003', f.dec003, 7.2, 3.03],
    ['DEC-005', f.dec005, 12.0, 3.91],
    ['DEC-010', f.dec010, 24.0, 5.53],
  ])('%s: área mínima y diámetro teórico', (_tag, v, area, diameter) => {
    expect(val(v, 'area.required')).toBeCloseTo(area, 10);
    expect(Number(val(v, 'tank.diameter.theoretical').toFixed(2))).toBe(diameter);
    expect(val(v, 'tank.diameter')).toBe(val(v, 'tank.diameter.theoretical'));
    expect(val(v, 'loading.surface.avg')).toBeCloseTo(1.5, 12);
  });

  it('ninguna variante se declara validada: quedan verificaciones críticas pendientes', () => {
    for (const v of [f.dec003, f.dec005, f.dec010]) {
      expect(v.validationStatus).toBe('INCOMPLETE');
      expect(v.calculatedOutputs.summary.failures).toEqual([]);
      expect(v.calculatedOutputs.summary.pendingCritical).toEqual(
        expect.arrayContaining(['STR-THICKNESS', 'MEC-DRIVE-TORQUE', 'MEC-BRIDGE-STRUCTURE', 'MEC-FABRICATION']),
      );
    }
  });
});

describe('dimensionamiento calculado, no escalado', () => {
  const f = family();
  it('el diámetro crece con √Q (área), no con Q; la profundidad no escala', () => {
    expect(val(f.dec010, 'tank.diameter') / val(f.dec005, 'tank.diameter')).toBeCloseTo(Math.SQRT2, 10);
    expect(val(f.dec010, 'tank.depth')).toBe(val(f.dec005, 'tank.depth'));
  });
  it('los espesores son parámetros técnicos y no cambian con el diámetro', () => {
    for (const v of [f.dec003, f.dec010]) {
      expect(v.designInputs.civil.wallThicknessM).toBe(f.dec005.designInputs.civil.wallThicknessM);
      expect(val(v, 'civil.wallOuterRadius') - val(v, 'tank.diameter') / 2).toBeCloseTo(0.3, 12);
    }
  });
  it('los componentes dependientes se reevalúan con sus propias reglas', () => {
    expect(val(f.dec010, 'inlet.dn')).toBeGreaterThan(val(f.dec005, 'inlet.dn'));
    expect(val(f.dec003, 'inlet.dn')).toBeLessThan(val(f.dec005, 'inlet.dn'));
    // DN mínimo de lodos: se mantiene por normalización
    expect(val(f.dec003, 'sludge.dn')).toBe(150);
    expect(val(f.dec010, 'sludge.dn')).toBe(150);
    // pozo de alimentación: gobierna el mínimo constructivo en tanques pequeños
    expect(val(f.dec003, 'feedwell.diameter')).toBe(1.0);
    expect(val(f.dec010, 'weir.notchCount')).toBeGreaterThan(val(f.dec005, 'weir.notchCount'));
    expect(val(f.dec010, 'arm.length')).toBeGreaterThan(val(f.dec005, 'arm.length'));
    expect(val(f.dec010, 'bridge.span')).toBeGreaterThan(val(f.dec005, 'bridge.span'));
  });
  it('el volumen efectivo descuenta fondo, columna y pozo y no es el cilindro bruto', () => {
    const v = f.dec005;
    expect(val(v, 'volume.effective')).not.toBe(val(v, 'volume.cylinder'));
    expect(val(v, 'volume.gross')).toBeCloseTo(val(v, 'volume.cylinder') + val(v, 'volume.floorCone'), 10);
    expect(val(v, 'volume.effective')).toBeCloseTo(val(v, 'volume.gross') - val(v, 'volume.deduction.column') - val(v, 'volume.deduction.feedwell'), 10);
    expect(val(v, 'hrt.avg')).toBeCloseTo(val(v, 'volume.effective') / 18, 10);
  });
});

describe('inmutabilidad y reproducibilidad', () => {
  it('generar variantes no altera el original', () => {
    const b = base();
    const snapshot = JSON.stringify(b);
    createVariant(b, { tag: 'DEC-010', flow: { averageLps: 10 } });
    createVariant(b, { tag: 'DEC-003', flow: { averageLps: 3 } }, { mode: 'B' });
    expect(JSON.stringify(b)).toBe(snapshot);
    expect(Object.isFrozen(b.designInputs.flow)).toBe(true);
    expect(() => {
      (b.designInputs.flow as { averageLps: number }).averageLps = 99;
    }).toThrow(TypeError);
  });
  it('el objeto de 5 L/s se regenera de forma determinista', () => {
    const a = base();
    const b = base();
    expect(a.outputsHash).toBe(b.outputsHash);
    expect(a.variantId).toBe(b.variantId);
    expect(reproduces(a)).toBe(true);
    const ga = regenerate(a).assembly;
    const gb = regenerate(b).assembly;
    expect(ga).toEqual(gb);
  });
  it('las variantes registran su identidad y linaje', () => {
    const f = family();
    expect(f.dec010.parentVariantId).toBe(f.dec005.variantId);
    expect(f.dec010.objectId).toBe(f.dec005.objectId);
    expect(f.dec010.variantId).not.toBe(f.dec005.variantId);
    const lib = new VariantLibrary();
    lib.add(f.dec005);
    lib.add(f.dec010);
    lib.add(f.dec003);
    expect(lib.lineage(f.dec003.variantId).map((v) => v.tag)).toEqual(['DEC-005', 'DEC-003']);
    expect(() => new VariantLibrary().add(f.dec010)).toThrow(/padre/);
  });
  it('compara variantes', () => {
    const f = family();
    const rows = compareVariants([f.dec003, f.dec005, f.dec010]);
    const d = rows.find((r) => r.key === 'tank.diameter')!;
    expect(d.values.map((x) => Number(x!.toFixed(2)))).toEqual([3.03, 3.91, 5.53]);
  });
});

describe('modos de redimensionamiento (spec §6.1)', () => {
  it('modo B: geometría fija, se evalúa la nueva carga', () => {
    const b = base();
    const v = createVariant(b, { tag: 'DEC-005-EVAL10', flow: { averageLps: 10 } }, { mode: 'B' });
    expect(val(v, 'tank.diameter')).toBe(val(b, 'tank.diameter'));
    expect(val(v, 'inlet.dn')).toBe(val(b, 'inlet.dn'));
    expect(val(v, 'loading.surface.avg')).toBeCloseTo(3.0, 10);
    expect(check(v, 'HYD-CHS-AVG-ADMISSIBLE')?.status).toBe('FAIL');
    expect(check(v, 'MODE-B-CAPACITY')?.status).toBe('FAIL');
    expect(v.validationStatus).toBe('FAILED');
    expect(v.calculatedOutputs.values['tank.diameter']!.origin).toBe('FIXED_BY_CONSTRAINT');
  });
  it('modo B: menor carga sobre el mismo equipo', () => {
    const v = createVariant(base(), { tag: 'DEC-005-EVAL3', flow: { averageLps: 3 } }, { mode: 'B' });
    expect(check(v, 'MODE-B-CAPACITY')?.status).toBe('PASS');
  });
  it('modo B: rechaza cambios de geometría', () => {
    expect(() => createVariant(base(), { geometry: { sideWaterDepthM: 4 } }, { mode: 'B' })).toThrow(/geometría es fija/);
  });
  it('modo C: redimensiona solo lo permitido e informa de lo que las restricciones impiden', () => {
    const b = base();
    const v = createVariant(b, { tag: 'DEC-005-C10', flow: { averageLps: 10 } }, { mode: 'C', allowedResize: ['inlet', 'effluent'] });
    expect(val(v, 'tank.diameter')).toBe(val(b, 'tank.diameter'));
    expect(val(v, 'inlet.dn')).toBe(150);
    expect(val(v, 'effluent.dn')).toBe(150);
    expect(val(v, 'feedwell.diameter')).toBe(val(b, 'feedwell.diameter'));
    const c = check(v, 'MODE-C-CONSTRAINTS')!;
    expect(c.status).toBe('FAIL');
    expect(c.message).toContain('HYD-CHS-AVG-ADMISSIBLE');
    expect(c.message).toContain('tank');
  });
  it('modo C con todos los grupos permitidos equivale al modo A', () => {
    const b = base();
    const a = createVariant(b, { tag: 'X', flow: { averageLps: 10 } });
    const c = createVariant(b, { tag: 'X', flow: { averageLps: 10 } }, { mode: 'C', allowedResize: ['tank', 'inlet', 'feedwell', 'weir', 'effluent', 'sludge'] });
    expect(c.calculatedOutputs.decisions).toEqual(a.calculatedOutputs.decisions);
  });
});

describe('nivel 1 — datos', () => {
  it('rechaza caudales no positivos', () => {
    expect(() => designClarifier({ ...DEC_005_DIDACTIC, flow: { averageLps: -1, peak: { method: 'factor', factor: 2 } } })).toThrow(InputValidationError);
  });
  it('no admite factor de punta y caudal punta a la vez', () => {
    expect(() => designClarifier({ ...DEC_005_DIDACTIC, flow: { averageLps: 5, peak: { method: 'factor', factor: 2, peakLps: 12 } as never } })).toThrow(InputValidationError);
  });
  it('caudal punta directo inferior al medio ⇒ FAIL', () => {
    const d = designClarifier({ ...DEC_005_DIDACTIC, flow: { averageLps: 5, peak: { method: 'direct', peakLps: 4 } } });
    expect(d.checks.find((c) => c.id === 'DATA-PEAK-GE-AVG')?.status).toBe('FAIL');
  });
  it('un criterio añadido exige fuente y nota', () => {
    expect(() => designClarifier({ ...DEC_005_DIDACTIC, criteriaOverrides: { hrtAvg: { min: 2, sourceId: 'USER', note: '' } } })).toThrow(InputValidationError);
    const d = designClarifier({ ...DEC_005_DIDACTIC, criteriaOverrides: { hrtAvg: { min: 2.5, sourceId: 'USER', note: 'Pliego del proyecto X, art. 4' } } });
    expect(d.checks.find((c) => c.id === 'HYD-HRT-CRITERION')?.status).toBe('FAIL');
  });
  it('rechaza criterios desconocidos', () => {
    expect(() => designClarifier({ ...DEC_005_DIDACTIC, criteriaOverrides: { foo: { min: 1, sourceId: 'USER', note: 'x' } } })).toThrow(/desconocido/);
  });
});

describe('no se ocultan errores ajustando valores', () => {
  it('un diámetro impuesto insuficiente se conserva y se marca FAIL', () => {
    const raw: DesignInputRaw = { ...DEC_005_DIDACTIC, geometry: { ...DEC_005_DIDACTIC.geometry, adoptedDiameterM: 3.0 } };
    const d = designClarifier(raw);
    expect(d.values['tank.diameter']!.value).toBe(3.0);
    expect(d.checks.find((c) => c.id === 'HYD-DIAMETER-GE-REQUIRED')?.status).toBe('FAIL');
    expect(d.summary.status).toBe('FAILED');
  });
  it('el TRH insuficiente no profundiza el tanque', () => {
    const d = designClarifier({ ...DEC_005_CONCEPTUAL, designCriteria: { ...DEC_005_CONCEPTUAL.designCriteria, hrtTargetMinH: 3 } });
    expect(d.values['tank.depth']!.value).toBe(3);
    expect(d.checks.find((c) => c.id === 'HYD-HRT-TARGET')?.status).toBe('FAIL');
  });
  it('una geometría imposible no rompe el motor: se informa FAIL', () => {
    const d = designClarifier({ ...DEC_005_DIDACTIC, geometry: { ...DEC_005_DIDACTIC.geometry, sumpDiameterM: 5 } });
    expect(d.summary.status).toBe('FAILED');
    expect(d.summary.failures).toEqual(expect.arrayContaining(['GEO-SUMP-INSIDE-SLOPE']));
  });
});

describe('perfil conceptual', () => {
  const d = designClarifier(DEC_005_CONCEPTUAL);
  it('redondea a incremento constructivo y gobierna el mayor de los casos', () => {
    expect(d.values['tank.diameter']!.value).toBeCloseTo(4.0, 12);
    expect(d.values['area.required.peak']!.value).toBeCloseTo(45 / 4, 12);
    expect(d.values['area.required']!.value).toBeCloseTo(12, 12);
    expect(d.values['tank.diameter']!.origin).toBe('ADOPTED');
  });
  it('evalúa criterios bibliográficos con su fuente', () => {
    const c = d.checks.find((x) => x.id === 'HYD-HRT-CRITERION')!;
    expect(c.sourceId).toBe('METCALF-EDDY-2014');
    expect(c.status).not.toBe('NOT_EVALUATED');
    expect(d.sources.map((s) => s.id)).toContain('METCALF-EDDY-2014');
  });
  it('mide excavación cuando hay cota de terreno', () => {
    expect(d.measurements.excavationM3).toBeGreaterThan(0);
  });
});

describe('geometría y ensamblaje', () => {
  const d = regenerate(base());
  it('genera los 17 componentes del catálogo', () => {
    expect(d.components.map((c) => c.id).sort()).toEqual([...COMPONENT_IDS].sort());
  });
  it('la geometría coincide con el cálculo y las conexiones cierran', () => {
    for (const id of ['GEO-VOLUME-CONSISTENCY', 'GEO-DIAMETER-CONSISTENCY', 'GEO-CONNECTIONS', 'GEO-FLOOR-CONTINUITY', 'GEO-AXIS-ALIGNMENT', 'GEO-BLADE-FLOOR', 'GEO-BLADE-WALL', 'GEO-CAGE-COLUMN', 'GEO-CAGE-FEEDWELL', 'GEO-DEFLECTOR-CAGE', 'GEO-FEEDWELL-ARMS']) {
      expect(d.checks.find((c) => c.id === id)?.status, id).toBe('PASS');
    }
  });
  it('los materiales de los componentes existen en el catálogo técnico', () => {
    for (const c of d.components) for (const m of c.materialIds) expect(isMaterialId(m), `${c.id}: ${m}`).toBe(true);
  });
  it('los componentes giratorios declaran 1 GDL alrededor de Y', () => {
    for (const id of ['MEC-003', 'MEC-004', 'MEC-005']) {
      const c = d.components.find((x) => x.id === id)!;
      expect(c.motion).toMatchObject({ type: 'rotation', dof: 1, axis: [0, 1, 0] });
    }
  });
  it('las piezas de sección representativa no tienen masa inventada', () => {
    expect(d.components.find((c) => c.id === 'MEC-001')!.massKg).toBeNull();
    expect(d.components.find((c) => c.id === 'HYD-004')!.massKg).toBeGreaterThan(0);
    expect(d.measurements.rebar).toBe('NOT_EVALUATED');
  });
  it('puente radial: apoyo interior sobre la columna', () => {
    const r = designClarifier({ ...DEC_005_DIDACTIC, mechanical: { ...DEC_005_DIDACTIC.mechanical, bridgeType: 'radial' } });
    expect(r.checks.find((c) => c.id === 'GEO-CONNECTIONS')?.status).toBe('PASS');
    expect(r.values['bridge.span']!.value).toBeCloseTo(d.values['bridge.span']!.value / 2, 10);
  });
});

describe('regeneración selectiva (spec §10.2)', () => {
  it('cambiar el DN mínimo de lodos solo afecta a la poceta y a la conducción de lodos', () => {
    const a = regenerate(base());
    const b = designClarifier({ ...DEC_005_DIDACTIC, hydraulics: { ...DEC_005_DIDACTIC.hydraulics, sludgePipeMinDn: 200 } });
    const diff = diffAssemblies(a.assembly, b.assembly);
    expect(diff.changed.sort()).toEqual(['CIV-004', 'HYD-006']);
    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
  });
  it('cambiar el material del puente solo afecta al puente y a los cuelgues', () => {
    const a = regenerate(base());
    const b = designClarifier({ ...DEC_005_DIDACTIC, mechanical: { ...DEC_005_DIDACTIC.mechanical, materials: { ...DEC_005_DIDACTIC.mechanical.materials, bridge: 'SS-1.4404' } } });
    expect(diffAssemblies(a.assembly, b.assembly).changed.sort()).toEqual(['HYD-002', 'MEC-001']);
  });
});

describe('trazabilidad', () => {
  const d = regenerate(base());
  it('cada valor tiene unidad, ecuación, versión y origen', () => {
    for (const v of Object.values(d.values)) {
      expect(v.equation.length, v.key).toBeGreaterThan(0);
      expect(v.methodVersion).toBe(d.engineeringModelVersion);
      expect(['CALCULATED', 'ADOPTED', 'FIXED_BY_CONSTRAINT', 'INPUT']).toContain(v.origin);
    }
  });
  it('el diámetro depende de la carga superficial y del caudal', () => {
    const t = new CalcTrace('x');
    for (const v of Object.values(d.values)) t.record(v.key, v.value, { ...v, inputs: v.inputs });
    const deps = t.dependenciesOf('tank.diameter');
    expect(deps).toEqual(expect.arrayContaining(['input.designCriteria.surfaceLoadingAvgM_h', 'input.flow.averageLps']));
  });
});

describe('exportación e importación', () => {
  it('ida y vuelta verificada', () => {
    const f = family();
    const json = exportVariant(f.dec010);
    const r = importVariant(json);
    expect(r.verified).toBe(true);
    expect(r.variant.outputsHash).toBe(f.dec010.outputsHash);
    expect(r.variant.variantId).toBe(f.dec010.variantId);
    expect(r.variant.parentVariantId).toBe(f.dec005.variantId);
  });
  it('detecta archivos manipulados', () => {
    const env = JSON.parse(exportVariant(base()));
    env.variant.designInputs.flow.averageLps = 6;
    expect(() => importVariant(JSON.stringify(env))).toThrow(/Integridad/);
  });
  it('rechaza formatos desconocidos', () => {
    expect(() => importVariant(JSON.stringify({ format: 'x', formatVersion: 1, variant: {} }))).toThrow();
  });
});

describe('contrato EngineeringObject', () => {
  it('createVariant devuelve un objeto nuevo y conserva el original', () => {
    const o = PrimaryClarifier.create(DEC_005_DIDACTIC, { createdAt: T0 });
    const o10 = o.createVariant({ tag: 'DEC-010', flow: { averageLps: 10 } });
    expect(o.parameters.flow.averageLps).toBe(5);
    expect(o10.parameters.flow.averageLps).toBe(10);
    expect(o.validate().status).toBe('INCOMPLETE');
    expect(o10.calculate().values['tank.diameter']!.value).toBeCloseTo(5.5279, 4);
    expect(o.components).toHaveLength(17);
  });
});

describe('reporte', () => {
  it('incluye cálculos, mediciones, validación, pendientes y fuentes', () => {
    const v = base();
    const md = renderReport(regenerate(v), v);
    for (const s of ['## 4. Cálculos', '## 5. Inventario', '## 6. Mediciones', '## 7. Validación', 'Verificaciones críticas pendientes', '## 8. Fuentes', 'SPEC-DEC-002-DIDACTIC', v.variantId]) {
      expect(md).toContain(s);
    }
  });
});
