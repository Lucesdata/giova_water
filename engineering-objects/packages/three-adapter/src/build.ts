import * as THREE from 'three';
import type { BeamShape, ComponentGeometry, GeometryNode, PipeShape, Shape, Vec3 } from '@eo/geometry-engine';
import { GeometryPool, shapeKey } from './geometryPool.js';
import type { RenderMaterialLibrary } from './renderMaterials.js';

const v3 = (p: Vec3) => new THREE.Vector3(p[0], p[1], p[2]);

/** Orienta un objeto cuyo eje local Z debe ir de `a` a `b`, con su Y próximo a `up`. */
function orientAlong(obj: THREE.Object3D, a: Vec3, b: Vec3, up: Vec3 = [0, 1, 0]): void {
  const A = v3(a);
  const B = v3(b);
  const dir = B.clone().sub(A).normalize();
  let u = v3(up);
  if (Math.abs(u.dot(dir)) > 0.999) u = new THREE.Vector3(1, 0, 0);
  const yAxis = u.clone().sub(dir.clone().multiplyScalar(u.dot(dir))).normalize();
  const xAxis = new THREE.Vector3().crossVectors(yAxis, dir).normalize();
  obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, dir));
  obj.position.copy(A.add(B).multiplyScalar(0.5));
}

function makeGeometry(s: Shape): THREE.BufferGeometry {
  switch (s.kind) {
    case 'revolve': {
      const pts = [...s.profile, s.profile[0]!].map(([r, y]) => new THREE.Vector2(r, y));
      const g = new THREE.LatheGeometry(pts, s.segments, s.thetaStart, s.thetaLength);
      g.computeVertexNormals();
      return g;
    }
    case 'box':
      return new THREE.BoxGeometry(s.size[0], s.size[1], s.size[2]);
    case 'cylinder':
      return new THREE.CylinderGeometry(s.radiusTop, s.radiusBottom, s.height, s.segments);
    case 'beam': {
      const L = Math.hypot(s.end[0] - s.start[0], s.end[1] - s.start[1], s.end[2] - s.start[2]);
      return new THREE.BoxGeometry(s.width, s.depth, L);
    }
    case 'pipe':
      throw new Error('Las tuberías se construyen por tramos');
  }
}

export interface BuildContext {
  readonly pool: GeometryPool;
  readonly materials: RenderMaterialLibrary;
}

function meshFor(n: GeometryNode, s: Exclude<Shape, PipeShape>, ctx: BuildContext): THREE.Mesh {
  const geometry = ctx.pool.acquire(shapeKey(s), () => makeGeometry(s));
  const material = n.role === 'marker' ? ctx.materials.markerMaterial() : ctx.materials.get(n.materialId);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.materialId = n.materialId;
  mesh.userData.marker = n.role === 'marker';
  mesh.castShadow = n.role !== 'marker';
  mesh.receiveShadow = true;
  if (s.kind === 'beam') orientAlong(mesh, s.start, s.end, (s as BeamShape).up);
  return mesh;
}

function pipeGroup(n: GeometryNode, s: PipeShape, ctx: BuildContext): THREE.Group {
  const g = new THREE.Group();
  for (let i = 1; i < s.path.length; i++) {
    const a = s.path[i - 1]!;
    const b = s.path[i]!;
    const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const geometry = ctx.pool.acquire(`pipe:${s.outerRadius.toFixed(6)}:${L.toFixed(6)}:${s.segments}`, () => {
      const c = new THREE.CylinderGeometry(s.outerRadius, s.outerRadius, L, s.segments, 1, false);
      c.rotateX(Math.PI / 2); // eje del cilindro → Z local
      return c;
    });
    const mesh = new THREE.Mesh(geometry, ctx.materials.get(n.materialId));
    mesh.userData.materialId = n.materialId;
    mesh.castShadow = true;
    orientAlong(mesh, a, b);
    g.add(mesh);
    if (i < s.path.length - 1) {
      const jg = ctx.pool.acquire(`joint:${s.outerRadius.toFixed(6)}`, () => new THREE.SphereGeometry(s.outerRadius, 16, 12));
      const j = new THREE.Mesh(jg, ctx.materials.get(n.materialId));
      j.userData.materialId = n.materialId;
      j.position.copy(v3(b));
      g.add(j);
    }
  }
  return g;
}

export function buildNode(n: GeometryNode, ctx: BuildContext): THREE.Object3D {
  let obj: THREE.Object3D;
  if (n.shape?.kind === 'pipe') obj = pipeGroup(n, n.shape, ctx);
  else if (n.shape) {
    const mesh = meshFor(n, n.shape, ctx);
    // las vigas ya llevan su posición/orientación; las demás formas usan la transformación del nodo
    if (n.shape.kind === 'beam') {
      const holder = new THREE.Group();
      holder.add(mesh);
      obj = holder;
    } else obj = mesh;
  } else obj = new THREE.Group();
  obj.position.set(n.transform.position[0], n.transform.position[1], n.transform.position[2]);
  obj.rotation.y = n.transform.rotationY;
  obj.name = n.id;
  obj.userData.nodeId = n.id;
  obj.userData.label = n.label;
  for (const c of n.children) obj.add(buildNode(c, ctx));
  return obj;
}

export function buildComponent(c: ComponentGeometry, ctx: BuildContext): THREE.Object3D {
  const obj = buildNode(c.root, ctx);
  obj.userData.componentId = c.componentId;
  obj.userData.hash = c.hash;
  obj.traverse((o) => {
    o.userData.componentId = c.componentId;
  });
  return obj;
}

/** Libera las geometrías de un subárbol (los materiales son compartidos y no se liberan aquí). */
export function releaseObject(obj: THREE.Object3D, pool: GeometryPool): void {
  obj.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) pool.release((o as THREE.Mesh).geometry);
  });
  obj.removeFromParent();
}
