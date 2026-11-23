import { z } from 'zod';
import { MATERIAL_IDS, type MaterialId } from '@eo/material-library';
import { criterionOverrideSchema, designInputSchema, InputValidationError } from '../primary-clarifier/definition/schema.js';

/**
 * Entradas del clarifloculador circular: floculación mecánica en una cámara central y
 * sedimentación en la corona exterior. Reutiliza los bloques comunes del tanque circular
 * (caudal, geometría, obra civil, mecánica del rascador, emplazamiento) del decantador primario.
 */
export const CLF_SCHEMA_VERSION = '1.0.0';

const pos = z.number().finite().positive();
const nonNeg = z.number().finite().nonnegative();
const materialId = z.enum(MATERIAL_IDS as [MaterialId, ...MaterialId[]]);
const base = designInputSchema.shape;

export const clfInputSchema = z
  .object({
    tag: z.string().min(1),
    name: z.string().optional(),
    profileId: z.enum(['didactic', 'water-reference', 'project-criteria']),
    flow: base.flow,
    influent: z
      .object({
        tssMgL: nonNeg.optional(),
        turbidityNtu: nonNeg.optional(),
        temperatureC: z.number().finite().min(-5).max(60).optional(),
      })
      .default({}),

    /** Criterios de la zona de sedimentación (corona exterior a la cámara de floculación). */
    designCriteria: z.object({
      /** Carga superficial admisible a caudal medio sobre la superficie ANULAR, m³/(m²·h). */
      settlingLoadingAvgM_h: pos,
      settlingLoadingPeakM_h: pos.optional(),
      hrtTargetMinH: pos.optional(),
      weirLoadingMaxM3_md: pos.optional(),
    }),
    criteriaOverrides: z.record(z.string(), criterionOverrideSchema).default({}),

    flocculation: z.object({
      /** Caudal con el que se dimensiona el volumen de floculación. */
      designFlow: z.enum(['average', 'peak']),
      /** Tiempo de floculación de diseño, min. */
      detentionTimeMin: pos,
      /** Profundidad de la cámara bajo la cresta del vertedero, m. */
      chamberDepthM: pos,
      chamberWallThicknessM: pos,
      /** Diámetro interior mínimo constructivo de la cámara, m. */
      chamberMinInnerDiameterM: nonNeg.default(0),
      /** Gradiente de velocidad de diseño G, s⁻¹. */
      velocityGradientS: pos,
      /** Temperatura de diseño del agua (viscosidad), °C. Explícita: la mínima de invierno suele gobernar. */
      designTemperatureC: z.number().finite().min(0).max(40),
      paddles: z.object({
        /** Velocidad periférica de diseño de la paleta más exterior, m/s. */
        tipSpeedM_s: pos,
        /** Velocidad relativa agua–paleta / velocidad de la paleta (hipótesis habitual 0,75). */
        relativeVelocityFactor: z.number().finite().gt(0).max(1),
        /** Coeficiente de arrastre de la paleta (depende de su esbeltez). */
        dragCoefficient: pos,
        armCount: z.number().int().min(2).max(8),
        bladeWidthM: pos,
        /** Altura de paleta como fracción de la profundidad de la cámara. */
        bladeHeightRatio: z.number().finite().gt(0).max(0.9),
        /** Holgura entre la paleta exterior y la pared de la cámara, m. */
        wallClearanceM: pos,
        /** Holgura entre el tubo de giro de las paletas y la jaula del rascador, m. */
        sleeveClearanceM: pos,
        sleeveWallThicknessM: pos,
        bladeThicknessM: pos,
        /** Máximo de anillos de paletas por brazo que se admiten antes de declarar FAIL. */
        maxRings: z.number().int().min(1).max(12),
      }),
      drive: z.object({ footprintM: pos, heightM: pos }),
      materials: z.object({ chamber: materialId, paddles: materialId }),
    }),

    geometry: base.geometry.omit({ excludeFeedwellFromEffectiveVolume: true }),
    civil: base.civil,
    hydraulics: base.hydraulics.omit({
      feedwellDiameterRatio: true,
      feedwellMinDiameterM: true,
      feedwellDepthM: true,
      feedwellPlateThicknessM: true,
    }),
    mechanical: base.mechanical,
    site: base.site,
    meshResolution: base.meshResolution,
  })
  .strict();

export type ClfInput = z.infer<typeof clfInputSchema>;
export type ClfInputRaw = z.input<typeof clfInputSchema>;

/** Nivel 1 — Datos. */
export function parseClfInput(raw: unknown): ClfInput {
  const r = clfInputSchema.safeParse(raw);
  if (!r.success) {
    throw new InputValidationError(r.error.issues.map((i) => ({ path: i.path.join('.') || '(raíz)', message: i.message })));
  }
  return r.data;
}
