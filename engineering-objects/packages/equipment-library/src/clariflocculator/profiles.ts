import type { UnitId } from '@eo/engineering-core';
import { CRITERION_KEYS, CRITERION_META, mergeCriterion, type Criterion, type CriterionKey } from '../primary-clarifier/definition/profiles.js';
import type { ProfileInfo } from '../primary-clarifier/definition/design.js';
import type { ClfInput } from './schema.js';

/** Criterios propios de la floculación mecánica. */
export const CLF_OWN_CRITERION_KEYS = ['flocculationTime', 'velocityGradient', 'gtProduct', 'paddleTipSpeed', 'paddleAreaRatio'] as const;
export type ClfOwnCriterionKey = (typeof CLF_OWN_CRITERION_KEYS)[number];
export type ClfCriterionKey = CriterionKey | ClfOwnCriterionKey;
export const CLF_CRITERION_KEYS: readonly ClfCriterionKey[] = [...CRITERION_KEYS, ...CLF_OWN_CRITERION_KEYS];

export const CLF_CRITERION_META: Record<ClfCriterionKey, { label: string; unit: UnitId }> = {
  ...CRITERION_META,
  surfaceLoadingAvg: { label: 'Carga superficial sobre la zona de sedimentación a caudal medio', unit: 'm3/(m2.h)' },
  surfaceLoadingPeak: { label: 'Carga superficial sobre la zona de sedimentación a caudal punta', unit: 'm3/(m2.h)' },
  hrtAvg: { label: 'Tiempo de retención en la zona de sedimentación a caudal medio', unit: 'h' },
  flocculationTime: { label: 'Tiempo de floculación al caudal de diseño', unit: 'min' },
  velocityGradient: { label: 'Gradiente de velocidad G suministrado', unit: '1/s' },
  gtProduct: { label: 'Producto Gt', unit: '-' },
  paddleTipSpeed: { label: 'Velocidad periférica de las paletas', unit: 'm/s' },
  paddleAreaRatio: { label: 'Área de paletas / sección vertical de la cámara', unit: '-' },
};

export interface ClfProfile extends ProfileInfo {
  readonly id: ClfInput['profileId'];
  readonly criteria: Partial<Record<ClfCriterionKey, Criterion>>;
}

export const CLF_PROFILES: Record<ClfInput['profileId'], ClfProfile> = {
  didactic: {
    id: 'didactic',
    name: 'Escenario didáctico',
    purpose: 'Ejercitar el motor del clarifloculador sin criterios externos. No es un diseño.',
    approval: 'DIDACTIC',
    hypotheses: [
      'La cámara se dimensiona con el tiempo de floculación y la zona de sedimentación con la carga superficial adoptadas.',
      'Sin criterios de perfil: las comprobaciones de criterio quedan NOT_EVALUATED.',
    ],
    criteria: {},
  },
  'water-reference': {
    id: 'water-reference',
    name: 'Potabilización: rangos de referencia',
    purpose: 'Agua coagulada en potabilización, con rangos de bibliografía y normas de referencia.',
    approval: 'REFERENCE_RANGES',
    hypotheses: [
      'La carga superficial se evalúa sobre la corona de sedimentación (superficie total menos la cámara de floculación).',
      'El tiempo de floculación mínimo y la velocidad periférica de las paletas se tratan como límites duros (Ten States, agua).',
      'G y Gt se tratan como bandas recomendadas (WARNING fuera de ellas).',
      'Todos los valores de bibliografía están marcados TO_VERIFY hasta contrastarlos con la edición citada.',
    ],
    criteria: {
      surfaceLoadingAvg: { constraint: { warnMin: 1.0, warnMax: 2.4 }, sourceId: 'ONTARIO-DWS-2008', note: 'Sedimentación convencional 1,0–2,4 m/h' },
      flocculationTime: { constraint: { min: 30 }, sourceId: 'TEN-STATES-WATER-2018', note: 'Detención mínima de 30 min' },
      paddleTipSpeed: { constraint: { min: 0.15, max: 0.91 }, sourceId: 'TEN-STATES-WATER-2018', note: '0,5–3,0 ft/s' },
      velocityGradient: { constraint: { warnMin: 10, warnMax: 75 }, sourceId: 'MWH-2012', note: 'Rango típico de floculación' },
      gtProduct: { constraint: { warnMin: 1e4, warnMax: 1e5 }, sourceId: 'MWH-2012', note: 'Rango típico de Gt' },
      walkwayClearWidth: { constraint: { min: 0.6, warnMin: 0.8 }, sourceId: 'EN-ISO-14122-2-2016' },
    },
  },
  'project-criteria': {
    id: 'project-criteria',
    name: 'Diseño basado en criterios de proyecto',
    purpose: 'Aplicar los criterios aprobados del proyecto.',
    approval: 'REQUIRES_PROJECT_CRITERIA',
    hypotheses: ['El perfil no contiene criterios por defecto: deben introducirse en criteriaOverrides con su fuente.'],
    criteria: {},
  },
};

/** Criterios efectivos: perfil + overrides (que añaden o endurecen, nunca relajan). */
export function resolveClfCriteria(input: ClfInput): Partial<Record<ClfCriterionKey, Criterion>> {
  const profile = CLF_PROFILES[input.profileId];
  const out: Partial<Record<ClfCriterionKey, Criterion>> = { ...profile.criteria };
  for (const [k, o] of Object.entries(input.criteriaOverrides)) {
    if (!(CLF_CRITERION_KEYS as readonly string[]).includes(k)) {
      throw new Error(`Criterio desconocido en criteriaOverrides: "${k}". Válidos: ${CLF_CRITERION_KEYS.join(', ')}`);
    }
    const { sourceId, note, ...constraint } = o;
    out[k as ClfCriterionKey] = mergeCriterion(k, profile.criteria[k as ClfCriterionKey], { constraint, sourceId, note });
  }
  return out;
}

/** Subconjunto con clave del motor circular común. */
export function engineCriteriaOf(criteria: Partial<Record<ClfCriterionKey, Criterion>>): Partial<Record<CriterionKey, Criterion>> {
  const out: Partial<Record<CriterionKey, Criterion>> = {};
  for (const k of CRITERION_KEYS) if (criteria[k]) out[k] = criteria[k];
  return out;
}
