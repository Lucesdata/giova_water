import type { DesignInputRaw } from '../definition/schema.js';

/**
 * Configuraciones de referencia.
 *
 * IMPORTANTE: los valores de este archivo son DATOS DE PARTIDA del proyectista para ejercitar el
 * motor, no criterios normativos. Los espesores estructurales están marcados como no verificados
 * y las capacidades mecánicas no se dimensionan. Cada valor con trasfondo técnico lleva comentario.
 */
export const DEC_005_DIDACTIC: DesignInputRaw = {
  tag: 'DEC-005',
  name: 'Decantador primario 5 L/s — escenario didáctico',
  profileId: 'didactic',
  flow: {
    averageLps: 5,
    // Factor de punta de ejemplo para comprobar conducciones y vertedero; no dimensiona superficie en este perfil.
    peak: { method: 'factor', factor: 2.5 },
  },
  influent: { tssMgL: 250, bod5MgL: 220, temperatureC: 15 },
  designCriteria: {
    // Spec §6.2: CHS = 1,5 m/h, sin restricciones adicionales.
    surfaceLoadingAvgM_h: 1.5,
  },
  criteriaOverrides: {},
  geometry: {
    sideWaterDepthM: 3.0,
    diameterRoundingStepM: 0, // diámetro teórico, sin redondeo (comprobación matemática)
    minDiameterM: 0,
    freeboardM: 0.5,
    floorSlope: 1 / 12,
    sumpDiameterM: 0.8,
    sumpDepthM: 0.6,
    excludeFeedwellFromEffectiveVolume: true,
  },
  civil: {
    // Espesores de partida SIN verificar: deben sustituirse por los del cálculo estructural.
    wallThicknessM: 0.3,
    baseSlabThicknessM: 0.35,
    slabProjectionM: 0.3,
    minFillThicknessM: 0.1,
    sumpWallThicknessM: 0.25,
    launderWidthM: 0.4,
    launderDepthM: 0.35,
    channelWallThicknessM: 0.2,
    channelFloorThicknessM: 0.2,
    concrete: 'CONC-C30/37-XC4-XA1',
    fillConcrete: 'CONC-C20/25-FILL',
    thicknessStatus: 'PRELIMINARY_UNVERIFIED',
  },
  hydraulics: {
    inletMaxVelocityM_s: 1.5, // criterio del proyectista
    inletMinVelocityM_s: 0.5, // criterio del proyectista (autolimpieza)
    portMaxVelocityM_s: 0.3, // criterio del proyectista (disipación en el pozo)
    columnPortCount: 4,
    columnWallThicknessM: 0.008,
    feedwellDiameterRatio: 0.18,
    feedwellMinDiameterM: 1.0, // mínimo constructivo para alojar la jaula giratoria
    feedwellDepthM: 1.0,
    feedwellPlateThicknessM: 0.005,
    effluentMaxVelocityM_s: 1.5,
    sludgePipeMinDn: 150, // criterio del proyectista; Ten States fija 6 in (TO_VERIFY)
    sludgeDesignVelocityM_s: 1.0,
    sludgeFlowFraction: 0.01, // hipótesis de prediseño: purga ≈ 1 % de Qmed
    pipeWallThicknessM: 0.008,
    vNotchAngleDeg: 90,
    notchSpacingM: 0.2,
    notchDepthM: 0.05,
    weirCd: 0.58, // ISO 1438, escotadura de 90° (TO_VERIFY)
    weirPlateThicknessM: 0.005,
    weirExclusionLengthM: 0,
    launderFreeFallMinM: 0.05,
    materials: { plates: 'SS-1.4301', pipes: 'PE-HD-PE100' },
  },
  mechanical: {
    bridgeType: 'full-span', // decisión explícita: el tipo de apoyo no se infiere del diámetro
    bridgeWidthM: 0.8,
    bridgeGirderDepthM: 0.3, // representativo, sin dimensionar
    bridgeBearingHeightM: 0.1,
    bridgeClearanceAboveWaterMinM: 0.3,
    armCount: 2,
    armTrussDepthM: 0.4,
    armWallClearanceM: 0.05,
    bladeHeightM: 0.3,
    bladeFloorClearanceM: 0.03,
    bladeLengthM: 0.6,
    bladeAngleDeg: 30,
    cageHalfWidthM: 0.22,
    cageColumnClearanceM: 0.05,
    feedwellArmClearanceMinM: 0.3,
    skimmerClearanceM: 0.1,
    scumBaffleOffsetM: 0.3,
    scumBaffleDepthM: 0.3,
    scumBoxLengthM: 0.3,
    scumBoxWidthM: 0.4,
    walkwayClearWidthMinM: 0.6,
    driveFootprintM: 0.8,
    driveHeightM: 0.7,
    materials: { bridge: 'STEEL-S275JR-HDG', mechanism: 'STEEL-S275JR-HDG', submerged: 'SS-1.4301', wipers: 'EPDM-WIPER' },
  },
  site: {},
  meshResolution: { circularSegments: 96 },
};

/** Variante de prediseño conceptual con criterios de punta, TRH y vertedero y diámetro redondeado. */
export const DEC_005_CONCEPTUAL: DesignInputRaw = {
  ...DEC_005_DIDACTIC,
  tag: 'DEC-005-CONC',
  name: 'Decantador primario 5 L/s — prediseño conceptual',
  profileId: 'conceptual',
  designCriteria: {
    surfaceLoadingAvgM_h: 1.5,
    surfaceLoadingPeakM_h: 4.0,
    hrtTargetMinH: 1.5,
    weirLoadingMaxM3_md: 250,
  },
  geometry: { ...DEC_005_DIDACTIC.geometry, diameterRoundingStepM: 0.1 },
  site: { groundLevelM: 3.2, excavationWorkingSpaceM: 0.5 },
};
