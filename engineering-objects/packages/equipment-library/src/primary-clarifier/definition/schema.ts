import { z } from 'zod';
import { MATERIAL_IDS, type MaterialId } from '@eo/material-library';

/**
 * Esquema de entradas de diseño del decantador primario circular.
 * Todas las dimensiones en m, pendientes en m/m, ángulos de entrada en grados (se convierten
 * explícitamente), caudales en L/s, cargas en m³/(m²·h) y m³/(m·d).
 */
export const SCHEMA_VERSION = '1.0.0';

const pos = z.number().finite().positive();
const nonNeg = z.number().finite().nonnegative();
const materialId = z.enum(MATERIAL_IDS as [MaterialId, ...MaterialId[]]);

/** Caudal punta por factor O directo, nunca ambos (spec §4.1). */
const peakSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('factor'), factor: z.number().finite().min(1) }).strict(),
  z.object({ method: z.literal('direct'), peakLps: pos }).strict(),
]);

export const criterionOverrideSchema = z.object({
  min: z.number().finite().optional(),
  max: z.number().finite().optional(),
  warnMin: z.number().finite().optional(),
  warnMax: z.number().finite().optional(),
  sourceId: z.string().min(1),
  note: z.string().min(1, 'Un criterio introducido debe justificar su origen'),
});

