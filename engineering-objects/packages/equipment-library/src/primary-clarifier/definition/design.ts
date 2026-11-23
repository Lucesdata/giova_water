import {
  CheckList,
  REFERENCES,
  getReference,
  summarize,
  type CheckResult,
  type SourceReference,
  type TracedValue,
  type ValidationSummary,
} from '@eo/engineering-core';
import { walk, type Assembly, type ComponentGeometry, type ConnectionPoint, type Vec3 } from '@eo/geometry-engine';
import { buildCivil } from '../civil/geometry.js';
import { constructiveChecks, measure, type Measurements } from '../civil/measurements.js';
import { buildHydraulics } from '../hydraulics/geometry.js';
import { geometryChecks } from '../mechanical/clearances.js';
import { buildMechanical } from '../mechanical/geometry.js';
import { COMPONENTS, COMPONENT_DEPENDENCIES, COMPONENT_IDS, type ComponentId, type Discipline } from './components.js';
import { ENGINEERING_MODEL_VERSION, runEngine, type ResizeGroup, type ResolvedModel, type SizingDecisions } from './engine.js';
import { PROFILES, resolveCriteria, type Criterion, type CriterionKey, type DesignProfile } from './profiles.js';
import { SCHEMA_VERSION, parseDesignInput, type DesignInput } from './schema.js';

export interface MotionDefinition {
  readonly type: 'fixed' | 'rotation';
  /** Grados de libertad respecto al objeto. */
  readonly dof: 0 | 1;
  readonly axis?: Vec3;
  readonly origin?: Vec3;
  readonly note?: string;
}

/** Definición de componente de ingeniería (spec §8). */
export interface EngineeringComponent {
  readonly id: ComponentId;
  readonly name: string;
  readonly discipline: Discipline;
  readonly materialIds: readonly string[];
  readonly massKg: number | null;
  readonly massStatus: 'ESTIMATED' | 'PARTIAL' | 'NOT_EVALUATED';
  readonly connections: readonly ConnectionPoint[];
  readonly motion: MotionDefinition;
  /** Comprobaciones que afectan al componente (holguras, criterios). */
  readonly checkIds: readonly string[];
  readonly dependsOn: readonly string[];
  readonly assemblyConstraints: readonly string[];
  readonly geometryHash: string;
}

export type PipelineStage =
  | 'INPUT'
  | 'PARAMETER_VALIDATION'
  | 'HYDRAULIC_CALCULATION'
  | 'GEOMETRIC_RESOLUTION'
  | 'CONSTRUCTIVE_CHECKS'
  | 'COMPONENT_CONFIGURATION'
  | 'MESH_GENERATION'
  | 'ASSEMBLY_VERIFICATION';

export interface ClarifierDesign {
  readonly input: DesignInput;
  readonly profile: DesignProfile;
  readonly criteria: Partial<Record<CriterionKey, Criterion>>;
  readonly engineeringModelVersion: string;
  readonly values: Readonly<Record<string, TracedValue>>;
  readonly decisions: SizingDecisions;
  readonly model: ResolvedModel;
  readonly assembly: Assembly;
  readonly components: readonly EngineeringComponent[];
  readonly measurements: Measurements;
  readonly checks: readonly CheckResult[];
  readonly summary: ValidationSummary;
  readonly sources: readonly SourceReference[];
  readonly pipeline: readonly { stage: PipelineStage; ok: boolean; detail?: string }[];
}

export interface DesignOptions {
  /** Decisiones congeladas (modos B y C de redimensionamiento). */
  readonly fixed?: Partial<SizingDecisions>;
  /** Contexto de redimensionamiento para informar de lo que las restricciones impiden. */
  readonly resizeContext?: { readonly mode: 'B' | 'C'; readonly lockedGroups: readonly ResizeGroup[] };
}

const MOTION: Partial<Record<ComponentId, MotionDefinition>> = {
  'MEC-002': { type: 'rotation', dof: 1, axis: [0, 1, 0], origin: [0, 0, 0], note: 'Solo el eje de salida gira; la carcasa es fija.' },
  'MEC-003': { type: 'rotation', dof: 1, axis: [0, 1, 0], origin: [0, 0, 0] },
  'MEC-004': { type: 'rotation', dof: 1, axis: [0, 1, 0], origin: [0, 0, 0] },
  'MEC-005': { type: 'rotation', dof: 1, axis: [0, 1, 0], origin: [0, 0, 0] },
  'MEC-006': { type: 'rotation', dof: 1, axis: [0, 1, 0], origin: [0, 0, 0], note: 'Gira el barredor; deflector y caja son fijos.' },
};

