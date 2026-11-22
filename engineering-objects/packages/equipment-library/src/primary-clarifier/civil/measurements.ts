import { PHYSICAL, type CheckList } from '@eo/engineering-core';
import { getMaterial, isMaterialId, type MaterialId } from '@eo/material-library';
import { measureNode, revolvedSegmentArea, type Assembly, type NodeMeasurement } from '@eo/geometry-engine';
import type { ResolvedModel } from '../definition/engine.js';
import type { DesignInput } from '../definition/schema.js';
import { floorProfile } from './geometry.js';

export interface ComponentQuantities {
  readonly componentId: string;
  readonly items: readonly (NodeMeasurement & { readonly massKg: number | null })[];
  /** Masa total si TODAS las piezas tienen sección real y densidad conocida; si no, null. */
  readonly massKg: number | null;
  readonly massStatus: 'ESTIMATED' | 'PARTIAL' | 'NOT_EVALUATED';
}

export interface Measurements {
  readonly concreteByElementM3: Readonly<Record<string, number>>;
  readonly concreteTotalM3: number;
  readonly fillTotalM3: number;
  readonly wettedLiningM2: Readonly<Record<string, number>>;
  readonly wettedLiningTotalM2: number;
  readonly excavationM3: number | null;
  readonly components: readonly ComponentQuantities[];
  readonly metalLengthByMaterialM: Readonly<Record<string, number>>;
  readonly corrosionProtectionM2: number;
  readonly rebar: 'NOT_EVALUATED';
  readonly notes: readonly string[];
}

/** Mediciones geométricas (spec §7.4). Las cantidades de armadura no se calculan sin diseño estructural. */
export function measure(m: ResolvedModel, input: DesignInput, assembly: Assembly): Measurements {
  const concreteByElement: Record<string, number> = {};
  let concreteTotal = 0;
  let fillTotal = 0;
  const components: ComponentQuantities[] = [];
  const metalLength: Record<string, number> = {};
  let corrosion = 0;

  for (const c of assembly.components) {
    const items = measureNode(c.root).map((it) => {
      const mat = isMaterialId(it.materialId) ? getMaterial(it.materialId as MaterialId) : undefined;
      const massKg = mat && it.section === 'real' ? it.volumeM3 * mat.densityKgM3 : null;
      if (mat?.family === 'concrete') {
        if (it.materialId === input.civil.fillConcrete && c.componentId === 'CIV-003') fillTotal += it.volumeM3;
        else {
          concreteByElement[c.componentId] = (concreteByElement[c.componentId] ?? 0) + it.volumeM3;
          concreteTotal += it.volumeM3;
        }
      }
      if (mat && (mat.family === 'structural-steel' || mat.family === 'stainless-steel')) {
        if (it.lengthM !== undefined) metalLength[it.materialId] = (metalLength[it.materialId] ?? 0) + it.lengthM;
        if (mat.family === 'structural-steel' && it.outerSurfaceM2 !== undefined) corrosion += it.outerSurfaceM2;
      }
      return { ...it, massKg };
    });
    const known = items.filter((i) => i.massKg !== null);
    const massStatus: ComponentQuantities['massStatus'] = items.length > 0 && known.length === items.length ? 'ESTIMATED' : known.length > 0 ? 'PARTIAL' : 'NOT_EVALUATED';
    components.push({
      componentId: c.componentId,
      items,
      massKg: massStatus === 'ESTIMATED' ? known.reduce((s, i) => s + (i.massKg ?? 0), 0) : null,
      massStatus,
    });
  }

  // Superficie mojada a revestir: muro interior, fondo, poceta y canal.
  const fp = floorProfile(m);
  let floorArea = 0;
  for (let i = 1; i < fp.length; i++) floorArea += revolvedSegmentArea(fp[i - 1]!, fp[i]!);
  const sumpDepth = -m.sumpDrop - m.ySumpBottom;
  const launderDepth = m.H - m.yLaunderFloor;
  const lining: Record<string, number> = {
    'CIV-002 cara interior': 2 * Math.PI * m.R * m.H,
    'CIV-003 fondo': floorArea,
    'CIV-004 poceta': 2 * Math.PI * m.rSump * sumpDepth + Math.PI * (m.rSump ** 2 - m.rColumnOuter ** 2),
    'CIV-005 canal': Math.PI * (m.rLaunderOuter ** 2 - m.rWallOuter ** 2) + 2 * Math.PI * (m.rWallOuter + m.rLaunderOuter) * launderDepth,
  };

  let excavation: number | null = null;
  const gl = input.site.groundLevelM;
  if (gl !== undefined) {
    const ws = input.site.excavationWorkingSpaceM;
    const main = Math.max(0, gl - m.ySlabBottom) * Math.PI * (m.rSlab + ws) ** 2;
    const pit = Math.max(0, Math.min(gl, m.ySlabBottom) - m.yPitBottom) * Math.PI * (m.rSumpOuter + ws) ** 2;
    excavation = main + pit;
  }

  return {
    concreteByElementM3: concreteByElement,
    concreteTotalM3: concreteTotal,
    fillTotalM3: fillTotal,
    wettedLiningM2: lining,
    wettedLiningTotalM2: Object.values(lining).reduce((a, b) => a + b, 0),
    excavationM3: excavation,
    components,
    metalLengthByMaterialM: metalLength,
    corrosionProtectionM2: corrosion,
    rebar: 'NOT_EVALUATED',
    notes: [
      'Volúmenes de hormigón medidos sobre la geometría modelada (Pappus-Guldin), sin descontar pasamuros.',
      'Las piezas de sección representativa (celosías, vigas del puente, jaula) solo aportan longitud: su masa queda NOT_EVALUATED.',
      'La superficie de protección anticorrosiva incluye solo acero estructural no inoxidable.',
      'Armaduras: no se miden sin diseño estructural.',
      gl === undefined ? 'Excavación no medida: falta la cota del terreno (site.groundLevelM).' : 'Excavación de paredes verticales con sobreancho de trabajo; sin taludes ni entibación.',
    ],
  };
}

