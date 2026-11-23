import * as THREE from 'three';
import { diffAssemblies, type Assembly, type AssemblyDiff } from '@eo/geometry-engine';
import { buildComponent, releaseObject, type BuildContext } from './build.js';
import { GeometryPool } from './geometryPool.js';
import { RenderMaterialLibrary } from './renderMaterials.js';

/**
 * Sincroniza un ensamblaje de ingeniería con una escena Three.js (spec §10.2):
 * 1) detecta componentes cambiados por hash, 2) reconstruye solo esos, 3) libera la GPU de lo sustituido.
 * El estado de ingeniería y el de render están separados: esta clase solo recibe ensamblajes.
 */
export class SceneSync {
  readonly root = new THREE.Group();
  readonly pool = new GeometryPool();
  readonly materials: RenderMaterialLibrary;
  private current?: Assembly;
  private readonly objects = new Map<string, THREE.Object3D>();
  private highlighted: string | null = null;
  private isolated: ReadonlySet<string> | null = null;

  constructor(materials?: RenderMaterialLibrary) {
    this.materials = materials ?? new RenderMaterialLibrary();
    this.root.name = 'engineering-object';
  }

  private get ctx(): BuildContext {
    return { pool: this.pool, materials: this.materials };
  }

  sync(next: Assembly): AssemblyDiff {
    const diff = diffAssemblies(this.current, next);
    for (const id of [...diff.removed, ...diff.changed]) {
      const o = this.objects.get(id);
      if (o) releaseObject(o, this.pool);
      this.objects.delete(id);
    }
    for (const c of next.components) {
      if (diff.added.includes(c.componentId) || diff.changed.includes(c.componentId)) {
        const o = buildComponent(c, this.ctx);
        this.objects.set(c.componentId, o);
        this.root.add(o);
      }
    }
    this.root.position.set(next.transform.position[0], next.transform.position[1], next.transform.position[2]);
    this.root.rotation.y = next.transform.rotationY;
    this.current = next;
    this.applyStyles();
    return diff;
  }

  getObject(componentId: string): THREE.Object3D | undefined {
    return this.objects.get(componentId);
  }

  setHighlighted(componentId: string | null): void {
    this.highlighted = componentId;
    this.applyStyles();
  }

  /** Aislar componentes: solo se muestran los indicados (null = todos). */
  setIsolated(componentIds: Iterable<string> | null): void {
    this.isolated = componentIds ? new Set(componentIds) : null;
    this.applyStyles();
  }

  setVisible(componentId: string, visible: boolean): void {
    const o = this.objects.get(componentId);
    if (o) o.visible = visible;
  }

  private applyStyles(): void {
    for (const [id, o] of this.objects) {
      o.visible = this.isolated ? this.isolated.has(id) : true;
      const hl = id === this.highlighted;
      o.traverse((x) => {
        const mesh = x as THREE.Mesh;
        if (!mesh.isMesh || mesh.userData.marker) return;
        mesh.material = this.materials.get(mesh.userData.materialId as string, hl);
      });
    }
  }

  dispose(): void {
    for (const o of this.objects.values()) releaseObject(o, this.pool);
    this.objects.clear();
    this.pool.dispose();
    this.materials.dispose();
    this.current = undefined;
  }
}
