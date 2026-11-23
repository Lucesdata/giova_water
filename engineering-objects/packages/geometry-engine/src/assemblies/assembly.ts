import { contentHash } from '@eo/engineering-core';
import type { Shape, Vec3 } from '../primitives/shapes.js';
import { add, dist, rotateY } from '../primitives/vec.js';

/** Transformación local: traslación + rotación alrededor de Y (suficiente para equipos de eje vertical). */
export interface Transform {
  readonly position: Vec3;
  readonly rotationY: number;
}

export const IDENTITY: Transform = { position: [0, 0, 0], rotationY: 0 };

export interface GeometryNode {
  readonly id: string;
  readonly label: string;
  /** Material técnico (id del catálogo); el adaptador lo traduce a material visual. */
  readonly materialId: string;
  readonly shape?: Shape;
  readonly transform: Transform;
  readonly children: readonly GeometryNode[];
  /**
   * solid: pieza física (se mide). marker: indicación visual (huecos, ventanas), no se mide.
   */
  readonly role: 'solid' | 'marker';
  /**
   * real: la sección modelada es la real (chapas, tubos, hormigón) → volumen y masa válidos.
   * representational: sección esquemática (celosías, perfiles sin dimensionar) → solo longitudes.
   */
  readonly section: 'real' | 'representational';
  /** Pieza que gira con el mecanismo (eje Y del objeto). */
  readonly moving: boolean;
}

export interface NodeOptions {
  transform?: Transform;
  children?: GeometryNode[];
  role?: GeometryNode['role'];
  section?: GeometryNode['section'];
  moving?: boolean;
}

/** Punto de conexión de un componente (spec §8). */
export interface ConnectionPoint {
  readonly id: string;
  readonly componentId: string;
  /** Coordenadas en el sistema local del objeto. */
  readonly position: Vec3;
  /** Dirección de salida (unitaria) si aplica. */
  readonly direction?: Vec3;
  /** Punto con el que debe coincidir. */
  readonly matesWith?: string;
  readonly description: string;
}

export interface ComponentGeometry {
  readonly componentId: string;
  readonly root: GeometryNode;
  readonly connections: readonly ConnectionPoint[];
  /** Hash del contenido geométrico: igual hash ⇒ no hace falta regenerar la malla. */
  readonly hash: string;
}

export interface Assembly {
  readonly objectId: string;
  readonly transform: Transform;
  readonly components: readonly ComponentGeometry[];
}

export function node(id: string, label: string, materialId: string, shape?: Shape, opts: NodeOptions = {}): GeometryNode {
  return {
    id,
    label,
    materialId,
    shape,
    transform: opts.transform ?? IDENTITY,
    children: opts.children ?? [],
    role: opts.role ?? 'solid',
    section: opts.section ?? 'real',
    moving: opts.moving ?? false,
  };
}

export function group(id: string, label: string, children: GeometryNode[], opts: Omit<NodeOptions, 'children'> = {}): GeometryNode {
  return node(id, label, 'NONE', undefined, { ...opts, children });
}

export function component(componentId: string, root: GeometryNode, connections: ConnectionPoint[] = []): ComponentGeometry {
  return { componentId, root, connections, hash: contentHash({ root, connections }) };
}

export function applyTransform(t: Transform, p: Vec3): Vec3 {
  return add(rotateY(p, t.rotationY), t.position);
}

export function composeTransforms(parent: Transform, child: Transform): Transform {
  return {
    position: applyTransform(parent, child.position),
    rotationY: parent.rotationY + child.rotationY,
  };
}

/** Recorre los nodos con su transformación acumulada. */
export function walk(root: GeometryNode, visit: (n: GeometryNode, world: Transform) => void, parent: Transform = IDENTITY): void {
  const world = composeTransforms(parent, root.transform);
  visit(root, world);
  for (const c of root.children) walk(c, visit, world);
}

export interface AssemblyDiff {
  readonly added: string[];
  readonly removed: string[];
  readonly changed: string[];
  readonly unchanged: string[];
}

/** Qué componentes hay que regenerar entre dos ensamblajes (spec §10.2, paso 1). */
export function diffAssemblies(prev: Assembly | undefined, next: Assembly): AssemblyDiff {
  const before = new Map(prev?.components.map((c) => [c.componentId, c.hash]) ?? []);
  const after = new Map(next.components.map((c) => [c.componentId, c.hash]));
  const out: AssemblyDiff = { added: [], removed: [], changed: [], unchanged: [] };
  for (const [id, h] of after) {
    if (!before.has(id)) out.added.push(id);
    else if (before.get(id) !== h) out.changed.push(id);
    else out.unchanged.push(id);
  }
  for (const id of before.keys()) if (!after.has(id)) out.removed.push(id);
  return out;
}

export interface ConnectionCheck {
  readonly from: string;
  readonly to: string;
  readonly gap: number;
  readonly ok: boolean;
}

/** Verifica que cada punto con `matesWith` coincide con su pareja dentro de la tolerancia. */
export function checkConnections(assembly: Assembly, tolerance = 1e-6): ConnectionCheck[] {
  const all = new Map<string, ConnectionPoint>();
  for (const c of assembly.components) for (const p of c.connections) all.set(p.id, p);
  const out: ConnectionCheck[] = [];
  for (const p of all.values()) {
    if (!p.matesWith) continue;
    const q = all.get(p.matesWith);
    if (!q) {
      out.push({ from: p.id, to: p.matesWith, gap: Number.POSITIVE_INFINITY, ok: false });
      continue;
    }
    const gap = dist(p.position, q.position);
    out.push({ from: p.id, to: q.id, gap, ok: gap <= tolerance });
  }
  return out;
}
