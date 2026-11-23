import { evaluateRange, type CheckList } from '@eo/engineering-core';
import {
  beam,
  box,
  component,
  cylinder,
  node,
  polar,
  ring,
  type Assembly,
  type ComponentGeometry,
  type GeometryNode,
  type RevolveShape,
} from '@eo/geometry-engine';
import type { ResolvedModel } from '../primary-clarifier/definition/engine.js';
import { MECH_RULES, driveSupportRadius } from '../primary-clarifier/mechanical/geometry.js';
import type { PaddleLayout } from './strategy.js';
import type { ClfInput } from './schema.js';

/** Desfase angular de los brazos del agitador respecto a los del rascador (solo representación). */
const PADDLE_PHASE = Math.PI / 8;
/** Radio de la envolvente del motor del floculador (representación). */
const FLOC_MOTOR_RADIUS = 0.12;
/** El motor se sitúa a lo largo del eje del puente (+Z), dentro del tablero en ambos tipos de puente. */
const FLOC_MOTOR_THETA = -Math.PI / 2;

/** Radios del reductor anular del floculador (alrededor del accionamiento del rascador). */
export function flocDriveRadii(m: ResolvedModel, clf: ClfInput): { inner: number; outer: number } {
  const inner = m.driveFootprint / 2 + 0.05;
  return { inner, outer: inner + clf.flocculation.drive.footprintM / 2 };
}

export function paddleAngles(l: PaddleLayout): number[] {
  return Array.from({ length: l.armCount }, (_, k) => PADDLE_PHASE + (k * 2 * Math.PI) / l.armCount);
}

/**
 * MEC-007 — agitador de paletas verticales concéntrico: tubo de giro exterior a la jaula del
 * rascador, brazos radiales y paletas planas en el plano radial. MEC-008 — su accionamiento,
 * anular alrededor del accionamiento del rascador (representación paramétrica).
 */
export function buildFlocculator(m: ResolvedModel, l: PaddleLayout, clf: ClfInput): ComponentGeometry[] {
  const mat = clf.flocculation.materials.paddles;
  const rep = { section: 'representational' as const, moving: true };
  const yBottom = l.yCenter - l.bladeHeight / 2;
  const yTop = l.yCenter + l.bladeHeight / 2;
  const children: GeometryNode[] = [
    node('MEC-007.sleeve', 'Tubo de giro del agitador', mat, ring(l.rSleeveInner, l.rSleeveOuter, yBottom, m.yDeck, 48), { moving: true }),
  ];
  // Sin anillos de paletas no hay brazos: se omiten (evita vigas de longitud nula).
  const rOuterEdge = l.ringRadii.length > 0 ? l.ringRadii[0]! + l.bladeWidth / 2 : null;
  paddleAngles(l).forEach((th, k) => {
    if (rOuterEdge !== null && rOuterEdge > l.rSleeveOuter)
      for (const [lvl, y] of [
      ['top', yTop + 0.04],
      ['bottom', yBottom - 0.04],
    ] as const) {
      children.push(node(`MEC-007.arm-${k}.${lvl}`, 'Brazo del agitador', mat, beam(polar(l.rSleeveOuter, th, y), polar(rOuterEdge, th, y), 0.06, 0.06), rep));
    }
    l.ringRadii.forEach((r, j) => {
      children.push(
        node(`MEC-007.arm-${k}.blade-${j}`, 'Paleta de floculación', mat, box(l.bladeWidth, l.bladeHeight, l.bladeThickness), {
          transform: { position: polar(r, th, l.yCenter), rotationY: th },
          moving: true,
        }),
      );
    });
  });
  const paddles = component('MEC-007', node('MEC-007', 'Agitador de paletas de floculación', 'NONE', undefined, { children }), [
    { id: 'MEC-007.top', componentId: 'MEC-007', position: [0, m.yDeck, 0], matesWith: 'MEC-008.output', description: 'Unión del tubo de giro al accionamiento del floculador' },
  ]);

  const { inner: rDriveIn, outer: rDriveOut } = flocDriveRadii(m, clf);
  const drive = component(
    'MEC-008',
    node('MEC-008', 'Accionamiento del floculador', 'NONE', undefined, {
      children: [
        node('MEC-008.gearbox', 'Reductor anular (envolvente)', clf.mechanical.materials.mechanism, ring(rDriveIn, rDriveOut, m.yDeck, m.yDeck + clf.flocculation.drive.heightM, 48), { section: 'representational' }),
        node('MEC-008.motor', 'Motor (envolvente)', clf.mechanical.materials.mechanism, cylinder(FLOC_MOTOR_RADIUS, 0.35, 24), {
          transform: { position: polar(rDriveOut + FLOC_MOTOR_RADIUS, FLOC_MOTOR_THETA, m.yDeck + clf.flocculation.drive.heightM / 2), rotationY: 0 },
          section: 'representational',
        }),
      ],
    }),
    [
      { id: 'MEC-008.base', componentId: 'MEC-008', position: polar(rDriveIn, 0, m.yDeck), description: 'Apoyo sobre el tablero del puente MEC-001' },
      { id: 'MEC-008.output', componentId: 'MEC-008', position: [0, m.yDeck, 0], description: 'Salida al tubo de giro del agitador' },
    ],
  );
  return [paddles, drive];
}

