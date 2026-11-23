import * as THREE from 'three';
import { contentHash } from '@eo/engineering-core';
import type { Shape } from '@eo/geometry-engine';

/**
 * Pool de BufferGeometry con recuento de referencias: geometría idéntica se comparte
 * (p. ej. todas las paletas) y se libera de la GPU cuando nadie la usa.
 */
export class GeometryPool {
  private readonly entries = new Map<string, { geometry: THREE.BufferGeometry; refs: number }>();

  acquire(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
    const e = this.entries.get(key);
    if (e) {
      e.refs++;
      return e.geometry;
    }
    const geometry = make();
    geometry.userData.poolKey = key;
    this.entries.set(key, { geometry, refs: 1 });
    return geometry;
  }

  release(geometry: THREE.BufferGeometry): void {
    const key = geometry.userData.poolKey as string | undefined;
    if (!key) {
      geometry.dispose();
      return;
    }
    const e = this.entries.get(key);
    if (!e) return;
    if (--e.refs <= 0) {
      e.geometry.dispose();
      this.entries.delete(key);
    }
  }

  get size(): number {
    return this.entries.size;
  }

  dispose(): void {
    for (const e of this.entries.values()) e.geometry.dispose();
    this.entries.clear();
  }
}

/** Clave de reutilización: para vigas y tubos la geometría base solo depende de la sección y la longitud. */
export function shapeKey(s: Shape): string {
  const r = (x: number) => x.toFixed(6);
  switch (s.kind) {
    case 'beam': {
      const L = Math.hypot(s.end[0] - s.start[0], s.end[1] - s.start[1], s.end[2] - s.start[2]);
      return `beam:${r(s.width)}:${r(s.depth)}:${r(L)}`;
    }
    case 'box':
      return `box:${s.size.map(r).join(':')}`;
    case 'cylinder':
      return `cyl:${r(s.radiusTop)}:${r(s.radiusBottom)}:${r(s.height)}:${s.segments}`;
    default:
      return `${s.kind}:${contentHash(s)}`;
  }
}
