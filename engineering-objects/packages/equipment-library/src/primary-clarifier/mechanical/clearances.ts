import { evaluateRange, type CheckList } from '@eo/engineering-core';
import { checkConnections, shapeVolume, walk, type Assembly, type RevolveShape, type Vec2 } from '@eo/geometry-engine';
import { floorElevation, type ResolvedModel } from '../definition/engine.js';
import type { DesignInput } from '../definition/schema.js';
import { deflectorLayout } from '../hydraulics/geometry.js';
import { armTopChordY, bladeLayout } from './geometry.js';

/**
 * Nivel 3 — Geometría: comprobaciones sobre la geometría realmente generada
 * (no sobre los parámetros), para detectar incoherencias entre cálculo y modelo.
 */
export function geometryChecks(m: ResolvedModel, input: DesignInput, assembly: Assembly, checks: CheckList, vGrossCalc: number): void {
  const me = input.mechanical;

  // Continuidad del fondo: el perfil de la formación de pendiente sigue floorElevation sin saltos.
  const fill = assembly.components.find((c) => c.componentId === 'CIV-003')?.root.shape as RevolveShape | undefined;
  let maxJump = 0;
  for (const r of [m.rSump, m.rSlopeStart]) {
    maxJump = Math.max(maxJump, Math.abs(floorElevation(m, r + 1e-7) - floorElevation(m, r - 1e-7)));
  }
  const topVerts = fill ? fill.profile.slice(2) : [];
  const onFloor = topVerts.every(([r, y]) => Math.abs(floorElevation(m, r) - y) < 1e-9);
  checks.add({
    id: 'GEO-FLOOR-CONTINUITY',
    level: 3,
    status: maxJump < 1e-5 && onFloor ? 'PASS' : 'FAIL',
    title: 'Continuidad del fondo',
    message: maxJump < 1e-5 && onFloor ? 'El fondo es continuo y la geometría sigue la ley de pendiente.' : 'Discontinuidad entre el fondo calculado y el modelado.',
    value: maxJump,
    unit: 'm',
    componentIds: ['CIV-003', 'CIV-004'],
  });

  // Volumen bruto medido sobre la geometría (Pappus) frente al calculado analíticamente.
  const water: Vec2[] = [[0, -m.sumpDrop], ...[...topVerts].reverse(), [m.R, m.H], [0, m.H]];
  // topVerts va de R a rp; invertido va de rp a R. Se cierra por la lámina (y = H) y el eje.
  const vGeom = shapeVolume({ kind: 'revolve', profile: dedupe(water), thetaStart: 0, thetaLength: 2 * Math.PI, segments: 8 });
  const rel = Math.abs(vGeom - vGrossCalc) / vGrossCalc;
  checks.add({
    id: 'GEO-VOLUME-CONSISTENCY',
    level: 3,
    status: rel < 1e-9 ? 'PASS' : 'FAIL',
    title: 'Volumen geométrico = volumen calculado',
    message: rel < 1e-9 ? `La geometría generada encierra ${vGeom.toFixed(3)} m³, igual al volumen bruto calculado.` : `Diferencia relativa ${rel.toExponential(2)} entre geometría y cálculo.`,
    value: vGeom,
    unit: 'm³',
    componentIds: ['CIV-002', 'CIV-003'],
  });

  // Diámetro modelado = diámetro calculado.
  const wall = assembly.components.find((c) => c.componentId === 'CIV-002')?.root.shape as RevolveShape | undefined;
  const rModel = wall?.profile[0]?.[0] ?? NaN;
  checks.add({
    id: 'GEO-DIAMETER-CONSISTENCY',
    level: 3,
    status: Math.abs(2 * rModel - m.D) < 1e-12 ? 'PASS' : 'FAIL',
    title: 'Diámetro modelado = diámetro calculado',
    message: 'Se compara la cara interior del muro generado con el diámetro hidráulico adoptado.',
    value: 2 * rModel,
    unit: 'm',
    componentIds: ['CIV-002'],
  });

  // Paletas: holgura real al fondo muestreando el borde inferior de cada paleta.
  const blades = bladeLayout(m);
  let minClr = Infinity;
  let maxRadius = 0;
  for (const b of blades) {
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const x = b.inner[0] + (b.outer[0] - b.inner[0]) * t;
      const z = b.inner[2] + (b.outer[2] - b.inner[2]) * t;
      const yBottom = b.inner[1] + (b.outer[1] - b.inner[1]) * t - m.bladeHeight / 2;
      const rho = Math.hypot(x, z);
      maxRadius = Math.max(maxRadius, rho + m.bladeThickness / 2);
      minClr = Math.min(minClr, yBottom - floorElevation(m, rho));
    }
  }
  {
    const ev = evaluateRange(minClr, { min: me.bladeFloorClearanceM * (1 - 1e-6) });
    checks.add({
      id: 'GEO-BLADE-FLOOR',
      level: 3,
      status: blades.length > 0 ? ev.status : 'FAIL',
      title: 'Holgura paletas – fondo',
      message: blades.length > 0 ? `${blades.length} paletas por brazo; holgura mínima medida a lo largo de cada paleta.` : 'No caben paletas en el brazo.',
      value: minClr,
      limit: ev.limit,
      unit: 'm',
      componentIds: ['MEC-005', 'CIV-003'],
    });
    const wallClr = m.R - maxRadius;
    const ev2 = evaluateRange(wallClr, { min: me.armWallClearanceM - 1e-6 });
    checks.add({
      id: 'GEO-BLADE-WALL',
      level: 3,
      status: ev2.status,
      title: 'Holgura paletas – muro',
      message: 'Distancia del punto más exterior de las paletas a la cara interior del muro.',
      value: wallClr,
      limit: ev2.limit,
      unit: 'm',
      componentIds: ['MEC-005', 'CIV-002'],
    });
    const coverage = blades.length > 0 ? Math.min(...blades.map((b) => b.a)) : Infinity;
    checks.add({
      id: 'GEO-BLADE-SUMP-COVERAGE',
      level: 3,
      status: coverage <= m.rSump ? 'PASS' : 'WARNING',
      title: 'Las paletas barren hasta la poceta',
      message: coverage <= m.rSump ? 'La paleta interior alcanza la poceta.' : 'Queda una corona sin barrer entre la última paleta y la poceta.',
      value: coverage,
      limit: `≤ ${m.rSump.toFixed(3)}`,
      unit: 'm',
      componentIds: ['MEC-005', 'CIV-004'],
    });
  }

  // Deflectores: dentro del pozo y fuera del barrido de la jaula.
  {
    const dl = deflectorLayout(m);
    const cageInner = m.cageHalfWidth - m.cageMember / 2;
    const clr = cageInner - dl.outerCornerRadius;
    const ev = evaluateRange(clr, { min: me.cageColumnClearanceM });
    checks.add({
      id: 'GEO-DEFLECTOR-CAGE',
      level: 3,
      status: ev.status,
      title: 'Holgura deflectores – jaula giratoria',
      message: ev.status === 'PASS' ? 'Los deflectores fijos quedan dentro de la jaula.' : 'La jaula giratoria barrería los deflectores.',
      value: clr,
      limit: ev.limit,
      unit: 'm',
      componentIds: ['HYD-003', 'MEC-003'],
    });
  }

  // Deflector de flotantes frente a los brazos (que giran por debajo).
  {
    const clr = m.yBaffleBottom - armTopChordY(m, m.rBaffleInner);
    const ev = evaluateRange(clr, { min: me.feedwellArmClearanceMinM });
    checks.add({
      id: 'GEO-BAFFLE-ARMS',
      level: 3,
      status: ev.status,
      title: 'Holgura deflector de flotantes – brazos',
      message: ev.status === 'PASS' ? 'Cumple.' : 'El deflector de flotantes interfiere con los brazos.',
      value: clr,
      limit: ev.limit,
      unit: 'm',
      componentIds: ['MEC-006', 'MEC-004'],
    });
  }

  // Conexiones: cada punto emparejado coincide con su pareja.
  const conns = checkConnections(assembly, 1e-9);
  const bad = conns.filter((c) => !c.ok);
  checks.add({
    id: 'GEO-CONNECTIONS',
    level: 3,
    status: bad.length === 0 ? 'PASS' : 'FAIL',
    title: 'Componentes correctamente conectados',
    message: bad.length === 0 ? `${conns.length} conexiones coincidentes.` : `Conexiones abiertas: ${bad.map((b) => `${b.from}→${b.to} (${b.gap.toExponential(1)} m)`).join(', ')}`,
    value: bad.length,
    componentIds: [],
  });

  // Alineación: todas las piezas de revolución comparten el eje del objeto.
  let offAxis = 0;
  for (const c of assembly.components) {
    walk(c.root, (n, world) => {
      if (n.shape?.kind === 'revolve' && (Math.abs(world.position[0]) > 1e-12 || Math.abs(world.position[2]) > 1e-12)) offAxis++;
    });
  }
  checks.add({
    id: 'GEO-AXIS-ALIGNMENT',
    level: 3,
    status: offAxis === 0 ? 'PASS' : 'FAIL',
    title: 'Alineación con el eje del tanque',
    message: offAxis === 0 ? 'Todos los sólidos de revolución son coaxiales.' : `${offAxis} sólidos de revolución fuera de eje.`,
    componentIds: [],
  });

  checks.add({
    id: 'GEO-SKIMMER-BEACH',
    level: 3,
    status: 'NOT_EVALUATED',
    title: 'Interacción barredor – playa de flotantes',
    message: 'Contacto funcional previsto (labio flexible sobre la rampa). Geometría de rampa y labio a definir con el fabricante.',
    componentIds: ['MEC-006'],
  });
}

function dedupe(pts: Vec2[]): Vec2[] {
  const out: Vec2[] = [];
  for (const p of pts) {
    const q = out[out.length - 1];
    if (!q || Math.abs(q[0] - p[0]) > 1e-12 || Math.abs(q[1] - p[1]) > 1e-12) out.push(p);
  }
  return out;
}
