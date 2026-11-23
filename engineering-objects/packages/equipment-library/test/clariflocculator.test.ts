import { describe, expect, it } from 'vitest';
import { convert, waterDensity, waterDynamicViscosity } from '@eo/engineering-core';
import { isMaterialId } from '@eo/material-library';
import {
  CLF_010_WATER,
  CLF_COMPONENT_IDS,
  Clariflocculator,
  FLOC_RULES,
  compareClfVariants,
  createClfBaseVariant,
  createClfVariant,
  designClariflocculator,
  exportClfVariant,
  importClfVariant,
  regenerateClf,
  renderReport,
  reproducesClf,
  type ClfInputRaw,
} from '../src/index.js';

const T0 = '2026-01-01T00:00:00.000Z';
const d = designClariflocculator(CLF_010_WATER);
const v = (k: string) => d.values[k]!.value;
const check = (id: string, design = d) => design.checks.find((c) => c.id === id);
const withFloc = (f: Record<string, unknown>): ClfInputRaw => ({ ...CLF_010_WATER, flocculation: { ...CLF_010_WATER.flocculation, ...f } });

describe('propiedades del agua', () => {
  it('interpola viscosidad y densidad y rechaza temperaturas fuera de tabla', () => {
    expect(waterDynamicViscosity(10)).toBeCloseTo(1.307e-3, 9);
    expect(waterDynamicViscosity(12.5)).toBeCloseTo((1.307e-3 + 1.138e-3) / 2, 9);
    expect(waterDensity(20)).toBeCloseTo(998.21, 6);
    expect(() => waterDynamicViscosity(45)).toThrow(RangeError);
    expect(convert(60, 'rpm', 'rad/s')).toBeCloseTo(2 * Math.PI, 12);
  });
});

describe('dimensionamiento del clarifloculador CLF-010 (cálculo a mano)', () => {
  const rc = v('column.outerRadius');
  it('cámara de floculación: V = Qmax · tf y D por la superficie neta', () => {
    expect(v('floc.volume.required')).toBeCloseTo(0.015 * 30 * 60, 9); // 27 m³
    const dIn = Math.sqrt((4 * (27 / 2.5 + Math.PI * rc ** 2)) / Math.PI);
    expect(v('floc.chamber.innerDiameter.required')).toBeCloseTo(dIn, 9);
    expect(v('feedwell.diameter')).toBeCloseTo(dIn + 2 * 0.008, 9);
    expect(v('floc.time.design')).toBeCloseTo(30, 6);
  });
  it('tanque: D por la corona de sedimentación más la cámara, redondeado a 0,1 m', () => {
    const df = v('feedwell.diameter');
    const dTh = Math.sqrt((4 * (36 / 1.5 + (Math.PI * df ** 2) / 4)) / Math.PI);
    expect(v('tank.diameter.theoretical')).toBeCloseTo(dTh, 9);
    expect(v('tank.diameter')).toBeCloseTo(Math.ceil(dTh * 10) / 10, 9);
    const annulus = (Math.PI * (v('tank.diameter') ** 2 - df ** 2)) / 4;
    expect(v('settling.area')).toBeCloseTo(annulus, 9);
    expect(v('loading.surface.avg')).toBeCloseTo(36 / annulus, 9);
    // La carga de sólidos también se refiere a la corona
    expect(d.values['loading.solids.avg']!.inputs).toContain('settling.area');
  });
  it('potencia de floculación P = G²·μ·V y paletas P = Σ ½·CD·ρ·A·(k·ω·r)³', () => {
    const mu = waterDynamicViscosity(10);
    expect(v('floc.power.required')).toBeCloseTo(40 ** 2 * mu * v('floc.volume'), 9);
    const omega = v('floc.paddle.angularSpeed');
    const rIn = v('feedwell.diameter') / 2 - 0.008;
    expect(omega).toBeCloseTo(0.6 / (rIn - 0.15), 9);
    expect(v('floc.paddle.rings')).toBe(1);
    const rOuter = Math.sqrt((rIn - 0.15) ** 2 - 0.004 ** 2);
    const r0 = rOuter - 0.075;
    const pHand = 4 * 0.5 * 1.8 * waterDensity(10) * (0.15 * 1.75) * (0.75 * omega * r0) ** 3;
    expect(v('floc.power.delivered')).toBeCloseTo(pHand, 9);
    expect(v('floc.power.delivered')).toBeGreaterThanOrEqual(v('floc.power.required'));
    expect(v('floc.G')).toBeCloseTo(Math.sqrt(pHand / (mu * v('floc.volume'))), 9);
    expect(v('floc.Gt')).toBeCloseTo(v('floc.G') * 30 * 60, 6);
    expect(v('floc.paddle.rpm')).toBeCloseTo((omega * 60) / (2 * Math.PI), 9);
  });
  it('criterios de referencia evaluados con su fuente', () => {
    expect(check('HYD-FLOC-TIME-CRITERION')).toMatchObject({ status: 'PASS', sourceId: 'TEN-STATES-WATER-2018' });
    expect(check('HYD-FLOC-TIP-SPEED')).toMatchObject({ status: 'PASS', sourceId: 'TEN-STATES-WATER-2018' });
    expect(check('HYD-FLOC-G-CRITERION')).toMatchObject({ status: 'PASS', sourceId: 'MWH-2012' });
    expect(check('HYD-FLOC-GT-CRITERION')?.status).toBe('PASS');
    expect(check('HYD-CHS-AVG-CRITERION')).toMatchObject({ status: 'PASS', sourceId: 'ONTARIO-DWS-2008' });
    expect(check('HYD-FLOC-PADDLE-AREA')?.status).toBe('NOT_EVALUATED');
    expect(d.sources.map((s) => s.id)).toEqual(expect.arrayContaining(['TEN-STATES-WATER-2018', 'MWH-2012', 'ONTARIO-DWS-2008', 'CRC-HANDBOOK']));
  });
  it('no se declara validado: estructura, mecánica y accionamiento del floculador pendientes', () => {
    expect(d.summary.status).toBe('INCOMPLETE');
    expect(d.summary.failures).toEqual([]);
    expect(d.summary.pendingCritical).toEqual(expect.arrayContaining(['MEC-FLOC-DRIVE', 'MEC-FLOC-STRUCTURE', 'STR-THICKNESS']));
    expect(check('MEC-FLOC-DRIVE')?.message).toMatch(/\d+ W/);
  });
});

