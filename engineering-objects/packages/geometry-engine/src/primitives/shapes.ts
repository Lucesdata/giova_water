/**
 * Descriptores geométricos neutros. Son datos (serializables, comparables, hashables):
 * el adaptador de render decide cómo convertirlos en mallas.
 *
 * Sistema local (spec §3.2): Y vertical positivo, plano XZ horizontal, metros, radianes.
 * Los sólidos de revolución giran alrededor del eje Y; el perfil se da en (r, y).
 */
export type Vec2 = readonly [number, number];
export type Vec3 = readonly [number, number, number];

/** Sólido de revolución: polígono cerrado en el semiplano r ≥ 0 girado alrededor de Y. */
export interface RevolveShape {
  readonly kind: 'revolve';
  /** Vértices (r, y) del polígono cerrado, sin repetir el primero al final. */
  readonly profile: readonly Vec2[];
  readonly thetaStart: number;
  readonly thetaLength: number;
  /** Indicación de resolución angular para el render (no afecta a las mediciones). */
  readonly segments: number;
}

/** Caja centrada en el origen local. */
export interface BoxShape {
  readonly kind: 'box';
  readonly size: Vec3;
}

/** Tronco de cono / cilindro de eje Y centrado en el origen local. */
export interface CylinderShape {
  readonly kind: 'cylinder';
  readonly radiusTop: number;
  readonly radiusBottom: number;
  readonly height: number;
  readonly segments: number;
}

/** Tubería hueca a lo largo de una poligonal. */
export interface PipeShape {
  readonly kind: 'pipe';
  readonly path: readonly Vec3[];
  readonly outerRadius: number;
  readonly innerRadius: number;
  readonly segments: number;
}

/** Viga de sección rectangular entre dos puntos. `up` orienta la altura de la sección. */
export interface BeamShape {
  readonly kind: 'beam';
  readonly start: Vec3;
  readonly end: Vec3;
  /** Ancho (horizontal, perpendicular al eje) y canto (según `up`). */
  readonly width: number;
  readonly depth: number;
  readonly up: Vec3;
}

export type Shape = RevolveShape | BoxShape | CylinderShape | PipeShape | BeamShape;

export const TAU = Math.PI * 2;

export function revolve(profile: readonly Vec2[], opts: { thetaStart?: number; thetaLength?: number; segments?: number } = {}): RevolveShape {
  if (profile.length < 3) throw new Error('Un perfil de revolución necesita al menos 3 vértices');
  for (const [r] of profile) if (r < -1e-12) throw new Error(`Perfil de revolución con r < 0: ${r}`);
  return {
    kind: 'revolve',
    profile: profile.map(([r, y]) => [Math.max(0, r), y] as const),
    thetaStart: opts.thetaStart ?? 0,
    thetaLength: opts.thetaLength ?? TAU,
    segments: opts.segments ?? 96,
  };
}

/** Anillo rectangular (corona) entre radios y cotas: el caso más común en obra civil circular. */
export function ring(rInner: number, rOuter: number, yBottom: number, yTop: number, segments = 96): RevolveShape {
  if (!(rOuter > rInner) || !(yTop > yBottom)) {
    throw new Error(`Anillo degenerado r=[${rInner}, ${rOuter}] y=[${yBottom}, ${yTop}]`);
  }
  return revolve(
    [
      [rInner, yBottom],
      [rOuter, yBottom],
      [rOuter, yTop],
      [rInner, yTop],
    ],
    { segments },
  );
}

export function box(x: number, y: number, z: number): BoxShape {
  return { kind: 'box', size: [x, y, z] };
}

export function cylinder(radius: number, height: number, segments = 48, radiusTop = radius): CylinderShape {
  return { kind: 'cylinder', radiusTop, radiusBottom: radius, height, segments };
}

export function pipe(path: readonly Vec3[], outerRadius: number, innerRadius: number, segments = 24): PipeShape {
  if (path.length < 2) throw new Error('Una tubería necesita al menos 2 puntos');
  if (!(outerRadius > innerRadius && innerRadius >= 0)) throw new Error('Radios de tubería inválidos');
  return { kind: 'pipe', path, outerRadius, innerRadius, segments };
}

export function beam(start: Vec3, end: Vec3, width: number, depth: number, up: Vec3 = [0, 1, 0]): BeamShape {
  return { kind: 'beam', start, end, width, depth, up };
}
