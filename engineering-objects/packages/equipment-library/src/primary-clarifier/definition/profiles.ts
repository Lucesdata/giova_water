import type { RangeConstraint, ReferenceId, UnitId } from '@eo/engineering-core';
import type { DesignInput } from './schema.js';

/**
 * Perfiles de diseño (spec §4.2). Cada perfil declara sus hipótesis, sus límites con fuente y su
 * estado de aprobación. Ningún conjunto de valores es universal: el perfil "criterios de proyecto"
 * está vacío a propósito y debe completarse con los criterios aprobados del proyecto.
 */

export const CRITERION_KEYS = [
  'surfaceLoadingAvg',
  'surfaceLoadingPeak',
  'hrtAvg',
  'weirLoadingPeak',
  'sideWaterDepth',
  'floorSlope',
  'feedwellDiameterRatio',
  'feedwellDepth',
  'feedwellDownwardVelocityPeak',
  'diameter',
  'walkwayClearWidth',
] as const;

export type CriterionKey = (typeof CRITERION_KEYS)[number];

export const CRITERION_META: Record<CriterionKey, { label: string; unit: UnitId }> = {
  surfaceLoadingAvg: { label: 'Carga hidráulica superficial a caudal medio', unit: 'm3/(m2.h)' },
  surfaceLoadingPeak: { label: 'Carga hidráulica superficial a caudal punta', unit: 'm3/(m2.h)' },
  hrtAvg: { label: 'Tiempo de retención hidráulico a caudal medio', unit: 'h' },
  weirLoadingPeak: { label: 'Carga lineal sobre vertedero a caudal punta', unit: 'm3/(m.d)' },
  sideWaterDepth: { label: 'Profundidad útil en pared', unit: 'm' },
  floorSlope: { label: 'Pendiente radial del fondo', unit: 'm/m' },
  feedwellDiameterRatio: { label: 'Diámetro del pozo de alimentación / diámetro del tanque', unit: '-' },
  feedwellDepth: { label: 'Profundidad del pozo de alimentación', unit: 'm' },
  feedwellDownwardVelocityPeak: { label: 'Velocidad descendente en el pozo de alimentación a caudal punta', unit: 'm/s' },
  diameter: { label: 'Diámetro interior', unit: 'm' },
  walkwayClearWidth: { label: 'Anchura libre de pasarela', unit: 'm' },
};

export interface Criterion {
  readonly constraint: RangeConstraint;
  readonly sourceId: ReferenceId | string;
  readonly note?: string;
}

export type ProfileApproval = 'DIDACTIC' | 'REFERENCE_RANGES' | 'REQUIRES_PROJECT_CRITERIA';

export interface DesignProfile {
  readonly id: DesignInput['profileId'];
  readonly name: string;
  readonly purpose: string;
  readonly approval: ProfileApproval;
  readonly hypotheses: readonly string[];
  readonly criteria: Partial<Record<CriterionKey, Criterion>>;
}

/** Rangos típicos de bibliografía para sedimentación primaria (Metcalf & Eddy, 5.ª ed.). */
const ME: ReferenceId = 'METCALF-EDDY-2014';

const referenceRangesAsWarnings: Partial<Record<CriterionKey, Criterion>> = {
  // 30–50 m³/m²·d
  surfaceLoadingAvg: { constraint: { warnMin: 30 / 24, warnMax: 50 / 24 }, sourceId: ME, note: '30–50 m³/(m²·d)' },
  // 80–120 m³/m²·d
  surfaceLoadingPeak: { constraint: { warnMin: 80 / 24, warnMax: 120 / 24 }, sourceId: ME, note: '80–120 m³/(m²·d)' },
  hrtAvg: { constraint: { warnMin: 1.5, warnMax: 2.5 }, sourceId: ME },
  weirLoadingPeak: { constraint: { warnMax: 500 }, sourceId: ME, note: 'Rango típico 125–500 m³/(m·d); cargas bajas no son desfavorables.' },
  sideWaterDepth: { constraint: { warnMin: 3.0, warnMax: 4.9 }, sourceId: ME },
  floorSlope: { constraint: { warnMin: 1 / 16, warnMax: 1 / 6 }, sourceId: ME, note: '1/16 a 1/6' },
  feedwellDiameterRatio: { constraint: { warnMin: 0.15, warnMax: 0.2 }, sourceId: ME },
  feedwellDepth: { constraint: { warnMin: 1.0, warnMax: 2.5 }, sourceId: ME },
  diameter: { constraint: { warnMin: 3, warnMax: 60 }, sourceId: ME },
};

