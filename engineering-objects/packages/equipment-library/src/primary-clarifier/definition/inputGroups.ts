import type { ResizeGroup } from './engine.js';

/**
 * Entradas que definen DIRECTAMENTE geometría instalada (no a través de una decisión de
 * dimensionamiento) y el grupo de redimensionamiento que debe estar permitido para cambiarlas.
 *
 * Criterios, hipótesis de cálculo, materiales y condiciones de operación no aparecen aquí: cambiarlos
 * no altera dimensiones instaladas (si la decisión correspondiente está bloqueada, solo cambia la
 * comprobación). Los modos B y C usan esta tabla para impedir cambios geométricos en grupos bloqueados.
 */
const GEOMETRY_INPUTS: Record<string, readonly ResizeGroup[]> = {
  'geometry.sideWaterDepthM': ['tank'],
  'geometry.freeboardM': ['tank'],
  'geometry.floorSlope': ['tank'],
  'geometry.slopeStartRadiusM': ['tank'],
  'geometry.sumpDiameterM': ['tank'],
  'geometry.sumpDepthM': ['tank'],
  'geometry.adoptedDiameterM': ['tank'],
  'geometry.diameterRoundingStepM': ['tank'],
  'geometry.minDiameterM': ['tank'],
  'civil.wallThicknessM': ['tank'],
  'civil.baseSlabThicknessM': ['tank'],
  'civil.slabProjectionM': ['tank'],
  'civil.minFillThicknessM': ['tank'],
  'civil.sumpWallThicknessM': ['tank'],
  'civil.launderWidthM': ['tank'],
  'civil.launderDepthM': ['tank'],
  'civil.channelWallThicknessM': ['tank'],
  'civil.channelFloorThicknessM': ['tank'],
  'hydraulics.columnPortCount': ['inlet'],
  'hydraulics.columnWallThicknessM': ['inlet'],
  'hydraulics.feedwellDepthM': ['feedwell'],
  'hydraulics.feedwellPlateThicknessM': ['feedwell'],
  'hydraulics.notchDepthM': ['weir'],
  'hydraulics.weirPlateThicknessM': ['weir'],
  'hydraulics.vNotchAngleDeg': ['weir'],
  'hydraulics.pipeWallThicknessM': ['inlet', 'effluent', 'sludge'],
};

/** Prefijos de entradas mecánicas geométricas (todo `mechanical.*` salvo los materiales). */
const MECHANICAL_PREFIX = 'mechanical.';
const MECHANICAL_EXEMPT_PREFIX = 'mechanical.materials.';
/** Límites mecánicos que solo intervienen en comprobaciones: no definen dimensiones instaladas. */
const CHECK_ONLY_INPUTS = new Set([
  'mechanical.bridgeClearanceAboveWaterMinM',
  'mechanical.walkwayClearWidthMinM',
  'mechanical.feedwellArmClearanceMinM',
  'mechanical.cageColumnClearanceM',
]);

export function groupsRequiredFor(path: string): readonly ResizeGroup[] {
  const direct = GEOMETRY_INPUTS[path];
  if (direct) return direct;
  if (CHECK_ONLY_INPUTS.has(path)) return [];
  if (path.startsWith(MECHANICAL_PREFIX) && !path.startsWith(MECHANICAL_EXEMPT_PREFIX)) return ['mechanical'];
  return [];
}

/** Rutas de hoja cuyo valor difiere entre dos entradas (incluye campos añadidos o eliminados). */
export function changedPaths(a: unknown, b: unknown, prefix = ''): string[] {
  const isObj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
  if (isObj(a) && isObj(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].sort().flatMap((k) => changedPaths(a[k], b[k], prefix ? `${prefix}.${k}` : k));
  }
  return JSON.stringify(a) === JSON.stringify(b) ? [] : [prefix];
}

/** Cambios geométricos que exigirían un grupo no permitido. */
export function blockedChanges(before: unknown, after: unknown, allowed: ReadonlySet<ResizeGroup>): { path: string; groups: readonly ResizeGroup[] }[] {
  return changedPaths(before, after)
    .map((path) => ({ path, groups: groupsRequiredFor(path) }))
    .filter((c) => c.groups.some((g) => !allowed.has(g)));
}
