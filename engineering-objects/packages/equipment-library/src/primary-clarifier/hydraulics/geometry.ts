import { beam, box, component, node, pipe, polar, ring, type ComponentGeometry, type ConnectionPoint, type GeometryNode } from '@eo/geometry-engine';
import type { ResolvedModel } from '../definition/engine.js';
import type { DesignInput } from '../definition/schema.js';
import { EFFLUENT_THETA, SLUDGE_THETA } from '../civil/geometry.js';

/** Reglas de modelado de los deflectores (no son criterios hidráulicos). */
export const DEFLECTOR_RULES = { offsetToPortWidth: 0.5, widthToPortWidth: 1.5, heightToPortHeight: 1.5 } as const;

export function portAngles(m: ResolvedModel): number[] {
  return Array.from({ length: m.portCount }, (_, k) => (k * 2 * Math.PI) / m.portCount);
}

export function deflectorLayout(m: ResolvedModel) {
  const radius = m.rColumnOuter + DEFLECTOR_RULES.offsetToPortWidth * m.portWidth;
  const width = DEFLECTOR_RULES.widthToPortWidth * m.portWidth;
  const height = DEFLECTOR_RULES.heightToPortHeight * m.portHeight;
  const thickness = m.weirPlateThickness;
  const outerCornerRadius = Math.hypot(radius + thickness / 2, width / 2);
  return { radius, width, height, thickness, outerCornerRadius };
}

export function feedwellHangerThetas(m: ResolvedModel): number[] {
  return m.bridgeType === 'full-span' ? [-Math.PI / 2, Math.PI / 2] : [-Math.PI / 2];
}

