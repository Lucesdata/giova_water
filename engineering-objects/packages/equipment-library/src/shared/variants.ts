import {
  cloneData,
  contentHash,
  deepFreeze,
  stableStringify,
  type CheckResult,
  type TracedValue,
  type ValidationStatus,
  type ValidationSummary,
  type VariantIdentity,
} from '@eo/engineering-core';
import { z } from 'zod';
import type { DesignOptions, EngineeringComponent } from '../primary-clarifier/definition/design.js';
import type { ResizeGroup } from '../primary-clarifier/definition/engine.js';
import { blockedChanges } from '../primary-clarifier/definition/inputGroups.js';
import type { Measurements } from '../primary-clarifier/civil/measurements.js';

/**
 * Ciclo de vida de variantes común a todos los equipos (spec §6 y §9.4): creación en modos
 * BASE/A/B/C, regeneración determinista, exportación e importación con recálculo y control de
 * integridad. Cada equipo aporta su `EquipmentDefinition`.
 */
export type VariantMode = 'BASE' | 'A' | 'B' | 'C';

/** Lo que una variante necesita de un diseño. */
export interface VariantDesign<I, Dc> {
  readonly input: I;
  readonly values: Readonly<Record<string, TracedValue>>;
  readonly decisions: Dc;
  readonly checks: readonly CheckResult[];
  readonly summary: ValidationSummary;
  readonly measurements: Measurements;
  readonly components: readonly EngineeringComponent[];
}

export interface EquipmentDefinition<I, Dc extends object, Dz extends VariantDesign<I, Dc>> {
  readonly objectType: string;
  readonly exportFormat: string;
  readonly schemaVersion: string;
  readonly modelVersion: string;
  readonly resizeGroups: readonly ResizeGroup[];
  /** Grupo de redimensionamiento de cada decisión bloqueable. */
  readonly decisionGroups: Readonly<Record<keyof Dc & string, ResizeGroup>>;
  /** Esquema estricto y parcial de las decisiones bloqueadas (nombres y dominios). */
  readonly lockSchema: z.ZodTypeAny;
  readonly migrations?: Readonly<Record<string, { to: string; migrate: (input: unknown) => unknown }>>;
  parse(raw: unknown): I;
  tagOf(input: I): string;
  design(input: I, options: DesignOptions): Dz;
  /** Grupos que deben estar permitidos para cambiar una entrada (modos B y C). */
  groupsRequiredFor(path: string): readonly ResizeGroup[];
}

export interface CalculatedOutputs<Dc = Record<string, number>> {
  readonly values: Readonly<Record<string, TracedValue>>;
  readonly decisions: Dc;
  readonly checks: readonly CheckResult[];
  readonly summary: ValidationSummary;
  readonly measurements: Measurements;
  readonly components: readonly Omit<EngineeringComponent, 'connections'>[];
}

