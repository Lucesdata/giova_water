import {
  cloneData,
  contentHash,
  deepFreeze,
  stableStringify,
  type CalculationResult,
  type CheckResult,
  type EngineeringObject,
  type TracedValue,
  type ValidationResult,
  type ValidationStatus,
  type ValidationSummary,
  type VariantIdentity,
} from '@eo/engineering-core';
import { z } from 'zod';
import { designClarifier, type ClarifierDesign, type EngineeringComponent } from './design.js';
import { DECISION_GROUP, ENGINEERING_MODEL_VERSION, RESIZE_GROUPS, type ResizeGroup, type SizingDecisions } from './engine.js';
import { blockedChanges } from './inputGroups.js';
import { SCHEMA_VERSION, parseDesignInput, type DeepPartial, type DesignInput, type DesignInputRaw } from './schema.js';

export const OBJECT_TYPE = 'primary-clarifier/circular-center-feed';
export const EXPORT_FORMAT = 'engineering-objects/primary-clarifier-variant';

/**
 * Modo de generación (spec §6.1):
 *  BASE — configuración inicial.
 *  A — nuevo diseño desde una configuración existente.
 *  B — evaluación de equipo existente: geometría fija, cambian las condiciones de operación.
 *  C — modificación restringida: solo se redimensionan los grupos permitidos.
 */
export type VariantMode = 'BASE' | 'A' | 'B' | 'C';

export interface CalculatedOutputs {
  readonly values: Readonly<Record<string, TracedValue>>;
  readonly decisions: SizingDecisions;
  readonly checks: readonly CheckResult[];
  readonly summary: ValidationSummary;
  readonly measurements: ClarifierDesign['measurements'];
  readonly components: readonly Omit<EngineeringComponent, 'connections'>[];
}

export interface ClarifierVariant extends VariantIdentity {
  readonly tag: string;
  readonly mode: VariantMode;
  readonly lockedDecisions: Partial<SizingDecisions>;
  readonly allowedResize: readonly ResizeGroup[] | null;
  readonly designInputs: DesignInput;
  readonly calculatedOutputs: CalculatedOutputs;
  readonly validationStatus: ValidationStatus;
  /** Hash de las salidas: permite comprobar que una variante se reproduce exactamente. */
  readonly outputsHash: string;
}

export interface VariantOptions {
  readonly mode?: Exclude<VariantMode, 'BASE'>;
  /** Solo modo C: grupos que se pueden redimensionar. */
  readonly allowedResize?: readonly ResizeGroup[];
  readonly createdAt?: string;
  readonly variantId?: string;
}

const ALL_GROUPS = RESIZE_GROUPS;
const DECISION_KEYS = Object.keys(DECISION_GROUP) as (keyof SizingDecisions)[];

/** Decisiones que deben venir bloqueadas según el modo (contrato de una variante válida). */
export function expectedLockKeys(mode: VariantMode, allowedResize: readonly ResizeGroup[] | null): (keyof SizingDecisions)[] {
  if (mode === 'B') return [...DECISION_KEYS];
  if (mode === 'C') return DECISION_KEYS.filter((k) => !(allowedResize ?? []).includes(DECISION_GROUP[k]));
  return [];
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Fusión profunda pura: objetos se fusionan, el resto se sustituye. `peak` se sustituye entero.
 * `null` elimina un campo opcional (p. ej. retirar un criterio de punta).
 */
export function mergeInputs<T>(base: T, changes: unknown, path = ''): T {
  if (!isPlainObject(base) || !isPlainObject(changes)) return (changes === undefined ? base : changes) as T;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(changes)) {
    if (v === undefined) continue;
    if (v === null) {
      delete out[k];
      continue;
    }
    const p = path ? `${path}.${k}` : k;
    out[k] = p === 'flow.peak' ? v : mergeInputs(out[k], v, p);
  }
  return out as T;
}

function outputsOf(d: ClarifierDesign): CalculatedOutputs {
  return {
    values: d.values,
    decisions: d.decisions,
    checks: d.checks,
    summary: d.summary,
    measurements: d.measurements,
    components: d.components.map(({ connections: _c, ...rest }) => rest),
  };
}

function hashOutputs(o: CalculatedOutputs): string {
  return contentHash(cloneData(o));
}

interface BuildArgs {
  objectId: string;
  parentVariantId: string | null;
  mode: VariantMode;
  input: DesignInput;
  locked: Partial<SizingDecisions>;
  allowedResize: readonly ResizeGroup[] | null;
  createdAt?: string;
  variantId?: string;
}