describe('geometría del clarifloculador', () => {
  it('genera los 19 componentes y las conexiones cierran', () => {
    expect(d.components.map((c) => c.id).sort()).toEqual([...CLF_COMPONENT_IDS].sort());
    for (const id of ['GEO-CONNECTIONS', 'GEO-VOLUME-CONSISTENCY', 'GEO-SLEEVE-CAGE', 'GEO-PADDLES-WALL', 'GEO-PADDLES-SLEEVE', 'GEO-PADDLES-VERTICAL', 'GEO-PADDLES-FIT', 'GEO-CAGE-FEEDWELL', 'GEO-FEEDWELL-ARMS', 'GEO-SETTLING-ANNULUS']) {
      expect(check(id)?.status, id).toBe('PASS');
    }
  });
  it('la cámara usa su material y los componentes, materiales del catálogo', () => {
    const shell = d.assembly.components.find((c) => c.componentId === 'HYD-002')!.root.children.find((n) => n.id === 'HYD-002.shell')!;
    expect(shell.materialId).toBe('SS-1.4301');
    for (const c of d.components) for (const m of c.materialIds) expect(isMaterialId(m), `${c.id}: ${m}`).toBe(true);
    expect(d.components.find((c) => c.id === 'MEC-007')!.motion).toMatchObject({ type: 'rotation', dof: 1 });
  });
  it('usa la terminología del equipo: no aparece "pozo de alimentación"', () => {
    const texts = [
      ...d.checks.flatMap((c) => [c.title, c.message]),
      ...Object.values(d.values).map((x) => x.label),
      ...d.components.map((c) => c.name),
    ];
    const labels: string[] = [];
    const walk = (n: { label: string; children: readonly unknown[] }) => {
      labels.push(n.label);
      for (const c of n.children) walk(c as typeof n);
    };
    for (const c of d.assembly.components) walk(c.root);
    for (const s of [...texts, ...labels]) {
      expect(s).not.toMatch(/pozo de alimentación/i);
      expect(s, s).not.toMatch(/\b(del|el|al|El) cámara\b/);
    }
  });
});

