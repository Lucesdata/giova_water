/**
 * Catálogo de componentes (spec §3.1). Los identificadores son contrato público:
 * no se renombran sin migración.
 */
export const COMPONENTS = {
  'CIV-001': { name: 'Losa de cimentación', discipline: 'civil' },
  'CIV-002': { name: 'Muro circular', discipline: 'civil' },
  'CIV-003': { name: 'Fondo con pendiente', discipline: 'civil' },
  'CIV-004': { name: 'Poceta central de lodos', discipline: 'civil' },
  'CIV-005': { name: 'Canal perimetral', discipline: 'civil' },
  'HYD-001': { name: 'Tubería de entrada y columna central', discipline: 'hydraulic' },
  'HYD-002': { name: 'Pozo central de alimentación', discipline: 'hydraulic' },
  'HYD-003': { name: 'Deflectores de distribución', discipline: 'hydraulic' },
  'HYD-004': { name: 'Vertedero de salida', discipline: 'hydraulic' },
  'HYD-005': { name: 'Colector de efluente', discipline: 'hydraulic' },
  'HYD-006': { name: 'Conducción de lodos', discipline: 'hydraulic' },
  'MEC-001': { name: 'Puente de soporte', discipline: 'mechanical' },
  'MEC-002': { name: 'Accionamiento mecánico', discipline: 'mechanical' },
  'MEC-003': { name: 'Mecanismo giratorio', discipline: 'mechanical' },
  'MEC-004': { name: 'Brazos portarrasquetas', discipline: 'mechanical' },
  'MEC-005': { name: 'Paletas de barrido', discipline: 'mechanical' },
  'MEC-006': { name: 'Sistema de retirada de flotantes', discipline: 'mechanical' },
} as const;

export type ComponentId = keyof typeof COMPONENTS;
export type Discipline = (typeof COMPONENTS)[ComponentId]['discipline'];
export const COMPONENT_IDS = Object.keys(COMPONENTS) as ComponentId[];

/**
 * Dependencias de cada componente respecto a entradas (prefijo input.) y decisiones de
 * dimensionamiento (prefijo decision.). Es el inventario del spec §6.3 en forma ejecutable;
 * specs/parameter-inventory.md lo documenta.
 */
export const COMPONENT_DEPENDENCIES: Record<ComponentId, readonly string[]> = {
  'CIV-001': ['decision.diameterM', 'input.civil.wallThicknessM', 'input.civil.baseSlabThicknessM', 'input.civil.slabProjectionM', 'input.civil.minFillThicknessM', 'input.geometry.floorSlope', 'input.geometry.sumpDiameterM'],
  'CIV-002': ['decision.diameterM', 'decision.sideWaterDepthM', 'input.civil.wallThicknessM', 'input.civil.minFillThicknessM', 'input.geometry.floorSlope'],
  'CIV-003': ['decision.diameterM', 'input.geometry.floorSlope', 'input.geometry.slopeStartRadiusM', 'input.geometry.sumpDiameterM', 'input.civil.minFillThicknessM'],
  'CIV-004': ['input.geometry.sumpDiameterM', 'input.geometry.sumpDepthM', 'input.civil.sumpWallThicknessM', 'input.geometry.floorSlope', 'decision.diameterM'],
  'CIV-005': ['decision.diameterM', 'decision.sideWaterDepthM', 'input.civil.launderWidthM', 'input.civil.launderDepthM', 'input.civil.channelWallThicknessM', 'input.civil.channelFloorThicknessM', 'input.geometry.freeboardM'],
  'HYD-001': ['decision.inletDn', 'decision.portHeightM', 'input.hydraulics.columnPortCount', 'decision.diameterM'],
  'HYD-002': ['decision.feedwellDiameterM', 'input.hydraulics.feedwellMinDiameterM', 'input.hydraulics.feedwellDepthM', 'decision.sideWaterDepthM'],
  'HYD-003': ['decision.inletDn', 'decision.portHeightM', 'input.hydraulics.columnPortCount'],
  'HYD-004': ['decision.diameterM', 'decision.notchCount', 'input.hydraulics.notchDepthM', 'decision.sideWaterDepthM'],
  'HYD-005': ['decision.effluentDn', 'decision.diameterM', 'input.civil.launderWidthM'],
  'HYD-006': ['decision.sludgeDn', 'input.geometry.sumpDiameterM', 'input.geometry.sumpDepthM', 'decision.diameterM'],
  'MEC-001': ['input.mechanical.bridgeType', 'decision.diameterM', 'input.mechanical.bridgeWidthM', 'input.geometry.freeboardM'],
  'MEC-002': ['input.mechanical.driveFootprintM', 'input.mechanical.driveHeightM', 'input.mechanical.bridgeType'],
  'MEC-003': ['decision.inletDn', 'input.mechanical.cageHalfWidthM', 'decision.sideWaterDepthM'],
  'MEC-004': ['decision.diameterM', 'input.geometry.floorSlope', 'input.mechanical.armCount', 'input.mechanical.armTrussDepthM'],
  'MEC-005': ['decision.diameterM', 'input.geometry.floorSlope', 'input.mechanical.bladeLengthM', 'input.mechanical.bladeFloorClearanceM'],
  'MEC-006': ['decision.diameterM', 'decision.feedwellDiameterM', 'input.mechanical.scumBaffleOffsetM'],
};