/** Nivel 3 — holguras del agitador medidas sobre la geometría generada. */
export function flocculatorGeometryChecks(m: ResolvedModel, l: PaddleLayout, clf: ClfInput, assembly: Assembly, checks: CheckList): void {
  const pd = clf.flocculation.paddles;
  const floc = assembly.components.find((c) => c.componentId === 'MEC-007');
  const sleeve = floc?.root.children.find((c) => c.id === 'MEC-007.sleeve')?.shape as RevolveShape | undefined;
  const cageCorner = Math.SQRT2 * m.cageHalfWidth + m.cageMember / 2;
  const sleeveIn = sleeve?.profile[0]?.[0] ?? NaN;
  {
    const ev = evaluateRange(sleeveIn - cageCorner, { min: pd.sleeveClearanceM * (1 - 1e-9) });
    checks.add({ id: 'GEO-SLEEVE-CAGE', level: 3, status: ev.status, title: 'Holgura tubo del agitador – jaula del rascador', message: ev.status === 'PASS' ? 'El tubo de giro no toca la jaula giratoria.' : 'El tubo del agitador interfiere con la jaula del rascador.', value: sleeveIn - cageCorner, limit: ev.limit, unit: 'm', componentIds: ['MEC-007', 'MEC-003'] });
  }
  // El tubo de giro sube hasta el tablero: debe pasar entre las vigas principales del puente.
  {
    const girderInner = m.bridgeWidth / 2 - MECH_RULES.girderWidth / 2;
    const sleeveOut = l.rSleeveOuter;
    const ev = evaluateRange(girderInner - sleeveOut, { min: pd.sleeveClearanceM - 1e-6 });
    checks.add({ id: 'GEO-SLEEVE-BRIDGE', level: 3, status: ev.status, title: 'Holgura tubo del agitador – vigas del puente', message: ev.status === 'PASS' ? 'El tubo de giro pasa entre las vigas principales del puente.' : 'El tubo de giro interfiere con las vigas principales del puente: ensanchar el puente o reducir la jaula.', value: girderInner - sleeveOut, limit: ev.limit, unit: 'm', componentIds: ['MEC-007', 'MEC-001'] });
  }
  // El reductor anular del floculador debe apoyar entero sobre el tablero (o la plataforma de la columna
  // en puente radial, donde el tablero no cubre z < 0). Ver driveSupportRadius.
  {
    const { outer } = flocDriveRadii(m, clf);
    const margin = driveSupportRadius(m) - outer;
    const where = m.bridgeType === 'radial' ? 'el tablero y la plataforma de la columna central' : 'el tablero del puente';
    const ev = evaluateRange(margin, { min: -1e-9 });
    checks.add({ id: 'GEO-FLOC-DRIVE-DECK', level: 3, status: ev.status, title: 'Accionamiento del floculador apoyado sobre el puente', message: ev.status === 'PASS' ? `El reductor anular apoya sobre ${where}.` : `El reductor anular del floculador sobresale de ${where}: ensanchar el puente o reducir su envolvente.`, value: margin, limit: ev.limit, unit: 'm', componentIds: ['MEC-008', 'MEC-001'] });
  }
  // Punto más exterior de las paletas: esquina de la chapa (canto exterior y medio espesor tangencial).
  let maxR = 0;
  let minInner = Infinity;
  for (const r of l.ringRadii) {
    maxR = Math.max(maxR, Math.hypot(r + l.bladeWidth / 2, l.bladeThickness / 2));
    minInner = Math.min(minInner, r - l.bladeWidth / 2);
  }
  if (l.ringRadii.length > 0) {
    const ev = evaluateRange(m.rFeedwellInner - maxR, { min: pd.wallClearanceM - 1e-6 });
    checks.add({ id: 'GEO-PADDLES-WALL', level: 3, status: ev.status, title: 'Holgura paletas – pared de la cámara', message: 'Distancia del punto más exterior de las paletas a la cara interior de la cámara.', value: m.rFeedwellInner - maxR, limit: ev.limit, unit: 'm', componentIds: ['MEC-007', 'HYD-002'] });
    const ev2 = evaluateRange(minInner - l.rSleeveOuter, { min: pd.sleeveClearanceM - 1e-6 });
    checks.add({ id: 'GEO-PADDLES-SLEEVE', level: 3, status: ev2.status, title: 'Holgura paletas – tubo de giro', message: 'Separación entre el canto interior de las paletas y el tubo de giro.', value: minInner - l.rSleeveOuter, limit: ev2.limit, unit: 'm', componentIds: ['MEC-007'] });
  } else {
    checks.add({ id: 'GEO-PADDLES-WALL', level: 3, status: 'NOT_EVALUATED', title: 'Holgura paletas – pared de la cámara', message: 'No hay paletas.', componentIds: ['MEC-007'] });
    checks.add({ id: 'GEO-PADDLES-SLEEVE', level: 3, status: 'NOT_EVALUATED', title: 'Holgura paletas – tubo de giro', message: 'No hay paletas.', componentIds: ['MEC-007'] });
  }
  // Paletas sumergidas y dentro de la cámara en vertical.
  const yTop = l.yCenter + l.bladeHeight / 2 + 0.04 + 0.03;
  const yBot = l.yCenter - l.bladeHeight / 2 - 0.04 - 0.03;
  const inside = yBot > m.yFeedwellBottom && yTop < m.H;
  checks.add({
    id: 'GEO-PADDLES-VERTICAL',
    level: 3,
    status: inside ? 'PASS' : 'FAIL',
    title: 'Agitador sumergido y dentro de la cámara',
    message: inside ? 'Paletas y brazos quedan entre el fondo de la cámara y la cresta del vertedero.' : 'El agitador sobresale de la cámara o de la lámina.',
    value: Math.min(yBot - m.yFeedwellBottom, m.H - yTop),
    limit: '> 0',
    unit: 'm',
    componentIds: ['MEC-007', 'HYD-002'],
  });
}

/** Nivel 4 — lo que falta para fabricar el agitador. */
export function flocculatorConstructiveChecks(checks: CheckList, powerW: number | undefined): void {
  checks.add({
    id: 'MEC-FLOC-DRIVE',
    level: 4,
    status: 'NOT_EVALUATED',
    critical: true,
    title: 'Par, potencia y regulación del accionamiento del floculador',
    message: `Representación paramétrica. ${powerW !== undefined ? `Potencia útil al agua ${powerW.toFixed(0)} W; ` : ''}faltan rendimientos, par de arranque, reductor, variador de velocidad y selección comercial.`,
    componentIds: ['MEC-008'],
  });
  checks.add({
    id: 'MEC-FLOC-STRUCTURE',
    level: 4,
    status: 'NOT_EVALUATED',
    critical: true,
    title: 'Resistencia de paletas, brazos y tubo de giro',
    message: 'Secciones representativas; sin cálculo de esfuerzos hidrodinámicos ni fatiga.',
    componentIds: ['MEC-007'],
  });
}