describe('fallos explícitos', () => {
  it('paletas insuficientes para el G pedido: FAIL sin ajuste silencioso', () => {
    const x = designClariflocculator(withFloc({ velocityGradientS: 150, paddles: { ...CLF_010_WATER.flocculation.paddles, maxRings: 1 } }));
    expect(x.values['floc.paddle.rings']!.value).toBe(1);
    expect(check('HYD-FLOC-POWER', x)?.status).toBe('FAIL');
    expect(x.summary.status).toBe('FAILED');
  });
  it('velocidad periférica fuera del rango de referencia: FAIL', () => {
    const x = designClariflocculator(withFloc({ paddles: { ...CLF_010_WATER.flocculation.paddles, tipSpeedM_s: 1.2 } }));
    expect(check('HYD-FLOC-TIP-SPEED', x)?.status).toBe('FAIL');
  });
  it('un criterio propio no puede relajar el mínimo de floculación del perfil', () => {
    expect(() => designClariflocculator({ ...CLF_010_WATER, criteriaOverrides: { flocculationTime: { min: 20, sourceId: 'USER', note: 'x' } } })).toThrow(/relaja/);
  });
});

describe('variantes del clarifloculador', () => {
  const base = createClfBaseVariant(CLF_010_WATER, { createdAt: T0 });
  it('regeneración determinista', () => {
    expect(createClfBaseVariant(CLF_010_WATER, { createdAt: T0 }).outputsHash).toBe(base.outputsHash);
    expect(reproducesClf(base)).toBe(true);
    expect(regenerateClf(base).assembly).toEqual(regenerateClf(base).assembly);
  });
  it('modo A a 20 L/s: crecen cámara y tanque; el original no cambia', () => {
    const snap = JSON.stringify(base);
    const v20 = createClfVariant(base, { tag: 'CLF-020', flow: { averageLps: 20 } });
    const val = (x: typeof base, k: string) => x.calculatedOutputs.values[k]!.value;
    expect(val(v20, 'feedwell.diameter')).toBeGreaterThan(val(base, 'feedwell.diameter'));
    expect(val(v20, 'tank.diameter')).toBeGreaterThan(val(base, 'tank.diameter'));
    expect(val(v20, 'floc.time.design')).toBeCloseTo(30, 6);
    expect(JSON.stringify(base)).toBe(snap);
    // La columna crece con el caudal y sus deflectores ya no caben en la jaula de 0,22 m: se informa.
    expect(v20.calculatedOutputs.checks.find((c) => c.id === 'GEO-DEFLECTOR-CAGE')?.status).toBe('FAIL');
    const v20ok = createClfVariant(base, { tag: 'CLF-020', flow: { averageLps: 20 }, mechanical: { cageHalfWidthM: 0.3 } });
    expect(v20ok.calculatedOutputs.summary.failures).toEqual([]);
  });
  it('modo B a 15 L/s: cámara y paletas fijas; el tiempo de floculación cae y se informa', () => {
    const e = createClfVariant(base, { tag: 'CLF-010-EVAL15', flow: { averageLps: 15 } }, { mode: 'B' });
    const val = (x: typeof base, k: string) => x.calculatedOutputs.values[k]!.value;
    expect(e.calculatedOutputs.decisions.feedwellDiameterM).toBe(base.calculatedOutputs.decisions.feedwellDiameterM);
    expect(e.calculatedOutputs.decisions.paddleRings).toBe(base.calculatedOutputs.decisions.paddleRings);
    expect(val(e, 'floc.time.design')).toBeCloseTo(20, 6);
    expect(val(e, 'floc.G')).toBeCloseTo(val(base, 'floc.G'), 9); // G no depende del caudal
    const c = (id: string) => e.calculatedOutputs.checks.find((x) => x.id === id)?.status;
    expect(c('HYD-FLOC-TIME-TARGET')).toBe('FAIL');
    expect(c('HYD-FLOC-TIME-CRITERION')).toBe('FAIL');
    expect(c('MODE-B-CAPACITY')).toBe('FAIL');
  });
  it('modo B: la velocidad de las paletas es operación; la profundidad de la cámara, geometría', () => {
    const faster = createClfVariant(base, { tag: 'X', flocculation: { paddles: { ...CLF_010_WATER.flocculation.paddles, tipSpeedM_s: 0.8 } } }, { mode: 'B' });
    expect(faster.calculatedOutputs.values['floc.G']!.value).toBeGreaterThan(base.calculatedOutputs.values['floc.G']!.value);
    expect(() => createClfVariant(base, { tag: 'X', flocculation: { chamberDepthM: 2.8 } }, { mode: 'B' })).toThrow(/chamberDepthM/);
  });
  it('modo C: cambiar las paletas exige el grupo flocculator', () => {
    const paddles = { ...CLF_010_WATER.flocculation.paddles, armCount: 6 };
    expect(() => createClfVariant(base, { tag: 'X', flocculation: { paddles } }, { mode: 'C', allowedResize: [] })).toThrow(/flocculator/);
    const ok = createClfVariant(base, { tag: 'X', flocculation: { paddles } }, { mode: 'C', allowedResize: ['flocculator'] });
    expect(ok.calculatedOutputs.decisions.diameterM).toBe(base.calculatedOutputs.decisions.diameterM);
  });
  it('exportación e importación verificadas; bloqueos validados', () => {
    expect(importClfVariant(exportClfVariant(base)).verified).toBe(true);
    const e = createClfVariant(base, { tag: 'E', flow: { averageLps: 12 } }, { mode: 'B', createdAt: T0 });
    expect(importClfVariant(exportClfVariant(e)).verified).toBe(true);
    const env = JSON.parse(exportClfVariant(e));
    delete env.variant.lockedDecisions.paddleRings;
    expect(() => importClfVariant(JSON.stringify(env))).toThrow(/faltan: paddleRings/);
    // Un archivo de decantador no se importa como clarifloculador
    expect(() => importClfVariant(JSON.stringify({ ...env, format: 'engineering-objects/primary-clarifier-variant' }))).toThrow();
  });
  it('comparación, contrato EngineeringObject e informe', () => {
    const v20 = createClfVariant(base, { tag: 'CLF-020', flow: { averageLps: 20 } });
    const rows = compareClfVariants([base, v20]);
    expect(rows.find((r) => r.key === 'floc.volume.required')!.values).toEqual([27, 54].map((x) => expect.closeTo(x, 9)));
    const o = Clariflocculator.create(CLF_010_WATER, { createdAt: T0 });
    expect(o.validate().status).toBe('INCOMPLETE');
    expect(o.components).toHaveLength(19);
    const md = renderReport(regenerateClf(base), base, FLOC_RULES);
    for (const s of ['Cámara de floculación', 'floc.G', 'ringPitchToBladeWidth', 'MEC-FLOC-DRIVE', 'TEN-STATES-WATER-2018']) expect(md).toContain(s);
  });
});

