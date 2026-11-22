import type { Shape, Vec2, Vec3 } from '../primitives/shapes.js';
import { TAU } from '../primitives/shapes.js';
import { dist } from '../primitives/vec.js';
import { applyTransform, walk, type Assembly, type GeometryNode, type Transform } from '../assemblies/assembly.js';

/** ∫∫ r dA sobre el polígono (r, y): Pappus-Guldin. */
function firstMomentAboutAxis(profile: readonly Vec2[]): number {
  let s = 0;
  for (let i = 0; i < profile.length; i++) {
    const [r0, y0] = profile[i]!;
    const [r1, y1] = profile[(i + 1) % profile.length]!;
    const cross = r0 * y1 - r1 * y0;
    s += (r0 + r1) * cross;
  }
  return Math.abs(s / 6);
}

export function polygonArea(profile: readonly Vec2[]): number {
  let s = 0;
  for (let i = 0; i < profile.length; i++) {
    const [r0, y0] = profile[i]!;
    const [r1, y1] = profile[(i + 1) % profile.length]!;
    s += r0 * y1 - r1 * y0;
  }
  return Math.abs(s / 2);
}

/** Volumen exacto de la forma (independiente de la resolución de malla). */
export function shapeVolume(s: Shape): number {
  switch (s.kind) {
    case 'revolve':
      return firstMomentAboutAxis(s.profile) * s.thetaLength;
    case 'box':
      return s.size[0] * s.size[1] * s.size[2];
    case 'cylinder':
      return (Math.PI * s.height * (s.radiusTop ** 2 + s.radiusTop * s.radiusBottom + s.radiusBottom ** 2)) / 3;
    case 'pipe':
      return Math.PI * (s.outerRadius ** 2 - s.innerRadius ** 2) * pathLength(s.path);
    case 'beam':
      return s.width * s.depth * dist(s.start, s.end);
  }
}

export function pathLength(path: readonly Vec3[]): number {
  let l = 0;
  for (let i = 1; i < path.length; i++) l += dist(path[i - 1]!, path[i]!);
  return l;
}

/** Superficie generada al girar un segmento (r,y)→(r,y) un ángulo θ (área de revolución). */
export function revolvedSegmentArea(a: Vec2, b: Vec2, theta = TAU): number {
  const slant = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return theta * ((a[0] + b[0]) / 2) * slant;
}

/** Superficie exterior aproximada de piezas lineales (para protección anticorrosiva). */
export function shapeOuterSurface(s: Shape): number | undefined {
  switch (s.kind) {
    case 'pipe':
      return TAU * s.outerRadius * pathLength(s.path);
    case 'beam':
      return 2 * (s.width + s.depth) * dist(s.start, s.end);
    case 'box':
      return 2 * (s.size[0] * s.size[1] + s.size[1] * s.size[2] + s.size[0] * s.size[2]);
    case 'cylinder': {
      const slant = Math.hypot(s.height, s.radiusBottom - s.radiusTop);
      return Math.PI * (s.radiusTop + s.radiusBottom) * slant + Math.PI * (s.radiusTop ** 2 + s.radiusBottom ** 2);
    }
    case 'revolve': {
      let a = 0;
      for (let i = 0; i < s.profile.length; i++) a += revolvedSegmentArea(s.profile[i]!, s.profile[(i + 1) % s.profile.length]!, s.thetaLength);
      return a;
    }
  }
}

/** Longitud característica de piezas lineales. */
export function shapeLength(s: Shape): number | undefined {
  if (s.kind === 'pipe') return pathLength(s.path);
  if (s.kind === 'beam') return dist(s.start, s.end);
  return undefined;
}

export interface AABB {
  readonly min: Vec3;
  readonly max: Vec3;
}

/** Puntos representativos de la forma en coordenadas locales (para límites). */
function samplePoints(s: Shape): Vec3[] {
  switch (s.kind) {
    case 'revolve': {
      const pts: Vec3[] = [];
      const n = 16;
      for (let k = 0; k <= n; k++) {
        const th = s.thetaStart + (s.thetaLength * k) / n;
        for (const [r, y] of s.profile) pts.push([r * Math.sin(th), y, r * Math.cos(th)]);
      }
      return pts;
    }
    case 'box': {
      const [x, y, z] = s.size.map((v) => v / 2) as unknown as [number, number, number];
      const pts: Vec3[] = [];
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pts.push([sx * x, sy * y, sz * z]);
      return pts;
    }
    case 'cylinder': {
      const r = Math.max(s.radiusTop, s.radiusBottom);
      return [
        [-r, -s.height / 2, -r],
        [r, s.height / 2, r],
      ];
    }
    case 'pipe':
    case 'beam': {
      const ends = s.kind === 'pipe' ? s.path : [s.start, s.end];
      const r = s.kind === 'pipe' ? s.outerRadius : Math.hypot(s.width, s.depth) / 2;
      const pts: Vec3[] = [];
      for (const p of ends) {
        pts.push([p[0] - r, p[1] - r, p[2] - r], [p[0] + r, p[1] + r, p[2] + r]);
      }
      return pts;
    }
  }
}

export function nodeBounds(root: GeometryNode, parent?: Transform): AABB | undefined {
  let min: [number, number, number] = [Infinity, Infinity, Infinity];
  let max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  let any = false;
  walk(
    root,
    (n, world) => {
      if (!n.shape) return;
      for (const p of samplePoints(n.shape)) {
        const w = applyTransform(world, p);
        any = true;
        for (let i = 0; i < 3; i++) {
          min[i] = Math.min(min[i]!, w[i]!);
          max[i] = Math.max(max[i]!, w[i]!);
        }
      }
    },
    parent,
  );
  return any ? { min, max } : undefined;
}

export interface NodeMeasurement {
  readonly nodeId: string;
  readonly label: string;
  readonly materialId: string;
  readonly section: GeometryNode['section'];
  /** Volumen geométrico de la forma modelada. Con sección representativa no es volumen de material. */
  readonly volumeM3: number;
  readonly lengthM?: number;
  readonly outerSurfaceM2?: number;
}

/** Mediciones de todos los nodos con forma de un componente. */
export function measureNode(root: GeometryNode): NodeMeasurement[] {
  const out: NodeMeasurement[] = [];
  walk(root, (n) => {
    if (!n.shape || n.role === 'marker') return;
    out.push({
      nodeId: n.id,
      label: n.label,
      materialId: n.materialId,
      section: n.section,
      volumeM3: shapeVolume(n.shape),
      lengthM: shapeLength(n.shape),
      outerSurfaceM2: shapeOuterSurface(n.shape),
    });
  });
  return out;
}

export function measureAssembly(a: Assembly): Record<string, NodeMeasurement[]> {
  return Object.fromEntries(a.components.map((c) => [c.componentId, measureNode(c.root)]));
}