export function buildHydraulics(m: ResolvedModel, input: DesignInput): ComponentGeometry[] {
  const seg = m.segments;
  const plates = input.hydraulics.materials.plates;
  const pipes = input.hydraulics.materials.pipes;
  const pipeSeg = Math.max(16, Math.round(seg / 4));

  // HYD-001 — tubería de entrada enterrada + columna central con ventanas
  const xIn = -(m.rSlab + 1.0);
  const rInOuter = m.inletDnM / 2 + m.pipeWall;
  const inlet = component(
    'HYD-001',
    node('HYD-001', 'Entrada', 'NONE', undefined, {
      children: [
        node('HYD-001.buried', 'Tubería de entrada enterrada', pipes, pipe([[xIn, m.yInletAxis, 0], [0, m.yInletAxis, 0]], rInOuter, m.inletDnM / 2, pipeSeg)),
        node('HYD-001.column', 'Columna central de alimentación', plates, ring(m.rColumnInner, m.rColumnOuter, m.yInletAxis, m.yColumnTop, pipeSeg)),
        ...portAngles(m).map((th, k) =>
          node(`HYD-001.port-${k}`, `Ventana ${k + 1}`, 'NONE', box(m.rColumnOuter - m.rColumnInner + 0.004, m.portHeight, m.portWidth), {
            role: 'marker',
            transform: { position: polar((m.rColumnInner + m.rColumnOuter) / 2, th, m.yPortCenter), rotationY: th },
          }),
        ),
      ],
    }),
    [
      { id: 'HYD-001.flange', componentId: 'HYD-001', position: [xIn, m.yInletAxis, 0], direction: [-1, 0, 0], description: 'Brida de conexión con la conducción de llegada' },
      { id: 'HYD-001.ports', componentId: 'HYD-001', position: [0, m.yPortCenter, 0], matesWith: 'HYD-002.inlet', description: 'Centro de la zona de ventanas' },
      { id: 'HYD-001.column-top', componentId: 'HYD-001', position: [0, m.yColumnTop, 0], description: 'Cabeza de la columna central' },
    ],
  );

  // HYD-002 — pozo de alimentación (colgado del puente)
  const fwChildren: GeometryNode[] = [
    node('HYD-002.shell', 'Virola del pozo de alimentación', plates, ring(m.rFeedwellInner, m.rFeedwellOuter, m.yFeedwellBottom, m.yFeedwellTop, seg)),
  ];
  const fwConnections: ConnectionPoint[] = [
    { id: 'HYD-002.inlet', componentId: 'HYD-002', position: [0, m.yPortCenter, 0], description: 'Entrada desde la columna' },
  ];
  feedwellHangerThetas(m).forEach((th, k) => {
    const bottom = polar(m.rFeedwellOuter, th, m.yFeedwellTop);
    const top = polar(m.rFeedwellOuter, th, m.yGirderBottom);
    fwChildren.push(node(`HYD-002.hanger-${k}`, `Cuelgue ${k + 1}`, input.mechanical.materials.bridge, beam(bottom, top, 0.05, 0.05), { section: 'representational' }));
    fwConnections.push({ id: `HYD-002.hanger-${k}`, componentId: 'HYD-002', position: top, matesWith: `MEC-001.hanger-${k}`, description: 'Cuelgue al puente' });
  });
  if (m.bridgeType === 'radial') {
    for (const th of [0, Math.PI]) {
      const a = polar(m.rColumnOuter, th, m.yFeedwellTop - 0.05);
      const b = polar(m.rFeedwellInner, th, m.yFeedwellTop - 0.05);
      fwChildren.push(node(`HYD-002.bracket-${th === 0 ? 0 : 1}`, 'Ménsula a columna', input.mechanical.materials.bridge, beam(a, b, 0.05, 0.05), { section: 'representational' }));
    }
  }
  const feedwell = component('HYD-002', node('HYD-002', 'Pozo de alimentación', 'NONE', undefined, { children: fwChildren }), fwConnections);

  // HYD-003 — deflectores frente a cada ventana
  const dl = deflectorLayout(m);
  const deflectors = component(
    'HYD-003',
    node('HYD-003', 'Deflectores', 'NONE', undefined, {
      children: portAngles(m).map((th, k) =>
        node(`HYD-003.plate-${k}`, `Deflector ${k + 1}`, plates, box(dl.thickness, dl.height, dl.width), {
          transform: { position: polar(dl.radius, th, m.yPortCenter), rotationY: th },
        }),
      ),
    }),
  );

  // HYD-004 — chapa vertedero en la cara interior del muro
  const weir = component(
    'HYD-004',
    node('HYD-004.plate', `Chapa vertedero (${m.notchCount} escotaduras en V)`, plates, ring(m.R - m.weirPlateThickness, m.R, m.H - 0.15, m.H + m.notchDepth + 0.02, seg)),
    [{ id: 'HYD-004.mount', componentId: 'HYD-004', position: polar(m.R, 0, m.H), description: 'Fijación a la coronación del muro' }],
  );

  // HYD-005 — colector de efluente
  const rOut = m.rWallOuter + (m.rLaunderOuter - m.rWallOuter) / 2;
  const effStart = polar(rOut, EFFLUENT_THETA, m.yLaunderFloor - m.channelFloorThickness);
  const effluent = component(
    'HYD-005',
    node('HYD-005.pipe', 'Colector de efluente', pipes, pipe([effStart, polar(rOut, EFFLUENT_THETA, m.yEffluentAxis), polar(m.rChannelOuter + 1.5, EFFLUENT_THETA, m.yEffluentAxis)], m.effluentDnM / 2 + m.pipeWall, m.effluentDnM / 2, pipeSeg)),
    [
      { id: 'HYD-005.inlet', componentId: 'HYD-005', position: effStart, description: 'Embocadura en la solera del canal' },
      { id: 'HYD-005.outlet', componentId: 'HYD-005', position: polar(m.rChannelOuter + 1.5, EFFLUENT_THETA, m.yEffluentAxis), description: 'Conexión aguas abajo' },
    ],
  );

  // HYD-006 — conducción de lodos desde la poceta
  const sStart = polar(m.rSump, SLUDGE_THETA, m.ySludgeAxis);
  const sEnd = polar(m.rSlab + 1.5, SLUDGE_THETA, m.ySludgeAxis);
  const sludge = component('HYD-006', node('HYD-006.pipe', 'Conducción de lodos', pipes, pipe([sStart, sEnd], m.sludgeDnM / 2 + m.pipeWall, m.sludgeDnM / 2, pipeSeg)), [
    { id: 'HYD-006.inlet', componentId: 'HYD-006', position: sStart, description: 'Toma en la poceta' },
    { id: 'HYD-006.outlet', componentId: 'HYD-006', position: sEnd, description: 'Conexión a bombeo / purga' },
  ]);

  return [inlet, feedwell, deflectors, weir, effluent, sludge];
}
