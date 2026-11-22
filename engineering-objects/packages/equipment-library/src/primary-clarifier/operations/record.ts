import { z } from 'zod';
import type { UnitId } from '@eo/engineering-core';
import type { ClarifierVariant } from '../definition/variant.js';

/**
 * Contrato de datos de operación (spec §2.3 capa Extensions; §16 "datos operativos").
 *
 * Define QUÉ variables de operación acepta el objeto y en qué unidades, para que una extensión
 * futura (monitorización, diagnóstico) las aporte sin tocar la definición del equipo.
 * V1 no implementa monitorización: solo valida registros y los lee frente a la variante de diseño.
 */
export const OPERATIONAL_RECORD_FORMAT = 'engineering-objects/primary-clarifier-operational-record';

export interface OperationalVariable {
  readonly label: string;
  readonly unit: UnitId;
  /** Magnitud de diseño (clave trazada o de entrada) con la que se compara, si existe. */
  readonly designReference?: string;
  readonly note?: string;
}

export const OPERATIONAL_VARIABLES = {
  flowLps: { label: 'Caudal tratado', unit: 'L/s', designReference: 'flow.avg.Ls' },
  influentTssMgL: { label: 'SST de entrada', unit: 'mg/L', designReference: 'input.influent.tssMgL' },
  effluentTssMgL: { label: 'SST de salida', unit: 'mg/L' },
  influentBod5MgL: { label: 'DBO₅ de entrada', unit: 'mg/L', designReference: 'input.influent.bod5MgL' },
  effluentBod5MgL: { label: 'DBO₅ de salida', unit: 'mg/L' },
  influentTurbidityNtu: { label: 'Turbidez de entrada', unit: 'NTU' },
  effluentTurbidityNtu: { label: 'Turbidez de salida', unit: 'NTU' },
  temperatureC: { label: 'Temperatura del agua', unit: 'degC', designReference: 'input.influent.temperatureC' },
  sludgeBlanketDepthM: {
    label: 'Altura del manto de lodos',
    unit: 'm',
    designReference: 'input.geometry.sludgeBlanketDepthM',
    note: 'Medida sobre el fondo en pared (y = 0), igual que la entrada de diseño.',
  },
  sludgeWithdrawalM3h: { label: 'Caudal de purga de lodos', unit: 'm3/h', designReference: 'sludge.flow' },
  sludgeSolidsPercent: { label: 'Concentración del lodo purgado', unit: '%' },
} as const satisfies Record<string, OperationalVariable>;

export type OperationalVariableKey = keyof typeof OPERATIONAL_VARIABLES;

const value = z.number().finite();
const valuesSchema = z
  .object({
    flowLps: value.nonnegative(),
    influentTssMgL: value.nonnegative(),
    effluentTssMgL: value.nonnegative(),
    influentBod5MgL: value.nonnegative(),
    effluentBod5MgL: value.nonnegative(),
    influentTurbidityNtu: value.nonnegative(),
    effluentTurbidityNtu: value.nonnegative(),
    temperatureC: value.min(-5).max(60),
    sludgeBlanketDepthM: value,
    sludgeWithdrawalM3h: value.nonnegative(),
    sludgeSolidsPercent: value.min(0).max(100),
  } satisfies Record<OperationalVariableKey, z.ZodTypeAny>)
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Un registro debe contener al menos una variable');

export const operationalRecordSchema = z
  .object({
    format: z.literal(OPERATIONAL_RECORD_FORMAT),
    formatVersion: z.literal(1),
    variantId: z.string().min(1),
    recordedAt: z.string().datetime({ offset: true }),
    origin: z.enum(['MEASURED', 'LAB', 'ESTIMATED']),
    values: valuesSchema,
    note: z.string().optional(),
  })
  .strict();

export type OperationalRecord = z.infer<typeof operationalRecordSchema>;

export function parseOperationalRecord(raw: unknown): OperationalRecord {
  return operationalRecordSchema.parse(raw);
}

export interface OperationalReading {
  readonly key: string;
  readonly label: string;
  readonly unit: UnitId;
  readonly observed: number;
  readonly design?: number;
  readonly message: string;
  readonly status: 'WITHIN_DESIGN' | 'OUTSIDE_DESIGN' | 'INFORMATIVE';
}

/**
 * Lectura de un registro frente a su variante de diseño. Solo aritmética sobre datos medidos;
 * no es un diagnóstico ni modifica la variante.
 */