function build(args: BuildArgs): { variant: ClarifierVariant; design: ClarifierDesign } {
  const lockedGroups = args.mode === 'B' ? ALL_GROUPS : args.mode === 'C' ? ALL_GROUPS.filter((g) => !(args.allowedResize ?? []).includes(g)) : [];
  const design = designClarifier(args.input, {
    fixed: args.locked,
    resizeContext: args.mode === 'B' || args.mode === 'C' ? { mode: args.mode, lockedGroups } : undefined,
  });
  const outputs = cloneData(outputsOf(design));
  const outputsHash = hashOutputs(outputs);
  const variantId = args.variantId ?? `${design.input.tag}@${contentHash({ i: design.input, m: args.mode, l: args.locked, p: args.parentVariantId }).slice(0, 10)}`;
  if (variantId === args.parentVariantId) throw new Error(`Una variante no puede ser su propia variante padre (${variantId}).`);
  const variant: ClarifierVariant = deepFreeze({
    objectId: args.objectId,
    variantId,
    parentVariantId: args.parentVariantId,
    schemaVersion: SCHEMA_VERSION,
    engineeringModelVersion: ENGINEERING_MODEL_VERSION,
    createdAt: args.createdAt ?? new Date().toISOString(),
    tag: design.input.tag,
    mode: args.mode,
    lockedDecisions: { ...args.locked },
    allowedResize: args.allowedResize ? [...args.allowedResize] : null,
    designInputs: cloneData(design.input),
    calculatedOutputs: outputs,
    validationStatus: design.summary.status,
    outputsHash,
  });
  return { variant, design };
}

export function createBaseVariant(rawInput: DesignInputRaw, opts: { objectId?: string; createdAt?: string; variantId?: string } = {}): ClarifierVariant {
  const input = parseDesignInput(rawInput);
  return build({ objectId: opts.objectId ?? `${OBJECT_TYPE}:${input.tag}`, parentVariantId: null, mode: 'BASE', input, locked: {}, allowedResize: null, createdAt: opts.createdAt, variantId: opts.variantId }).variant;
}

/**
 * Genera una variante nueva. La variante padre es inmutable (congelada) y no se modifica.
 */
export function createVariant(parent: ClarifierVariant, changes: DeepPartial<DesignInputRaw>, opts: VariantOptions = {}): ClarifierVariant {
  const mode = opts.mode ?? 'A';
  if (mode !== 'C' && opts.allowedResize) throw new Error('allowedResize solo tiene sentido en modo C.');
  const merged = mergeInputs(cloneData(parent.designInputs) as unknown, changes);
  const input = parseDesignInput(merged);
  if (mode === 'B' || mode === 'C') {
    // Ninguna entrada que defina geometría instalada puede cambiar en un grupo bloqueado.
    const allowed = new Set<ResizeGroup>(mode === 'C' ? (opts.allowedResize ?? []) : []);
    const blocked = blockedChanges(parent.designInputs, input, allowed);
    if (blocked.length > 0) {
      const list = blocked.map((b) => `${b.path} (requiere ${b.groups.join(' + ')})`).join(', ');
      throw new Error(
        mode === 'B'
          ? `Modo B (evaluación de equipo existente): la geometría es fija; no se puede modificar ${list}.`
          : `Modo C: ${list} cambia geometría de un grupo no permitido.`,
      );
    }
  }

  let locked: Partial<SizingDecisions> = {};
  const parentDecisions = parent.calculatedOutputs.decisions;
  if (mode === 'B') locked = { ...parentDecisions };
  if (mode === 'C') {
    const allowed = new Set(opts.allowedResize ?? []);
    for (const [k, g] of Object.entries(DECISION_GROUP) as [keyof SizingDecisions, ResizeGroup][]) {
      if (!allowed.has(g)) (locked as Record<string, number>)[k] = parentDecisions[k];
    }
  }
  return build({
    objectId: parent.objectId,
    parentVariantId: parent.variantId,
    mode,
    input,
    locked,
    allowedResize: mode === 'C' ? (opts.allowedResize ?? []) : null,
    createdAt: opts.createdAt,
    variantId: opts.variantId,
  }).variant;
}

/** Regenera el diseño completo (geometría incluida) de una variante. Determinista. */
export function regenerate(v: ClarifierVariant): ClarifierDesign {
  const lockedGroups = v.mode === 'B' ? ALL_GROUPS : v.mode === 'C' ? ALL_GROUPS.filter((g) => !(v.allowedResize ?? []).includes(g)) : [];
  return designClarifier(cloneData(v.designInputs), {
    fixed: v.lockedDecisions,
    resizeContext: v.mode === 'B' || v.mode === 'C' ? { mode: v.mode, lockedGroups } : undefined,
  });
}