export const PROFILES: Record<DesignInput['profileId'], DesignProfile> = {
  didactic: {
    id: 'didactic',
    name: 'Escenario didáctico',
    purpose: 'Comprobación matemática del motor (spec §6.2). No es un diseño.',
    approval: 'DIDACTIC',
    hypotheses: [
      'La superficie se dimensiona solo con la carga superficial a caudal medio.',
      'No se aplican restricciones adicionales: el resto de comprobaciones de criterio quedan NOT_EVALUATED.',
      'El diámetro teórico no se redondea a incrementos constructivos.',
    ],
    criteria: {},
  },
  conceptual: {
    id: 'conceptual',
    name: 'Prediseño conceptual',
    purpose: 'Encaje inicial de dimensiones con rangos típicos de bibliografía.',
    approval: 'REFERENCE_RANGES',
    hypotheses: [
      'Los rangos bibliográficos se tratan como bandas orientativas: fuera de ellas se emite WARNING, nunca FAIL.',
      'La superficie se dimensiona con la mayor de las áreas requeridas a caudal medio y punta.',
      'Los valores de bibliografía están marcados TO_VERIFY hasta contrastarlos con la edición citada.',
    ],
    criteria: referenceRangesAsWarnings,
  },
  'preliminary-hydraulic': {
    id: 'preliminary-hydraulic',
    name: 'Diseño hidráulico preliminar',
    purpose: 'Diseño hidráulico con límites superiores tratados como obligatorios.',
    approval: 'REFERENCE_RANGES',
    hypotheses: [
      'Los máximos de carga superficial y de vertedero y el mínimo de TRH se tratan como límites duros (FAIL).',
      'Se contrasta la carga de vertedero con Ten States Standards (WARNING).',
      'Los valores de bibliografía están marcados TO_VERIFY.',
    ],
    criteria: {
      ...referenceRangesAsWarnings,
      surfaceLoadingAvg: { constraint: { max: 50 / 24, warnMin: 30 / 24 }, sourceId: ME, note: '30–50 m³/(m²·d)' },
      surfaceLoadingPeak: { constraint: { max: 120 / 24, warnMin: 80 / 24 }, sourceId: ME, note: '80–120 m³/(m²·d)' },
      hrtAvg: { constraint: { min: 1.5, warnMax: 2.5 }, sourceId: ME },
      weirLoadingPeak: {
        constraint: { max: 500, warnMax: 248 },
        sourceId: 'TEN-STATES-2014',
        note: 'Máximo 500 (M&E); banda recomendada ≤ 248 m³/(m·d) ≈ 20 000 gpd/ft para plantas ≤ 1 MGD (Ten States).',
      },
      walkwayClearWidth: { constraint: { min: 0.6, warnMin: 0.8 }, sourceId: 'EN-ISO-14122-2-2016' },
    },
  },
  'project-criteria': {
    id: 'project-criteria',
    name: 'Diseño basado en criterios de proyecto',
    purpose: 'Aplicar los criterios aprobados del proyecto (normativa local, pliego, UNE-EN 12255-4).',
    approval: 'REQUIRES_PROJECT_CRITERIA',
    hypotheses: [
      'El perfil no contiene criterios por defecto: deben introducirse en criteriaOverrides con su fuente.',
      'Sin criterios, las comprobaciones de criterio quedan NOT_EVALUATED.',
    ],
    criteria: {},
  },
  'existing-evaluation': {
    id: 'existing-evaluation',
    name: 'Evaluación de equipo existente',
    purpose: 'Comprobar una geometría fija frente a nuevas condiciones de operación (modo B).',
    approval: 'REFERENCE_RANGES',
    hypotheses: [
      'La geometría no se redimensiona.',
      'Se usan los mismos límites que el diseño hidráulico preliminar.',
    ],
    criteria: {
      surfaceLoadingAvg: { constraint: { max: 50 / 24, warnMin: 30 / 24 }, sourceId: ME },
      surfaceLoadingPeak: { constraint: { max: 120 / 24 }, sourceId: ME },
      hrtAvg: { constraint: { min: 1.5, warnMax: 2.5 }, sourceId: ME },
      weirLoadingPeak: { constraint: { max: 500, warnMax: 248 }, sourceId: 'TEN-STATES-2014' },
    },
  },
};

/** Criterios efectivos: perfil + overrides del usuario (con fuente obligatoria). */
export function resolveCriteria(input: DesignInput): Partial<Record<CriterionKey, Criterion>> {
  const profile = PROFILES[input.profileId];
  const out: Partial<Record<CriterionKey, Criterion>> = { ...profile.criteria };
  for (const [k, o] of Object.entries(input.criteriaOverrides)) {
    if (!(CRITERION_KEYS as readonly string[]).includes(k)) {
      throw new Error(`Criterio desconocido en criteriaOverrides: "${k}". Válidos: ${CRITERION_KEYS.join(', ')}`);
    }
    const { sourceId, note, ...constraint } = o;
    out[k as CriterionKey] = { constraint, sourceId, note };
  }
  return out;
}