export const designInputSchema = z
  .object({
    tag: z.string().min(1),
    name: z.string().optional(),
    profileId: z.enum(['didactic', 'conceptual', 'preliminary-hydraulic', 'project-criteria', 'existing-evaluation']),

    flow: z.object({
      averageLps: pos,
      peak: peakSchema,
    }),

    /** Calidad del agua: se conserva como dato técnico; V1 no calcula eficiencias (spec §4.1). */
    influent: z
      .object({
        tssMgL: nonNeg.optional(),
        bod5MgL: nonNeg.optional(),
        temperatureC: z.number().finite().min(-5).max(60).optional(),
      })
      .default({}),

    /** Criterios de dimensionamiento elegidos por el proyectista. */
    designCriteria: z.object({
      /** CHS a caudal medio, m³/(m²·h). */
      surfaceLoadingAvgM_h: pos,
      /** CHS admisible a caudal punta, m³/(m²·h). Si falta, la punta no dimensiona superficie. */
      surfaceLoadingPeakM_h: pos.optional(),
      /** TRH objetivo mínimo a caudal medio, h. Si falta, el TRH se calcula pero no condiciona. */
      hrtTargetMinH: pos.optional(),
      /** Carga lineal máxima de vertedero, m³/(m·d), evaluada a caudal punta. */
      weirLoadingMaxM3_md: pos.optional(),
    }),

    /** Criterios adicionales con fuente (añadidos o más estrictos que los del perfil). */
    criteriaOverrides: z.record(z.string(), criterionOverrideSchema).default({}),

    geometry: z.object({
      /** Profundidad útil en pared: del fondo en pared (y = 0) a la cresta del vertedero. */
      sideWaterDepthM: pos,
      /** Incremento constructivo del diámetro; 0 = diámetro teórico sin redondear. */
      diameterRoundingStepM: nonNeg,
      minDiameterM: nonNeg.default(0),
      /** Diámetro impuesto por el usuario. Si es menor que el requerido, se informa FAIL. */
      adoptedDiameterM: pos.optional(),
      freeboardM: pos,
      floorSlope: pos.max(1),
      /** Radio donde empieza la pendiente; por defecto el radio interior. */
      slopeStartRadiusM: pos.optional(),
      sumpDiameterM: pos,
      sumpDepthM: pos,
      /**
       * Altura de diseño del manto de lodos sobre el fondo en pared (y = 0). Si se define, se descuenta
       * del volumen efectivo toda la zona por debajo de ella (tolva incluida). Sin definir: no se descuenta
       * y la comprobación del manto queda NOT_EVALUATED.
       */
      sludgeBlanketDepthM: nonNeg.optional(),
      /** Descontar del volumen efectivo el interior del pozo de alimentación. */
      excludeFeedwellFromEffectiveVolume: z.boolean().default(true),
    }),

    civil: z.object({
      wallThicknessM: pos,
      baseSlabThicknessM: pos,
      slabProjectionM: nonNeg,
      /** Espesor mínimo de la capa de formación de pendiente (no estructural). */
      minFillThicknessM: nonNeg,
      sumpWallThicknessM: pos,
      launderWidthM: pos,
      launderDepthM: pos,
      channelWallThicknessM: pos,
      channelFloorThicknessM: pos,
      concrete: materialId,
      fillConcrete: materialId,
      /** Los espesores son datos de partida hasta que un cálculo estructural los verifique. */
      thicknessStatus: z.enum(['PRELIMINARY_UNVERIFIED', 'STRUCTURALLY_VERIFIED']),
      structuralVerificationRef: z.string().optional(),
    }),

    hydraulics: z.object({
      inletMaxVelocityM_s: pos,
      inletMinVelocityM_s: pos,
      /** Velocidad máxima de salida por las ventanas de la columna central a caudal punta. */
      portMaxVelocityM_s: pos,
      columnPortCount: z.number().int().min(2).max(12),
      columnWallThicknessM: pos,
      feedwellDiameterRatio: pos.max(0.5),
      /** Diámetro mínimo constructivo del pozo (paso de la jaula giratoria y mantenimiento). */
      feedwellMinDiameterM: nonNeg.default(0),
      /** Profundidad del pozo de alimentación bajo la cresta. */
      feedwellDepthM: pos,
      feedwellPlateThicknessM: pos,
      effluentMaxVelocityM_s: pos,
      sludgePipeMinDn: z.number().int().positive(),
      sludgeDesignVelocityM_s: pos,
      /** Caudal de purga de lodos como fracción del caudal medio (solo para dimensionar la conducción). */
      sludgeFlowFraction: pos.max(0.2),
      pipeWallThicknessM: pos,
      vNotchAngleDeg: z.number().finite().gt(10).lt(120),
      notchSpacingM: pos,
      notchDepthM: pos,
      weirCd: z.number().finite().gt(0.4).lt(0.8),
      weirPlateThicknessM: pos,
      /** Longitud de vertedero no disponible (huecos, pasos de cables, cajas). */
      weirExclusionLengthM: nonNeg.default(0),
      launderFreeFallMinM: nonNeg,
      materials: z.object({
        plates: materialId,
        pipes: materialId,
      }),
    }),

    mechanical: z.object({
      bridgeType: z.enum(['full-span', 'radial']),
      bridgeWidthM: pos,
      bridgeGirderDepthM: pos,
      bridgeBearingHeightM: nonNeg,
      bridgeClearanceAboveWaterMinM: pos,
      armCount: z.union([z.literal(2), z.literal(4)]),
      armTrussDepthM: pos,
      armWallClearanceM: pos,
      bladeHeightM: pos,
      bladeFloorClearanceM: pos,
      bladeLengthM: pos,
      bladeAngleDeg: z.number().finite().min(0).max(60),
      cageHalfWidthM: pos,
      cageColumnClearanceM: pos,
      feedwellArmClearanceMinM: pos,
      skimmerClearanceM: pos,
      scumBaffleOffsetM: pos,
      scumBaffleDepthM: pos,
      scumBoxLengthM: pos,
      scumBoxWidthM: pos,
      walkwayClearWidthMinM: pos,
      driveFootprintM: pos,
      driveHeightM: pos,
      materials: z.object({
        bridge: materialId,
        mechanism: materialId,
        submerged: materialId,
        wipers: materialId,
      }),
    }),

    site: z
      .object({
        /** Cota del terreno en el sistema local (y). Sin ella no se mide excavación. */
        groundLevelM: z.number().finite().optional(),
        excavationWorkingSpaceM: nonNeg.default(0.5),
        /** Nivel freático (y). Sin él no se evalúa flotación. */
        groundwaterLevelM: z.number().finite().optional(),
      })
      .default({}),

    meshResolution: z.object({ circularSegments: z.number().int().min(16).max(512) }).default({ circularSegments: 96 }),
  })
  .strict();

export type DesignInput = z.infer<typeof designInputSchema>;
export type DesignInputRaw = z.input<typeof designInputSchema>;
export type CriterionOverride = z.infer<typeof criterionOverrideSchema>;

export type DeepPartial<T> = T extends readonly (infer U)[]
  ? readonly DeepPartial<U>[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export class InputValidationError extends Error {
  override name = 'InputValidationError';
  constructor(readonly issues: { path: string; message: string }[]) {
    super('Entradas de diseño no válidas:\n' + issues.map((i) => `  - ${i.path}: ${i.message}`).join('\n'));
  }
}

/** Nivel 1 — Datos: valida tipos, unidades implícitas, signos y obligatoriedad. Nunca corrige. */
export function parseDesignInput(raw: unknown): DesignInput {
  const r = designInputSchema.safeParse(raw);
  if (!r.success) {
    throw new InputValidationError(r.error.issues.map((i) => ({ path: i.path.join('.') || '(raíz)', message: i.message })));
  }
  return r.data;
}