export function readAgainstDesign(record: OperationalRecord, variant: ClarifierVariant): OperationalReading[] {
  if (record.variantId !== variant.variantId) {
    throw new Error(`El registro pertenece a ${record.variantId}, no a ${variant.variantId}`);
  }
  const vals = variant.calculatedOutputs.values;
  const v = record.values;
  const out: OperationalReading[] = [];

  if (v.flowLps !== undefined) {
    const avg = vals['flow.avg.Ls']!.value;
    const peak = vals['flow.peak.Ls']!.value;
    out.push({
      key: 'flow.ratioToDesign',
      label: 'Caudal observado / caudal medio de diseño',
      unit: '-',
      observed: v.flowLps / avg,
      design: 1,
      status: v.flowLps <= peak ? 'WITHIN_DESIGN' : 'OUTSIDE_DESIGN',
      message: v.flowLps <= peak ? 'Dentro del caudal punta de diseño.' : `Supera el caudal punta de diseño (${peak.toFixed(2)} L/s): evaluar en modo B.`,
    });
  }
  if (v.sludgeBlanketDepthM !== undefined) {
    const fwBottom = vals['level.feedwellBottom']!.value;
    const clear = fwBottom - v.sludgeBlanketDepthM;
    const design = variant.designInputs.geometry.sludgeBlanketDepthM;
    out.push({
      key: 'sludgeBlanket.clearanceToFeedwell',
      label: 'Resguardo observado entre manto y pozo de alimentación',
      unit: 'm',
      observed: clear,
      design: design !== undefined ? fwBottom - design : undefined,
      status: clear <= 0 ? 'OUTSIDE_DESIGN' : design !== undefined && v.sludgeBlanketDepthM > design ? 'OUTSIDE_DESIGN' : 'WITHIN_DESIGN',
      message:
        clear <= 0
          ? 'El manto alcanza el pozo de alimentación.'
          : design !== undefined && v.sludgeBlanketDepthM > design
            ? 'El manto supera la altura de diseño: revisar la frecuencia de purga.'
            : design === undefined
              ? 'Sin altura de diseño del manto para comparar.'
              : 'Manto por debajo de la altura de diseño.',
    });
  }
  // Resto de variables con referencia de diseño: lectura informativa observado frente a diseño.
  const handled = new Set<string>(['flowLps', 'sludgeBlanketDepthM']);
  for (const [key, def] of Object.entries(OPERATIONAL_VARIABLES) as [OperationalVariableKey, OperationalVariable][]) {
    const observed = v[key];
    if (observed === undefined || handled.has(key) || !def.designReference) continue;
    const design = resolveDesignReference(def.designReference, variant);
    out.push({
      key: `${key}.vsDesign`,
      label: `${def.label}: observado frente a diseño`,
      unit: def.unit,
      observed,
      design,
      status: 'INFORMATIVE',
      message:
        design === undefined
          ? 'La variante no define valor de diseño para esta variable.'
          : `Diseño ${Number(design.toPrecision(4))}; diferencia ${Number((observed - design).toPrecision(4))}.`,
    });
  }
  if (v.influentTssMgL !== undefined && v.effluentTssMgL !== undefined && v.influentTssMgL > 0) {
    out.push({
      key: 'removal.tss.observed',
      label: 'Eliminación de SST observada',
      unit: '%',
      observed: (100 * (v.influentTssMgL - v.effluentTssMgL)) / v.influentTssMgL,
      status: 'INFORMATIVE',
      message: 'Calculada con las concentraciones medidas; V1 no predice rendimientos de diseño.',
    });
  }
  if (v.influentBod5MgL !== undefined && v.effluentBod5MgL !== undefined && v.influentBod5MgL > 0) {
    out.push({
      key: 'removal.bod5.observed',
      label: 'Eliminación de DBO₅ observada',
      unit: '%',
      observed: (100 * (v.influentBod5MgL - v.effluentBod5MgL)) / v.influentBod5MgL,
      status: 'INFORMATIVE',
      message: 'Calculada con las concentraciones medidas.',
    });
  }
  return out;
}

/** Valor de diseño de una referencia: `input.<ruta>` en las entradas o clave trazada en las salidas. */
function resolveDesignReference(ref: string, variant: ClarifierVariant): number | undefined {
  if (ref.startsWith('input.')) {
    const val = ref
      .slice('input.'.length)
      .split('.')
      .reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), variant.designInputs);
    return typeof val === 'number' ? val : undefined;
  }
  return variant.calculatedOutputs.values[ref]?.value;
}
