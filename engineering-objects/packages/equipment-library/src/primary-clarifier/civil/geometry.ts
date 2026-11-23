import { component, node, polar, revolve, ring, type ComponentGeometry, type Vec2 } from '@eo/geometry-engine';
import { floorElevation, type ResolvedModel } from '../definition/engine.js';
import type { DesignInput } from '../definition/schema.js';

/** Dirección del puente (eje Z): θ = −π/2 apunta a +Z, θ = +π/2 a −Z (convención de polar()). */
export const BRIDGE_THETAS = [-Math.PI / 2, Math.PI / 2] as const;
/** Azimut de la conducción de lodos. */
export const SLUDGE_THETA = Math.PI / 2;
/** Azimut de la salida de efluente. */
export const EFFLUENT_THETA = 0;

/** Vértices del fondo terminado de r = R hacia r = rp (incluye el quiebro en rs si existe). */
export function floorProfile(m: ResolvedModel): Vec2[] {
  const pts: Vec2[] = [[m.R, floorElevation(m, m.R)]];
  if (m.rSlopeStart < m.R - 1e-9) pts.push([m.rSlopeStart, 0]);
  pts.push([m.rSump, -m.sumpDrop]);
  return pts;
}

export function buildCivil(m: ResolvedModel, input: DesignInput): ComponentGeometry[] {
  const seg = m.segments;
  const conc = input.civil.concrete;
  const fill = input.civil.fillConcrete;

  const slab = component(
    'CIV-001',
    node('CIV-001.slab', 'Losa de cimentación (corona)', conc, ring(m.rSumpOuter, m.rSlab, m.ySlabBottom, m.ySlabTop, seg)),
  );

  const wall = component(
    'CIV-002',
    node('CIV-002.wall', 'Muro circular', conc, ring(m.R, m.rWallOuter, m.ySlabTop, m.H, seg)),
    [{ id: 'CIV-002.crest', componentId: 'CIV-002', position: polar(m.R, 0, m.H), matesWith: 'HYD-004.mount', description: 'Cara interior de coronación: apoyo de la chapa vertedero' }],
  );

  // Capa de formación de pendiente: entre la losa y el fondo terminado, de rp a R.
  const fillProfile: Vec2[] = [[m.rSump, m.ySlabTop], [m.R, m.ySlabTop], ...floorProfile(m)];
  const bottom = component('CIV-003', node('CIV-003.fill', 'Formación de pendiente (no estructural)', fill, revolve(fillProfile, { segments: seg })));

  // Bloque de la poceta: r ∈ [0, rp + ep], y ∈ [yPitBottom, ylosa], menos el hueco de la poceta.
  const pitProfile: Vec2[] = [
    [0, m.yPitBottom],
    [m.rSumpOuter, m.yPitBottom],
    [m.rSumpOuter, m.ySlabTop],
    [m.rSump, m.ySlabTop],
    [m.rSump, m.ySumpBottom],
    [0, m.ySumpBottom],
  ];
  const sump = component('CIV-004', node('CIV-004.pit', 'Poceta central de lodos', conc, revolve(pitProfile, { segments: seg })), [
    { id: 'CIV-004.outlet', componentId: 'CIV-004', position: polar(m.rSump, SLUDGE_THETA, m.ySludgeAxis), matesWith: 'HYD-006.inlet', description: 'Pasamuros de la conducción de lodos' },
  ]);

  const yChFloorBottom = m.yLaunderFloor - m.channelFloorThickness;
  const launder = component(
    'CIV-005',
    node('CIV-005', 'Canal perimetral', 'NONE', undefined, {
      children: [
        node('CIV-005.floor', 'Solera del canal', conc, ring(m.rWallOuter, m.rLaunderOuter, yChFloorBottom, m.yLaunderFloor, seg)),
        node('CIV-005.outerWall', 'Muro exterior del canal', conc, ring(m.rLaunderOuter, m.rChannelOuter, yChFloorBottom, m.yChannelTop, seg)),
      ],
    }),
    [
      {
        id: 'CIV-005.outlet',
        componentId: 'CIV-005',
        position: polar(m.rWallOuter + (m.rLaunderOuter - m.rWallOuter) / 2, EFFLUENT_THETA, yChFloorBottom),
        matesWith: 'HYD-005.inlet',
        description: 'Salida del canal al colector de efluente',
      },
      ...BRIDGE_THETAS.map((th, k) => ({
        id: `CIV-005.bearing-${k}`,
        componentId: 'CIV-005',
        position: polar(m.rBearing, th, m.yChannelTop),
        description: 'Apoyo del puente sobre la coronación del canal',
      })),
    ],
  );

  return [slab, wall, bottom, sump, launder];
}