/** ¿La variante se reproduce bit a bit con el modelo actual? */
export function reproduces(v: ClarifierVariant): boolean {
  return hashOutputs(cloneData(outputsOf(regenerate(v)))) === v.outputsHash;
}

// ───────────────────────── Exportación / importación ─────────────────────────

const dn = z.number().int().positive();
/** Forma en tiempo de ejecución de las decisiones bloqueadas: nombres y dominios de valor. */
const lockedDecisionsSchema = z
  .object({
    diameterM: z.number().finite().positive(),
    sideWaterDepthM: z.number().finite().positive(),
    inletDn: dn,
    portHeightM: z.number().finite().positive(),
    feedwellDiameterM: z.number().finite().positive(),
    notchCount: z.number().int().nonnegative(),
    effluentDn: dn,
    sludgeDn: dn,
    referenceWaterAvgY: z.number().finite(),
    referenceWaterPeakY: z.number().finite(),
  } satisfies Record<keyof SizingDecisions, z.ZodTypeAny>)
  .partial()
  .strict();

const envelopeSchema = z.object({
  format: z.literal(EXPORT_FORMAT),
  formatVersion: z.literal(1),
  variant: z
    .object({
      objectId: z.string(),
      variantId: z.string(),
      parentVariantId: z.string().nullable(),
      schemaVersion: z.string(),
      engineeringModelVersion: z.string(),
      createdAt: z.string(),
      tag: z.string(),
      mode: z.enum(['BASE', 'A', 'B', 'C']),
      lockedDecisions: lockedDecisionsSchema,
      allowedResize: z.array(z.enum(RESIZE_GROUPS as [ResizeGroup, ...ResizeGroup[]])).nullable(),
      designInputs: z.unknown(),
      outputsHash: z.string(),
    })
    .passthrough(),
});

export function exportVariant(v: ClarifierVariant): string {
  return JSON.stringify({ format: EXPORT_FORMAT, formatVersion: 1, variant: v }, null, 2);
}

/** Migraciones de esquema de entradas: versión origen → función a la siguiente. */
const MIGRATIONS: Record<string, { to: string; migrate: (input: unknown) => unknown }> = {};

export interface ImportResult {
  readonly variant: ClarifierVariant;
  /** true si las salidas recalculadas coinciden con las almacenadas. */
  readonly verified: boolean;
  readonly notes: readonly string[];
}

/**
 * Importa una variante: valida el sobre y las entradas, aplica migraciones y RECALCULA.
 * Nunca se confía en las salidas almacenadas: se comparan con las recalculadas.
 */
export function importVariant(json: string): ImportResult {
  const env = envelopeSchema.parse(JSON.parse(json));
  const v = env.variant;
  const notes: string[] = [];
  let schemaVersion = v.schemaVersion;
  let inputs: unknown = v.designInputs;
  while (schemaVersion !== SCHEMA_VERSION) {
    const m = MIGRATIONS[schemaVersion];
    if (!m) throw new Error(`Versión de esquema ${schemaVersion} no soportada (actual ${SCHEMA_VERSION}).`);
    inputs = m.migrate(inputs);
    notes.push(`Migrado ${schemaVersion} → ${m.to}.`);
    schemaVersion = m.to;
  }
  const input = parseDesignInput(inputs);
  // El conjunto de bloqueos debe ser exactamente el que exige el modo: ni faltan ni sobran.
  if ((v.mode === 'C') !== (v.allowedResize !== null)) throw new Error(`allowedResize no es coherente con el modo ${v.mode}.`);
  const expected = expectedLockKeys(v.mode, v.allowedResize).sort();
  const got = Object.keys(v.lockedDecisions).sort();
  if (expected.join(',') !== got.join(',')) {
    const missing = expected.filter((k) => !got.includes(k));
    const extra = got.filter((k) => !(expected as string[]).includes(k));
    throw new Error(`Bloqueos no válidos para el modo ${v.mode}${missing.length ? `; faltan: ${missing.join(', ')}` : ''}${extra.length ? `; sobran: ${extra.join(', ')}` : ''}.`);
  }
  const { variant } = build({
    objectId: v.objectId,
    parentVariantId: v.parentVariantId,
    mode: v.mode,
    input,
    locked: v.lockedDecisions as Partial<SizingDecisions>,
    allowedResize: v.allowedResize,
    createdAt: v.createdAt,
    variantId: v.variantId,
  });
  const verified = variant.outputsHash === v.outputsHash;
  if (!verified) {
    if (v.engineeringModelVersion !== ENGINEERING_MODEL_VERSION) {
      notes.push(`Recalculado con el modelo ${ENGINEERING_MODEL_VERSION} (el archivo se generó con ${v.engineeringModelVersion}); los resultados pueden diferir.`);
    } else {
      throw new Error(`Integridad: las salidas almacenadas de ${v.variantId} no coinciden con las recalculadas con el mismo modelo.`);
    }
  }
  return { variant, verified, notes };
}