/** Nivel 4 — Ingeniería constructiva. */
export function constructiveChecks(m: ResolvedModel, input: DesignInput, meas: Measurements, checks: CheckList): void {
  const civ = input.civil;
  const thicknesses = `muro ${civ.wallThicknessM} m, losa ${civ.baseSlabThicknessM} m, canal ${civ.channelWallThicknessM} m, poceta ${civ.sumpWallThicknessM} m`;
  if (civ.thicknessStatus === 'PRELIMINARY_UNVERIFIED') {
    checks.add({
      id: 'STR-THICKNESS',
      level: 4,
      status: 'NOT_EVALUATED',
      critical: true,
      title: 'Espesores estructurales',
      message: `Espesores preliminares NO verificados (${thicknesses}). Requiere cálculo según EN 1992-1-1 / EN 1992-3: presión hidrostática, estado vacío con empuje del terreno, nivel freático, cargas de equipos y puente, fisuración y estanqueidad.`,
      componentIds: ['CIV-001', 'CIV-002', 'CIV-004', 'CIV-005'],
    });
  } else {
    checks.add({
      id: 'STR-THICKNESS',
      level: 4,
      status: civ.structuralVerificationRef ? 'PASS' : 'WARNING',
      critical: true,
      title: 'Espesores estructurales',
      message: civ.structuralVerificationRef ? `Verificados según ${civ.structuralVerificationRef}.` : 'Marcados como verificados sin referencia documental.',
      componentIds: ['CIV-001', 'CIV-002', 'CIV-004', 'CIV-005'],
    });
  }
  checks.add({ id: 'STR-CRACKING-WATERTIGHTNESS', level: 4, status: 'NOT_EVALUATED', critical: true, title: 'Fisuración y estanqueidad (EN 1992-3)', message: 'Método no implementado en V1.', componentIds: ['CIV-002', 'CIV-001'] });
  checks.add({ id: 'STR-GEOTECHNICS', level: 4, status: 'NOT_EVALUATED', critical: true, title: 'Cimentación y geotecnia', message: 'Sin datos geotécnicos: capacidad portante, asientos y empujes no evaluados.', componentIds: ['CIV-001'] });

  const gw = input.site.groundwaterLevelM;
  if (gw === undefined) {
    checks.add({ id: 'STR-FLOTATION', level: 4, status: 'NOT_EVALUATED', critical: true, title: 'Flotación con tanque vacío', message: 'Falta el nivel freático (site.groundwaterLevelM).', componentIds: ['CIV-001'] });
  } else {
    const submerged = Math.max(0, gw - m.ySlabBottom);
    const uplift = 1000 * PHYSICAL.g * Math.PI * m.rSlab ** 2 * submerged;
    const conc = getMaterial(civ.concrete);
    const fill = getMaterial(civ.fillConcrete);
    const weight = PHYSICAL.g * (meas.concreteTotalM3 * conc.densityKgM3 + meas.fillTotalM3 * fill.densityKgM3);
    checks.add({
      id: 'STR-FLOTATION',
      level: 4,
      status: 'NOT_EVALUATED',
      critical: true,
      title: 'Flotación con tanque vacío',
      message: `Relación indicativa peso propio / subpresión = ${uplift > 0 ? (weight / uplift).toFixed(2) : '∞'} (sin coeficientes parciales ni rozamiento del terreno). La verificación UPL según EN 1997-1 no está implementada.`,
      value: uplift > 0 ? weight / uplift : undefined,
      componentIds: ['CIV-001'],
    });
  }
  checks.add({ id: 'STR-REBAR', level: 4, status: 'NOT_EVALUATED', title: 'Cuantías de armadura', message: 'No se miden armaduras sin diseño estructural (spec §7.4).', componentIds: ['CIV-001', 'CIV-002'] });

  checks.add({ id: 'MEC-BRIDGE-STRUCTURE', level: 4, status: 'NOT_EVALUATED', critical: true, title: 'Resistencia y flecha del puente', message: `Puente ${m.bridgeType} de ${m.bridgeSpan.toFixed(2)} m de luz: perfiles, cargas de mantenimiento y apoyos sin dimensionar. El tipo de apoyo no se infiere del diámetro.`, componentIds: ['MEC-001'] });
  checks.add({ id: 'MEC-DRIVE-TORQUE', level: 4, status: 'NOT_EVALUATED', critical: true, title: 'Par y potencia del accionamiento', message: 'Representación paramétrica sin selección comercial. Par, potencia y limitador de par se calcularán en fase posterior.', componentIds: ['MEC-002'] });
  checks.add({ id: 'MEC-ARMS-STRUCTURE', level: 4, status: 'NOT_EVALUATED', critical: true, title: 'Resistencia de jaula, brazos y paletas', message: 'Secciones representativas; sin cálculo de esfuerzos de barrido.', componentIds: ['MEC-003', 'MEC-004', 'MEC-005'] });
  checks.add({ id: 'MEC-FABRICATION', level: 4, status: 'NOT_EVALUATED', critical: true, title: 'Equipo mecánico apto para fabricación', message: 'El equipo mecánico NO está dimensionado para fabricación.', componentIds: ['MEC-001', 'MEC-002', 'MEC-003', 'MEC-004', 'MEC-005', 'MEC-006'] });

  const sub = getMaterial(input.mechanical.materials.submerged);
  checks.add({
    id: 'MAT-SUBMERGED-COMPATIBILITY',
    level: 4,
    status: sub.family === 'stainless-steel' ? 'PASS' : 'WARNING',
    title: 'Material de piezas sumergidas',
    message: sub.family === 'stainless-steel' ? `${sub.designation}: compatible con inmersión en agua residual urbana (confirmar agresividad real).` : `${sub.designation}: protección limitada en inmersión permanente; valorar acero inoxidable o sistema de pintura para inmersión.`,
    componentIds: ['MEC-003', 'MEC-004', 'MEC-005', 'MEC-006'],
  });
  const conc = getMaterial(civ.concrete);
  const hasXA = conc.family === 'concrete' && conc.exposureClasses.some((e) => e.startsWith('XA'));
  checks.add({
    id: 'MAT-CONCRETE-EXPOSURE',
    level: 4,
    status: hasXA ? 'PASS' : 'WARNING',
    title: 'Clase de exposición del hormigón',
    message: hasXA ? 'El hormigón declara exposición química (XA). Confirmar la clase con análisis del agua y del terreno.' : 'El hormigón no declara exposición química (XA) para contacto con agua residual.',
    componentIds: ['CIV-001', 'CIV-002', 'CIV-004', 'CIV-005'],
  });

  checks.add({
    id: 'SITE-EXCAVATION',
    level: 4,
    status: meas.excavationM3 === null ? 'NOT_EVALUATED' : 'PASS',
    title: 'Implantación y excavación',
    message: meas.excavationM3 === null ? 'Sin cota de terreno: excavación no medida.' : `Excavación estimada ${meas.excavationM3.toFixed(1)} m³.`,
    componentIds: ['CIV-001'],
  });
}