const ASSEMBLY_CONSTRAINTS: Partial<Record<ComponentId, string[]>> = {
  'CIV-002': ['Apoya en CIV-001.', 'Coaxial con el eje Y del objeto.'],
  'CIV-005': ['Ménsula del muro CIV-002 (canal exterior).'],
  'HYD-001': ['La columna atraviesa la poceta CIV-004 y la losa CIV-001 (pasamuros).'],
  'HYD-002': ['Colgado de MEC-001 (y de la columna en puente radial).'],
  'HYD-003': ['Fijos a la columna; deben quedar dentro del barrido libre de MEC-003.'],
  'HYD-004': ['Atornillado a la cara interior de CIV-002 con colisos de nivelación.'],
  'MEC-001': ['Apoya en la coronación de CIV-005 (y en HYD-001 si es radial).'],
  'MEC-003': ['Cuelga de MEC-002; gira alrededor de HYD-001 sin contacto.'],
  'MEC-004': ['Unidos a MEC-003; siguen la pendiente de CIV-003.'],
  'MEC-005': ['Unidas a MEC-004; holgura constante al fondo.'],
  'MEC-006': ['Barredor unido a MEC-004; deflector anclado a CIV-002.'],
};

/**
 * Pipeline de regeneración (spec §6.4). Función pura y determinista: mismas entradas ⇒ mismo resultado.
 */