// ───────────────────────── Comparación ─────────────────────────

export const COMPARISON_KEYS = [
  'flow.avg.Ls',
  'flow.peak.Ls',
  'area.required',
  'tank.diameter.theoretical',
  'tank.diameter',
  'tank.depth',
  'volume.effective',
  'hrt.avg',
  'loading.surface.avg',
  'loading.surface.peak',
  'loading.weir.peak',
  'weir.notchCount',
  'weir.head.peak',
  'inlet.dn',
  'effluent.dn',
  'sludge.dn',
  'feedwell.diameter',
  'arm.length',
  'bridge.span',
  'civil.channelOuterDiameter',
] as const;

export interface ComparisonRow {
  readonly key: string;
  readonly label: string;
  readonly unit: string;
  readonly values: readonly (number | null)[];
}

export function compareVariants(variants: readonly ClarifierVariant[], keys: readonly string[] = COMPARISON_KEYS): ComparisonRow[] {
  return keys.map((key) => {
    const first = variants.map((v) => v.calculatedOutputs.values[key]).find((x) => x);
    return {
      key,
      label: first?.label ?? key,
      unit: first?.unit ?? '',
      values: variants.map((v) => v.calculatedOutputs.values[key]?.value ?? null),
    };
  });
}

// ───────────────────────── Biblioteca de variantes ─────────────────────────

/** Registro inmutable de variantes: añadir nunca sustituye ni modifica una existente. */
export class VariantLibrary {
  private readonly items = new Map<string, ClarifierVariant>();

  add(v: ClarifierVariant): ClarifierVariant {
    const prev = this.items.get(v.variantId);
    if (prev) {
      // Una repetición idéntica devuelve lo ya registrado; cualquier otro registro con el mismo id se rechaza.
      if (prev === v || stableStringify(prev) === stableStringify(v)) return prev;
      throw new Error(`Ya existe una variante distinta con id ${v.variantId}`);
    }
    if (v.parentVariantId === v.variantId) throw new Error(`La variante ${v.variantId} no puede ser su propia variante padre`);
    if (v.parentVariantId && !this.items.has(v.parentVariantId)) throw new Error(`Variante padre ${v.parentVariantId} no registrada`);
    this.items.set(v.variantId, v);
    return v;
  }

  get(id: string): ClarifierVariant | undefined {
    return this.items.get(id);
  }

  list(): ClarifierVariant[] {
    return [...this.items.values()];
  }

  /** Linaje desde la raíz hasta la variante. */
  lineage(id: string): ClarifierVariant[] {
    const out: ClarifierVariant[] = [];
    let cur = this.items.get(id);
    while (cur) {
      out.unshift(cur);
      cur = cur.parentVariantId ? this.items.get(cur.parentVariantId) : undefined;
    }
    return out;
  }
}

// ───────────────────────── Objeto de ingeniería ─────────────────────────

/**
 * Implementación del contrato EngineeringObject para el decantador primario. Envuelve una
 * variante inmutable; el diseño completo (geometría) se regenera bajo demanda y se memoiza.
 */
export class PrimaryClarifier implements EngineeringObject<DesignInput, DeepPartial<DesignInputRaw>, EngineeringComponent, VariantOptions> {
  readonly type = OBJECT_TYPE;
  readonly definitionVersion = ENGINEERING_MODEL_VERSION;
  private cached?: ClarifierDesign;

  constructor(readonly variant: ClarifierVariant) {}

  static create(input: DesignInputRaw, opts?: { createdAt?: string }): PrimaryClarifier {
    return new PrimaryClarifier(createBaseVariant(input, opts));
  }

  get id(): string {
    return this.variant.variantId;
  }
  get schemaVersion(): string {
    return this.variant.schemaVersion;
  }
  get parameters(): Readonly<DesignInput> {
    return this.variant.designInputs;
  }
  get design(): ClarifierDesign {
    return (this.cached ??= regenerate(this.variant));
  }
  get components(): readonly EngineeringComponent[] {
    return this.design.components;
  }

  validate(): ValidationResult {
    const o = this.variant.calculatedOutputs;
    return { status: this.variant.validationStatus, checks: o.checks, summary: o.summary };
  }

  calculate(): CalculationResult {
    return { engineeringModelVersion: this.variant.engineeringModelVersion, values: this.variant.calculatedOutputs.values };
  }

  createVariant(changes: DeepPartial<DesignInputRaw>, options?: VariantOptions): PrimaryClarifier {
    return new PrimaryClarifier(createVariant(this.variant, changes, options));
  }
}