describe('correcciones de revisión (CF-ENG-1.1.0)', () => {
  const nodesOf = (design: typeof d, componentId: string) => {
    const out: { id: string; shape?: unknown }[] = [];
    const walk = (n: { id: string; shape?: unknown; children?: readonly unknown[] }) => {
      out.push(n);
      for (const c of n.children ?? []) walk(c as typeof n);
    };
    const comp = design.assembly.components.find((c) => c.componentId === componentId)!;
    walk(comp.root as never);
    return out;
  };

  it('el tubo de giro pasa entre las vigas del puente; un puente estrecho da FAIL', () => {
    expect(check('GEO-SLEEVE-BRIDGE')?.status).toBe('PASS');
    const narrow = designClariflocculator({ ...CLF_010_WATER, mechanical: { ...CLF_010_WATER.mechanical, bridgeWidthM: 0.8 } });
    expect(check('GEO-SLEEVE-BRIDGE', narrow)?.status).toBe('FAIL');
  });

  it('el accionamiento del floculador apoya sobre el tablero; si sobresale, FAIL', () => {
    expect(check('GEO-FLOC-DRIVE-DECK')?.status).toBe('PASS');
    const wide = designClariflocculator(withFloc({ drive: { footprintM: 0.8, heightM: 0.5 } }));
    expect(check('GEO-FLOC-DRIVE-DECK', wide)?.status).toBe('FAIL');
    // El motor queda dentro del ancho del tablero (eje del puente)
    const motor = nodesOf(d, 'MEC-008').find((n) => n.id === 'MEC-008.motor') as { transform?: { position: number[] } } | undefined;
    expect(Math.abs(motor!.transform!.position[0]!)).toBeLessThan(CLF_010_WATER.mechanical.bridgeWidthM / 2);
  });

  it('puente radial: el accionamiento apoya en la plataforma de la columna; si la excede, FAIL', () => {
    const radialMech = { ...CLF_010_WATER.mechanical, bridgeType: 'radial' as const };
    const radial = designClariflocculator({ ...CLF_010_WATER, mechanical: radialMech });
    expect(nodesOf(radial, 'MEC-001').some((n) => n.id === 'MEC-001.drive-platform')).toBe(true);
    expect(nodesOf(d, 'MEC-001').some((n) => n.id === 'MEC-001.drive-platform')).toBe(false);
    expect(check('GEO-FLOC-DRIVE-DECK', radial)?.status).toBe('PASS');
    expect(check('GEO-FLOC-DRIVE-DECK', radial)?.message).toMatch(/plataforma de la columna/);
    const tooBig = designClariflocculator({ ...withFloc({ drive: { footprintM: 0.8, heightM: 0.5 } }), mechanical: radialMech });
    expect(check('GEO-FLOC-DRIVE-DECK', tooBig)?.status).toBe('FAIL');
    // El motor del floculador queda sobre el tablero (z > 0) también en puente radial
    const motor = nodesOf(radial, 'MEC-008').find((n) => n.id === 'MEC-008.motor') as { transform?: { position: number[] } } | undefined;
    expect(motor!.transform!.position[2]!).toBeGreaterThan(0);
  });

  it('accionamiento del rascador: GEO-DRIVE-DECK con ambos tipos de puente', () => {
    expect(check('GEO-DRIVE-DECK')?.status).toBe('PASS');
    const wideDrive = { ...CLF_010_WATER.mechanical, driveFootprintM: 2.0 };
    expect(check('GEO-DRIVE-DECK', designClariflocculator({ ...CLF_010_WATER, mechanical: wideDrive }))?.status).toBe('FAIL');
    expect(check('GEO-DRIVE-DECK', designClariflocculator({ ...CLF_010_WATER, mechanical: { ...wideDrive, bridgeType: 'radial' } }))?.status).toBe('FAIL');
  });

  it('criterios del pozo de alimentación del decantador se rechazan en el clarifloculador', () => {
    for (const k of ['feedwellDiameterRatio', 'feedwellDepth']) {
      expect(() => designClariflocculator({ ...CLF_010_WATER, criteriaOverrides: { [k]: { min: 0.1, sourceId: 'MWH-2012', note: 'x' } } })).toThrow(/no aplica al clarifloculador/);
    }
  });

  it('sin anillos de paletas no se generan brazos de longitud nula', () => {
    const short = designClariflocculator(withFloc({ detentionTimeMin: 2 }));
    expect(short.values['floc.paddle.rings']!.value).toBe(0);
    expect(check('GEO-PADDLES-FIT', short)?.message).toMatch(/No cabe ningún anillo/);
    expect(nodesOf(short, 'MEC-007').filter((n) => n.id.includes('.arm-'))).toHaveLength(0);
  });

  it('anillos fijados que no caben: la traza da los construidos y el FAIL lo explica', () => {
    const fixed = designClariflocculator(CLF_010_WATER, { fixed: { paddleRings: 9 } as never });
    const built = nodesOf(fixed, 'MEC-007').filter((n) => /\.blade-\d+$/.test(n.id)).length / CLF_010_WATER.flocculation.paddles.armCount;
    expect(fixed.values['floc.paddle.rings']!.value).toBe(built);
    expect(built).toBeLessThan(9);
    const fit = check('GEO-PADDLES-FIT', fixed)!;
    expect(fit.status).toBe('FAIL');
    expect(fit.message).toMatch(/fijaron 9/);
  });

  it('allowedResize rechaza grupos que el equipo no tiene', () => {
    const base = createClfBaseVariant(CLF_010_WATER, { createdAt: T0 });
    expect(() => createClfVariant(base, { tag: 'X' }, { mode: 'C', allowedResize: ['nope' as never] })).toThrow(/no existen/);
  });

  it('las comprobaciones de criterio comunes usan las etiquetas del clarifloculador', () => {
    const hrt = check('HYD-HRT-CRITERION')!;
    expect(hrt.title).toMatch(/zona de sedimentación/);
  });
});