export function designClarifier(rawInput: unknown, options: DesignOptions = {}): ClarifierDesign {
  const pipeline: { stage: PipelineStage; ok: boolean; detail?: string }[] = [{ stage: 'INPUT', ok: true }];
  const input = parseDesignInput(rawInput);
  const criteria = resolveCriteria(input);
  const profile = PROFILES[input.profileId];
  const checks = new CheckList();
  checks.add({ id: 'DATA-SCHEMA', level: 1, status: 'PASS', title: 'Esquema de entradas', message: `Entradas válidas (esquema ${SCHEMA_VERSION}).` });
  for (const [k, o] of Object.entries(input.criteriaOverrides)) {
    const known = getReference(o.sourceId);
    checks.add({
      id: `DATA-OVERRIDE-SOURCE-${k}`,
      level: 1,
      status: known ? 'PASS' : 'WARNING',
      title: `Fuente del criterio "${k}"`,
      message: known ? `${known.title} (${known.edition}). ${o.note}` : `Fuente "${o.sourceId}" no catalogada. ${o.note}`,
      sourceId: o.sourceId,
    });
  }
  pipeline.push({ stage: 'PARAMETER_VALIDATION', ok: true });

  const { trace, decisions, model, sourcesUsed } = runEngine(input, criteria, options.fixed ?? {}, checks);
  pipeline.push({ stage: 'HYDRAULIC_CALCULATION', ok: true });
  pipeline.push({ stage: 'GEOMETRIC_RESOLUTION', ok: true });

  let componentsGeo: ComponentGeometry[] = [];
  try {
    componentsGeo = [...buildCivil(model, input), ...buildHydraulics(model, input), ...buildMechanical(model, input)];
    pipeline.push({ stage: 'MESH_GENERATION', ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.add({ id: 'GEO-BUILD', level: 3, status: 'FAIL', title: 'Generación de geometría', message: `La geometría no puede generarse con estas dimensiones: ${msg}` });
    pipeline.push({ stage: 'MESH_GENERATION', ok: false, detail: msg });
  }
  const assembly: Assembly = { objectId: input.tag, transform: { position: [0, 0, 0], rotationY: 0 }, components: componentsGeo };

  if (componentsGeo.length > 0) {
    geometryChecks(model, input, assembly, checks, trace.get('volume.gross'));
  }
  pipeline.push({ stage: 'ASSEMBLY_VERIFICATION', ok: componentsGeo.length > 0 });

  const measurements = measure(model, input, assembly);
  constructiveChecks(model, input, measurements, checks);

  // Estado documental
  const tbv = [...sourcesUsed].map((id) => getReference(id)).filter((r): r is SourceReference => !!r && r.verification === 'TO_VERIFY');
  checks.add({
    id: 'DOC-PROFILE',
    level: 4,
    status: profile.approval === 'DIDACTIC' || profile.approval === 'REQUIRES_PROJECT_CRITERIA' ? 'WARNING' : 'PASS',
    title: `Perfil de diseño: ${profile.name}`,
    message:
      profile.approval === 'DIDACTIC'
        ? 'Escenario didáctico: los resultados son una hipótesis de cálculo, no un diseño aprobado.'
        : profile.approval === 'REQUIRES_PROJECT_CRITERIA'
          ? Object.keys(input.criteriaOverrides).length === 0
            ? 'Perfil de proyecto sin criterios introducidos.'
            : 'Criterios de proyecto introducidos por el usuario; su aprobación es responsabilidad del proyectista.'
          : profile.purpose,
  });
  checks.add({
    id: 'DOC-SOURCES',
    level: 4,
    status: tbv.length > 0 ? 'WARNING' : 'PASS',
    title: 'Verificación de fuentes',
    message: tbv.length > 0 ? `Fuentes pendientes de contrastar con su edición: ${tbv.map((r) => r.id).join(', ')}.` : 'Sin fuentes pendientes de verificación.',
  });
  pipeline.push({ stage: 'CONSTRUCTIVE_CHECKS', ok: true });

  const allChecks = checks.list();
  const components: EngineeringComponent[] = componentsGeo.map((cg) => {
    const id = cg.componentId as ComponentId;
    const mats = new Set<string>();
    walk(cg.root, (n) => {
      if (n.shape && n.role === 'solid') mats.add(n.materialId);
    });
    const q = measurements.components.find((c) => c.componentId === id);
    return {
      id,
      name: COMPONENTS[id].name,
      discipline: COMPONENTS[id].discipline,
      materialIds: [...mats].sort(),
      massKg: q?.massKg ?? null,
      massStatus: q?.massStatus ?? 'NOT_EVALUATED',
      connections: cg.connections,
      motion: MOTION[id] ?? { type: 'fixed', dof: 0 },
      checkIds: allChecks.filter((c) => c.componentIds?.includes(id)).map((c) => c.id),
      dependsOn: COMPONENT_DEPENDENCIES[id],
      assemblyConstraints: ASSEMBLY_CONSTRAINTS[id] ?? [],
      geometryHash: cg.hash,
    };
  });
  const missing = COMPONENT_IDS.filter((id) => !components.some((c) => c.id === id));
  if (componentsGeo.length > 0) {
    checks.add({
      id: 'GEO-COMPONENT-INVENTORY',
      level: 3,
      status: missing.length === 0 ? 'PASS' : 'FAIL',
      title: 'Inventario de componentes completo',
      message: missing.length === 0 ? `${components.length} componentes generados.` : `Faltan: ${missing.join(', ')}`,
    });
  }
  pipeline.push({ stage: 'COMPONENT_CONFIGURATION', ok: missing.length === 0 });

  const ctx = options.resizeContext;
  if (ctx) {
    const hydFails = checks.list().filter((c) => c.status === 'FAIL' && (c.level === 2 || c.level === 3));
    const locked = ctx.lockedGroups.length > 0 ? ctx.lockedGroups.join(', ') : 'ninguno';
    checks.add({
      id: ctx.mode === 'B' ? 'MODE-B-CAPACITY' : 'MODE-C-CONSTRAINTS',
      level: 2,
      status: hydFails.length === 0 ? 'PASS' : 'FAIL',
      title: ctx.mode === 'B' ? 'Capacidad del equipo existente' : 'Compatibilidad de la modificación restringida',
      message:
        hydFails.length === 0
          ? ctx.mode === 'B'
            ? 'La geometría existente admite las nuevas condiciones de operación.'
            : `Las restricciones (grupos bloqueados: ${locked}) permiten cumplir los criterios evaluados.`
          : ctx.mode === 'B'
            ? `La geometría existente no admite las nuevas condiciones: ${hydFails.map((c) => c.id).join(', ')}.`
            : `Las restricciones (grupos bloqueados: ${locked}) impiden cumplir: ${hydFails.map((c) => c.id).join(', ')}.`,
    });
  }

  const finalChecks = checks.list();
  const sourceIds = new Set<string>([...sourcesUsed, ...finalChecks.map((c) => c.sourceId).filter((s): s is string => !!s)]);
  const sources = [...sourceIds].map((id) => getReference(id)).filter((r): r is SourceReference => !!r);
  if (input.profileId === 'didactic') sources.unshift(REFERENCES['SPEC-DEC-002-DIDACTIC']);

  return {
    input,
    profile,
    criteria,
    engineeringModelVersion: ENGINEERING_MODEL_VERSION,
    values: trace.toRecord(),
    decisions,
    model,
    assembly,
    components,
    measurements,
    checks: finalChecks,
    summary: summarize(finalChecks),
    sources,
    pipeline,
  };
}
