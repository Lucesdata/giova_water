import { beam, box, component, cylinder, node, polar, ring, rotateY, type ComponentGeometry, type ConnectionPoint, type GeometryNode, type Vec3 } from '@eo/geometry-engine';
import { floorElevation, type ResolvedModel } from '../definition/engine.js';
import type { DesignInput } from '../definition/schema.js';
import { feedwellHangerThetas } from '../hydraulics/geometry.js';

/** Reglas de modelado mecánico (representación, no dimensionamiento). */
export const MECH_RULES = {
  chordSection: 0.08,
  girderWidth: 0.12,
  deckThickness: 0.04,
  handrailHeight: 1.1,
  bladeRadialOverlap: 0.1,
  armPhase: Math.PI / 4,
  scumBoxTheta: (3 * Math.PI) / 4,
  scumBoxDepth: 0.5,
  skimmerBladeDepth: 0.25,
  skimmerArmAboveWater: 0.15,
} as const;

/**
 * Radio de apoyo del accionamiento central. En puente de vano completo, el tablero cubre |x| ≤ b/2
 * en toda la luz; en puente radial el tablero acaba en el eje (z ≥ 0) y el accionamiento apoya en una
 * plataforma circular de radio b/2 sobre la columna central (MEC-001.drive-platform). En ambos casos
 * una envolvente centrada de radio r apoya entera si r ≤ b/2 (regla de modelado).
 */
export function driveSupportRadius(m: Pick<ResolvedModel, 'bridgeWidth'>): number {
  return m.bridgeWidth / 2;
}

export function armAngles(m: ResolvedModel): number[] {
  return Array.from({ length: m.armCount }, (_, k) => MECH_RULES.armPhase + (k * 2 * Math.PI) / m.armCount);
}

/** Cota de la cara inferior del cordón inferior del brazo (= borde superior de las paletas). */
export function armBottomChordY(m: ResolvedModel, r: number): number {
  return floorElevation(m, r) + m.bladeClearance + m.bladeHeight;
}

export function armTopChordY(m: ResolvedModel, r: number): number {
  return armBottomChordY(m, r) + m.armTrussDepth;
}

/** Radios característicos del brazo (quiebros del fondo incluidos para que el cordón siga la pendiente). */
export function armStations(m: ResolvedModel): number[] {
  const st = [m.rArmRoot];
  if (m.rSump > m.rArmRoot && m.rSump < m.rArmTip) st.push(m.rSump);
  if (m.rSlopeStart > m.rArmRoot && m.rSlopeStart < m.rArmTip) st.push(m.rSlopeStart);
  st.push(m.rArmTip);
  return st;
}

export interface BladePlacement {
  /** Radio del extremo interior (sobre la directriz del brazo). */
  readonly a: number;
  /** Extremo interior y exterior en coordenadas del brazo (antes de girar θ). Cota = centro de la paleta. */
  readonly inner: Vec3;
  readonly outer: Vec3;
  readonly outerRadius: number;
}

/**
 * Paletas en espiral a ángulo α respecto a la directriz radial, colocadas desde la punta hacia el
 * centro con solape radial. Cada paleta sigue la pendiente: su borde inferior va de
 * fondo(r_int)+holgura a fondo(r_ext)+holgura.
 */
export function bladeLayout(m: ResolvedModel): BladePlacement[] {
  const Lc = m.bladeLength * Math.cos(m.bladeAngle);
  const Ls = m.bladeLength * Math.sin(m.bladeAngle);
  const out: BladePlacement[] = [];
  // El canto exterior de la chapa (no su eje) debe quedar en el radio de punta del brazo.
  const rOuterTarget = m.rArmTip - m.bladeThickness / 2;
  let a = Math.sqrt(Math.max(rOuterTarget ** 2 - Ls ** 2, 0)) - Lc;
  const step = Lc * (1 - MECH_RULES.bladeRadialOverlap);
  for (let guard = 0; guard < 500; guard++) {
    const last = a <= m.rArmRoot;
    const ai = Math.max(a, m.rArmRoot);
    const rho = Math.hypot(ai + Lc, Ls);
    const yIn = floorElevation(m, ai) + m.bladeClearance + m.bladeHeight / 2;
    const yOut = floorElevation(m, rho) + m.bladeClearance + m.bladeHeight / 2;
    // El extremo exterior se retrasa tangencialmente (eje −Z local, sentido de giro antihorario).
    out.push({ a: ai, inner: [ai, yIn, 0], outer: [ai + Lc, yOut, Ls], outerRadius: rho });
    if (last) break;
    a -= step;
  }
  return out;
}