export interface EquipmentVariant<I, Dc = Record<string, number>> extends VariantIdentity {
  readonly tag: string;
  readonly mode: VariantMode;
  readonly lockedDecisions: Partial<Dc>;
  readonly allowedResize: readonly ResizeGroup[] | null;
  readonly designInputs: I;
  readonly calculatedOutputs: CalculatedOutputs<Dc>;
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

/** Decisiones que deben venir bloqueadas según el modo (contrato de una variante válida). */
export function expectedLockKeysOf(decisionGroups: Readonly<Record<string, ResizeGroup>>, mode: VariantMode, allowedResize: readonly ResizeGroup[] | null): string[] {
  const keys = Object.keys(decisionGroups);
  if (mode === 'B') return [...keys];
  if (mode === 'C') return keys.filter((k) => !(allowedResize ?? []).includes(decisionGroups[k]!));
  return [];
}

function outputsOf<Dc>(d: VariantDesign<unknown, Dc>): CalculatedOutputs<Dc> {
  return {
    values: d.values,
    decisions: d.decisions,
    checks: d.checks,
    summary: d.summary,
    measurements: d.measurements,
    components: d.components.map(({ connections: _c, ...rest }) => rest),
  };
}

function hashOutputs(o: CalculatedOutputs<unknown>): string {
  return contentHash(cloneData(o));
}

function lockedGroupsOf(groups: readonly ResizeGroup[], mode: VariantMode, allowedResize: readonly ResizeGroup[] | null): readonly ResizeGroup[] {
  return mode === 'B' ? groups : mode === 'C' ? groups.filter((g) => !(allowedResize ?? []).includes(g)) : [];
}

interface BuildArgs<I, Dc> {
  objectId: string;
  parentVariantId: string | null;
  mode: VariantMode;
  input: I;
  locked: Partial<Dc>;
  allowedResize: readonly ResizeGroup[] | null;
  createdAt?: string;
  variantId?: string;
}

function build<I, Dc extends object, Dz extends VariantDesign<I, Dc>>(
  def: EquipmentDefinition<I, Dc, Dz>,
  args: BuildArgs<I, Dc>,
): { variant: EquipmentVariant<I, Dc>; design: Dz } {
  const lockedGroups = lockedGroupsOf(def.resizeGroups, args.mode, args.allowedResize);
  const design = def.design(args.input, {
    fixed: args.locked as Partial<Record<string, number>>,
    resizeContext: args.mode === 'B' || args.mode === 'C' ? { mode: args.mode, lockedGroups } : undefined,
  });
  const outputs = cloneData(outputsOf<Dc>(design));
  const outputsHash = hashOutputs(outputs);
  const variantId = args.variantId ?? `${def.tagOf(design.input)}@${contentHash({ i: design.input, m: args.mode, l: args.locked, p: args.parentVariantId }).slice(0, 10)}`;
  if (variantId === args.parentVariantId) throw new Error(`Una variante no puede ser su propia variante padre (${variantId}).`);
  const variant: EquipmentVariant<I, Dc> = deepFreeze({
    objectId: args.objectId,
    variantId,
    parentVariantId: args.parentVariantId,
    schemaVersion: def.schemaVersion,
    engineeringModelVersion: def.modelVersion,
    createdAt: args.createdAt ?? new Date().toISOString(),
    tag: def.tagOf(design.input),
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

export function createBaseVariantOf<I, Dc extends object, Dz extends VariantDesign<I, Dc>>(
  def: EquipmentDefinition<I, Dc, Dz>,
  rawInput: unknown,
  opts: { objectId?: string; createdAt?: string; variantId?: string } = {},
): EquipmentVariant<I, Dc> {
  const input = def.parse(rawInput);
  return build(def, { objectId: opts.objectId ?? `${def.objectType}:${def.tagOf(input)}`, parentVariantId: null, mode: 'BASE', input, locked: {}, allowedResize: null, createdAt: opts.createdAt, variantId: opts.variantId }).variant;
}

/** Genera una variante nueva. La variante padre es inmutable (congelada) y no se modifica. */
export function createVariantOf<I, Dc extends object, Dz extends VariantDesign<I, Dc>>(
  def: EquipmentDefinition<I, Dc, Dz>,
  parent: EquipmentVariant<I, Dc>,
  changes: unknown,
  opts: VariantOptions = {},
): EquipmentVariant<I, Dc> {
  const mode = opts.mode ?? 'A';
  if (mode !== 'C' && opts.allowedResize) throw new Error('allowedResize solo tiene sentido en modo C.');
  const unknownGroups = (opts.allowedResize ?? []).filter((g) => !def.resizeGroups.includes(g));
  if (unknownGroups.length > 0) {
    throw new Error(`allowedResize contiene grupos que no existen en ${def.objectType}: ${unknownGroups.join(', ')}. Válidos: ${def.resizeGroups.join(', ')}.`);
  }
  const merged = mergeInputs(cloneData(parent.designInputs) as unknown, changes);
  const input = def.parse(merged);
  if (mode === 'B' || mode === 'C') {
    // Ninguna entrada que defina geometría instalada puede cambiar en un grupo bloqueado.
    const allowed = new Set<ResizeGroup>(mode === 'C' ? (opts.allowedResize ?? []) : []);
    const blocked = blockedChanges(parent.designInputs, input, allowed, (p) => def.groupsRequiredFor(p));
    if (blocked.length > 0) {
      const list = blocked.map((b) => `${b.path} (requiere ${b.groups.join(' + ')})`).join(', ');
      throw new Error(
        mode === 'B'
          ? `Modo B (evaluación de equipo existente): la geometría es fija; no se puede modificar ${list}.`
          : `Modo C: ${list} cambia geometría de un grupo no permitido.`,
      );
    }
  }

  const locked: Record<string, number> = {};
  const parentDecisions = parent.calculatedOutputs.decisions as unknown as Record<string, number>;
  for (const k of expectedLockKeysOf(def.decisionGroups, mode, mode === 'C' ? (opts.allowedResize ?? []) : null)) {
    if (parentDecisions[k] !== undefined) locked[k] = parentDecisions[k];
  }
  return build(def, {
    objectId: parent.objectId,
    parentVariantId: parent.variantId,
    mode,
    input,
    locked: locked as Partial<Dc>,
    allowedResize: mode === 'C' ? (opts.allowedResize ?? []) : null,
    createdAt: opts.createdAt,
    variantId: opts.variantId,
  }).variant;
}

/** Regenera el diseño completo (geometría incluida) de una variante. Determinista. */
export function regenerateOf<I, Dc extends object, Dz extends VariantDesign<I, Dc>>(def: EquipmentDefinition<I, Dc, Dz>, v: EquipmentVariant<I, Dc>): Dz {
  return def.design(cloneData(v.designInputs), {
    fixed: v.lockedDecisions as Partial<Record<string, number>>,
    resizeContext: v.mode === 'B' || v.mode === 'C' ? { mode: v.mode, lockedGroups: lockedGroupsOf(def.resizeGroups, v.mode, v.allowedResize) } : undefined,
  });
}

/** ¿La variante se reproduce bit a bit con el modelo actual? */
export function reproducesOf<I, Dc extends object, Dz extends VariantDesign<I, Dc>>(def: EquipmentDefinition<I, Dc, Dz>, v: EquipmentVariant<I, Dc>): boolean {
  return hashOutputs(cloneData(outputsOf<Dc>(regenerateOf(def, v)))) === v.outputsHash;
}

// ───────────────────────── Exportación / importación ─────────────────────────

export function exportVariantOf(def: { exportFormat: string }, v: EquipmentVariant<unknown, unknown>): string {
  return JSON.stringify({ format: def.exportFormat, formatVersion: 1, variant: v }, null, 2);
}

export interface ImportResult<I, Dc> {
  readonly variant: EquipmentVariant<I, Dc>;
  /** true si las salidas recalculadas coinciden con las almacenadas. */
  readonly verified: boolean;
  readonly notes: readonly string[];
}

/**
 * Importa una variante: valida el sobre y las entradas, aplica migraciones y RECALCULA.
 * Nunca se confía en las salidas almacenadas: se comparan con las recalculadas.
 */
export function importVariantOf<I, Dc extends object, Dz extends VariantDesign<I, Dc>>(def: EquipmentDefinition<I, Dc, Dz>, json: string): ImportResult<I, Dc> {
  const envelopeSchema = z.object({
    format: z.literal(def.exportFormat),
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
        lockedDecisions: def.lockSchema,
        allowedResize: z.array(z.enum(def.resizeGroups as [ResizeGroup, ...ResizeGroup[]])).nullable(),
        designInputs: z.unknown(),
        outputsHash: z.string(),
      })
      .passthrough(),
  });
  const env = envelopeSchema.parse(JSON.parse(json));
  const v = env.variant;
  const lockedDecisions = v.lockedDecisions as Record<string, number>;
  const notes: string[] = [];
  let schemaVersion = v.schemaVersion;
  let inputs: unknown = v.designInputs;
  while (schemaVersion !== def.schemaVersion) {
    const m = def.migrations?.[schemaVersion];
    if (!m) throw new Error(`Versión de esquema ${schemaVersion} no soportada (actual ${def.schemaVersion}).`);
    inputs = m.migrate(inputs);
    notes.push(`Migrado ${schemaVersion} → ${m.to}.`);
    schemaVersion = m.to;
  }
  const input = def.parse(inputs);
  // El conjunto de bloqueos debe ser exactamente el que exige el modo: ni faltan ni sobran.
  if ((v.mode === 'C') !== (v.allowedResize !== null)) throw new Error(`allowedResize no es coherente con el modo ${v.mode}.`);
  const expected = expectedLockKeysOf(def.decisionGroups, v.mode, v.allowedResize).sort();
  const got = Object.keys(lockedDecisions).sort();
  if (expected.join(',') !== got.join(',')) {
    const missing = expected.filter((k) => !got.includes(k));
    const extra = got.filter((k) => !expected.includes(k));
    throw new Error(`Bloqueos no válidos para el modo ${v.mode}${missing.length ? `; faltan: ${missing.join(', ')}` : ''}${extra.length ? `; sobran: ${extra.join(', ')}` : ''}.`);
  }
  const { variant } = build(def, {
    objectId: v.objectId,
    parentVariantId: v.parentVariantId,
    mode: v.mode,
    input,
    locked: lockedDecisions as Partial<Dc>,
    allowedResize: v.allowedResize,
    createdAt: v.createdAt,
    variantId: v.variantId,
  });
  const verified = variant.outputsHash === v.outputsHash;
  if (!verified) {
    if (v.engineeringModelVersion !== def.modelVersion) {
      notes.push(`Recalculado con el modelo ${def.modelVersion} (el archivo se generó con ${v.engineeringModelVersion}); los resultados pueden diferir.`);
    } else {
      throw new Error(`Integridad: las salidas almacenadas de ${v.variantId} no coinciden con las recalculadas con el mismo modelo.`);
    }
  }
  return { variant, verified, notes };
}

// ───────────────────────── Comparación ─────────────────────────

export interface ComparisonRow {
  readonly key: string;
  readonly label: string;
  readonly unit: string;
  readonly values: readonly (number | null)[];
}

export function compareVariantValues(variants: readonly { calculatedOutputs: { values: Readonly<Record<string, TracedValue>> } }[], keys: readonly string[]): ComparisonRow[] {
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

type AnyVariant = EquipmentVariant<unknown, unknown>;

/** Registro inmutable de variantes: añadir nunca sustituye ni modifica una existente. */
export class VariantLibrary<V extends AnyVariant = AnyVariant> {
  private readonly items = new Map<string, V>();

  add(v: V): V {
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

  get(id: string): V | undefined {
    return this.items.get(id);
  }

  list(): V[] {
    return [...this.items.values()];
  }

  /** Linaje desde la raíz hasta la variante. */
  lineage(id: string): V[] {
    const out: V[] = [];
    let cur = this.items.get(id);
    while (cur) {
      out.unshift(cur);
      cur = cur.parentVariantId ? this.items.get(cur.parentVariantId) : undefined;
    }
    return out;
  }
}