export function buildMechanical(m: ResolvedModel, input: DesignInput): ComponentGeometry[] {
  const mats = input.mechanical.materials;
  const cs = MECH_RULES.chordSection;
  const rep = { section: 'representational' as const };

  // ── MEC-001 Puente ──
  const z0 = m.bridgeType === 'full-span' ? -m.rBearing : 0;
  const z1 = m.rBearing;
  const yGirderAxis = m.yGirderBottom + (m.yDeck - m.yGirderBottom) / 2;
  const girderDepth = m.yDeck - m.yGirderBottom;
  const bridgeChildren: GeometryNode[] = [];
  for (const sx of [-1, 1]) {
    const x = (sx * m.bridgeWidth) / 2;
    bridgeChildren.push(node(`MEC-001.girder-${sx < 0 ? 'L' : 'R'}`, 'Viga principal', mats.bridge, beam([x, yGirderAxis, z0], [x, yGirderAxis, z1], MECH_RULES.girderWidth, girderDepth), rep));
    bridgeChildren.push(node(`MEC-001.handrail-${sx < 0 ? 'L' : 'R'}`, 'Pasamanos', mats.bridge, beam([x, m.yDeck + MECH_RULES.handrailHeight, z0], [x, m.yDeck + MECH_RULES.handrailHeight, z1], 0.05, 0.05), rep));
    const nPosts = Math.max(2, Math.ceil((z1 - z0) / 1.5) + 1);
    for (let i = 0; i < nPosts; i++) {
      const z = z0 + ((z1 - z0) * i) / (nPosts - 1);
      bridgeChildren.push(node(`MEC-001.post-${sx < 0 ? 'L' : 'R'}-${i}`, 'Montante de barandilla', mats.bridge, beam([x, m.yDeck, z], [x, m.yDeck + MECH_RULES.handrailHeight, z], 0.05, 0.05), rep));
    }
  }
  bridgeChildren.push(
    node('MEC-001.deck', 'Tablero (chapa antideslizante)', mats.bridge, box(m.bridgeWidth, MECH_RULES.deckThickness, z1 - z0), {
      transform: { position: [0, m.yDeck - MECH_RULES.deckThickness / 2, (z0 + z1) / 2], rotationY: 0 },
      ...rep,
    }),
  );
  if (m.bridgeType === 'radial') {
    // Plataforma del accionamiento sobre la columna central: completa el apoyo en z < 0, donde no hay tablero.
    bridgeChildren.push(
      node('MEC-001.drive-platform', 'Plataforma del accionamiento sobre la columna central', mats.bridge, cylinder(driveSupportRadius(m), MECH_RULES.deckThickness, 48), {
        transform: { position: [0, m.yDeck - MECH_RULES.deckThickness / 2, 0], rotationY: 0 },
        ...rep,
      }),
    );
  }
  const bridgeConn: ConnectionPoint[] = [
    { id: 'MEC-001.drive-seat', componentId: 'MEC-001', position: [0, m.yDeck, 0], matesWith: 'MEC-002.base', description: 'Asiento del accionamiento' },
    { id: 'MEC-001.bearing-0', componentId: 'MEC-001', position: [0, m.yBridgeBearing, m.rBearing], matesWith: 'CIV-005.bearing-0', description: 'Apoyo exterior +Z' },
  ];
  if (m.bridgeType === 'full-span') {
    bridgeConn.push({ id: 'MEC-001.bearing-1', componentId: 'MEC-001', position: [0, m.yBridgeBearing, -m.rBearing], matesWith: 'CIV-005.bearing-1', description: 'Apoyo exterior −Z' });
  } else {
    bridgeConn.push({ id: 'MEC-001.inner-bearing', componentId: 'MEC-001', position: [0, m.yGirderBottom, 0], matesWith: 'HYD-001.column-top', description: 'Apoyo interior sobre la columna central' });
  }
  feedwellHangerThetas(m).forEach((th, k) => {
    const p = polar(m.rFeedwellOuter, th, m.yGirderBottom);
    bridgeChildren.push(node(`MEC-001.crossbeam-${k}`, 'Travesaño de cuelgue', mats.bridge, beam([-m.bridgeWidth / 2, m.yGirderBottom + cs / 2, p[2]], [m.bridgeWidth / 2, m.yGirderBottom + cs / 2, p[2]], cs, cs), rep));
    bridgeConn.push({ id: `MEC-001.hanger-${k}`, componentId: 'MEC-001', position: p, description: 'Punto de cuelgue del pozo de alimentación' });
  });
  const bridge = component('MEC-001', node('MEC-001', `Puente ${m.bridgeType === 'full-span' ? 'de vano completo' : 'radial'}`, 'NONE', undefined, { children: bridgeChildren }), bridgeConn);

  // ── MEC-002 Accionamiento (representación paramétrica, sin dimensionar) ──
  const drive = component(
    'MEC-002',
    node('MEC-002', 'Accionamiento central', 'NONE', undefined, {
      children: [
        node('MEC-002.gearbox', 'Reductor / corona (envolvente)', mats.mechanism, cylinder(m.driveFootprint / 2, m.driveHeight * 0.6, 32), {
          transform: { position: [0, m.yDeck + (m.driveHeight * 0.6) / 2, 0], rotationY: 0 },
          ...rep,
        }),
        node('MEC-002.motor', 'Motor (envolvente)', mats.mechanism, box(m.driveFootprint * 0.35, m.driveHeight * 0.4, m.driveFootprint * 0.35), {
          transform: { position: [m.driveFootprint * 0.3, m.yDeck + m.driveHeight * 0.8, 0], rotationY: 0 },
          ...rep,
        }),
      ],
    }),
    [
      { id: 'MEC-002.base', componentId: 'MEC-002', position: [0, m.yDeck, 0], description: 'Brida de apoyo' },
      { id: 'MEC-002.output', componentId: 'MEC-002', position: [0, m.yDeck, 0], matesWith: 'MEC-003.top', description: 'Salida al mecanismo giratorio' },
    ],
  );

  // ── MEC-003 Jaula giratoria ──
  const a = m.cageHalfWidth;
  const yCageBottom = armBottomChordY(m, m.rArmRoot);
  const corners: [number, number][] = [
    [a, a],
    [-a, a],
    [-a, -a],
    [a, -a],
  ];
  const cageChildren: GeometryNode[] = corners.map(([x, z], i) => node(`MEC-003.leg-${i}`, 'Montante de jaula', mats.submerged, beam([x, yCageBottom, z], [x, m.yDeck, z], m.cageMember, m.cageMember), { ...rep, moving: true }));
  for (const [lvl, y] of [
    ['bottom', yCageBottom + m.cageMember / 2],
    ['mid', (yCageBottom + m.yDeck) / 2],
    ['top', m.yGirderBottom - m.cageMember],
  ] as const) {
    corners.forEach(([x, z], i) => {
      const [x2, z2] = corners[(i + 1) % 4]!;
      cageChildren.push(node(`MEC-003.ring-${lvl}-${i}`, 'Cerco de jaula', mats.submerged, beam([x, y, z], [x2, y, z2], m.cageMember, m.cageMember), { ...rep, moving: true }));
    });
  }
  const cageConn: ConnectionPoint[] = [{ id: 'MEC-003.top', componentId: 'MEC-003', position: [0, m.yDeck, 0], description: 'Unión al accionamiento' }];
  armAngles(m).forEach((th, k) => {
    cageConn.push({ id: `MEC-003.arm-seat-${k}`, componentId: 'MEC-003', position: polar(m.rArmRoot, th, yCageBottom), matesWith: `MEC-004.arm-${k}.root`, description: `Asiento del brazo ${k + 1}` });
  });
  const cage = component('MEC-003', node('MEC-003', 'Mecanismo giratorio (jaula)', 'NONE', undefined, { children: cageChildren }), cageConn);

  // ── MEC-004 Brazos ──
  const st = armStations(m);
  const blades = bladeLayout(m);
  const armNodes: GeometryNode[] = [];
  const armConn: ConnectionPoint[] = [];
  armAngles(m).forEach((th, k) => {
    const pts = (yf: (r: number) => number) => st.map((r) => polar(r, th, yf(r)));
    const bottom = pts((r) => armBottomChordY(m, r) + cs / 2);
    const top = pts((r) => armTopChordY(m, r) - cs / 2);
    for (let i = 1; i < st.length; i++) {
      armNodes.push(node(`MEC-004.arm-${k}.bottom-${i}`, 'Cordón inferior', mats.submerged, beam(bottom[i - 1]!, bottom[i]!, cs, cs), { ...rep, moving: true }));
      armNodes.push(node(`MEC-004.arm-${k}.top-${i}`, 'Cordón superior', mats.submerged, beam(top[i - 1]!, top[i]!, cs, cs), { ...rep, moving: true }));
    }
    for (let i = 0; i < st.length; i++) {
      armNodes.push(node(`MEC-004.arm-${k}.vert-${i}`, 'Montante', mats.submerged, beam(bottom[i]!, top[i]!, cs * 0.75, cs * 0.75), { ...rep, moving: true }));
    }
    armConn.push({ id: `MEC-004.arm-${k}.root`, componentId: 'MEC-004', position: polar(m.rArmRoot, th, armBottomChordY(m, m.rArmRoot)), description: 'Raíz del brazo' });
    const b0 = blades[0];
    if (b0) {
      armConn.push({ id: `MEC-004.arm-${k}.blade-rail`, componentId: 'MEC-004', position: polar(b0.a, th, armBottomChordY(m, b0.a)), description: 'Fijación de la primera paleta' });
    }
  });
  if (armAngles(m).length > 0) {
    const th0 = armAngles(m)[0]!;
    armConn.push({ id: 'MEC-004.arm-0.skimmer-seat', componentId: 'MEC-004', position: polar(m.rSkimmerStart, th0, armTopChordY(m, m.rSkimmerStart)), description: 'Arranque del montante del barredor de flotantes' });
  }
  const arms = component('MEC-004', node('MEC-004', 'Brazos portarrasquetas', 'NONE', undefined, { children: armNodes }), armConn);

  // ── MEC-005 Paletas ──
  const bladeNodes: GeometryNode[] = [];
  const bladeConn: ConnectionPoint[] = [];
  armAngles(m).forEach((th, k) => {
    blades.forEach((b, i) => {
      bladeNodes.push(node(`MEC-005.arm-${k}.blade-${i}`, 'Paleta de barrido', mats.submerged, beam(rotateY(b.inner, th), rotateY(b.outer, th), m.bladeThickness, m.bladeHeight), { moving: true }));
    });
    const b0 = blades[0];
    if (b0) {
      bladeConn.push({ id: `MEC-005.set-${k}`, componentId: 'MEC-005', position: polar(b0.a, th, b0.inner[1] + m.bladeHeight / 2), matesWith: `MEC-004.arm-${k}.blade-rail`, description: 'Fijación al brazo' });
    }
  });
  const bladesC = component('MEC-005', node('MEC-005', 'Paletas de barrido', 'NONE', undefined, { children: bladeNodes }), bladeConn);

  // ── MEC-006 Flotantes: deflector, barredor y caja ──
  const th0 = armAngles(m)[0] ?? 0;
  const ySkArm = m.yWaterAvg + MECH_RULES.skimmerArmAboveWater;
  const strutBottom = polar(m.rSkimmerStart, th0, armTopChordY(m, m.rSkimmerStart));
  const scumChildren: GeometryNode[] = [
    node('MEC-006.baffle', 'Deflector de flotantes', input.hydraulics.materials.plates, ring(m.rBaffleInner, m.rBaffleInner + m.baffleThickness, m.yBaffleBottom, m.yBaffleTop, m.segments)),
    node('MEC-006.strut', 'Montante del barredor', mats.submerged, beam(strutBottom, polar(m.rSkimmerStart, th0, ySkArm), cs, cs), { ...rep, moving: true }),
    node('MEC-006.arm', 'Brazo del barredor', mats.submerged, beam(polar(m.rSkimmerStart, th0, ySkArm), polar(m.rSkimmerTip, th0, ySkArm), cs, cs), { ...rep, moving: true }),
    node('MEC-006.blade', 'Pala del barredor', mats.submerged, beam(polar(m.rSkimmerStart, th0, m.yWaterAvg), polar(m.rSkimmerTip, th0, m.yWaterAvg), m.bladeThickness, MECH_RULES.skimmerBladeDepth), { moving: true }),
    node('MEC-006.wiper', 'Labio flexible', mats.wipers, beam(polar(m.rSkimmerTip - 0.15, th0, m.yWaterAvg), polar(m.rSkimmerTip, th0, m.yWaterAvg), 0.01, MECH_RULES.skimmerBladeDepth), { moving: true }),
    node('MEC-006.box', 'Caja de flotantes con playa', input.hydraulics.materials.plates, box(m.scumBoxLength, MECH_RULES.scumBoxDepth, m.scumBoxWidth), {
      transform: { position: polar(m.rBaffleInner - m.scumBoxLength / 2, MECH_RULES.scumBoxTheta, m.yWaterAvg + 0.02 - MECH_RULES.scumBoxDepth / 2), rotationY: MECH_RULES.scumBoxTheta },
      ...rep,
    }),
  ];
  const scum = component('MEC-006', node('MEC-006', 'Retirada de flotantes', 'NONE', undefined, { children: scumChildren }), [
    { id: 'MEC-006.strut-foot', componentId: 'MEC-006', position: strutBottom, matesWith: 'MEC-004.arm-0.skimmer-seat', description: 'Pie del montante sobre el brazo 1' },
  ]);

  return [bridge, drive, cage, arms, bladesC, scum];
}
