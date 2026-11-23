import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { DEC_005_DIDACTIC, createBaseVariant, createVariant, designClarifier, regenerate } from '@eo/equipment-library';
import { SceneSync } from '../src/index.js';

describe('SceneSync', () => {
  it('construye un objeto por componente y la malla del muro coincide con el diámetro calculado', () => {
    const d = designClarifier(DEC_005_DIDACTIC);
    const s = new SceneSync();
    const diff = s.sync(d.assembly);
    expect(diff.added).toHaveLength(17);
    const wall = s.getObject('CIV-002')!;
    const box = new THREE.Box3().setFromObject(wall);
    expect(box.max.x - box.min.x).toBeCloseTo(2 * (d.model.R + 0.3), 2);
    expect(box.max.y).toBeCloseTo(d.model.H, 9);
    s.dispose();
  });

  it('solo reconstruye los componentes cambiados y libera la GPU de los sustituidos', () => {
    const s = new SceneSync();
    const a = designClarifier(DEC_005_DIDACTIC);
    s.sync(a.assembly);
    const untouched = s.getObject('CIV-002');
    const oldSludge = s.getObject('HYD-006') as THREE.Object3D;
    const oldGeoms: THREE.BufferGeometry[] = [];
    oldSludge.traverse((o) => (o as THREE.Mesh).isMesh && oldGeoms.push((o as THREE.Mesh).geometry));
    let disposed = 0;
    for (const g of oldGeoms) g.addEventListener('dispose', () => disposed++);

    const b = designClarifier({ ...DEC_005_DIDACTIC, hydraulics: { ...DEC_005_DIDACTIC.hydraulics, sludgePipeMinDn: 200 } });
    const diff = s.sync(b.assembly);
    expect(diff.changed.sort()).toEqual(['CIV-004', 'HYD-006']);
    expect(s.getObject('CIV-002')).toBe(untouched);
    expect(s.getObject('HYD-006')).not.toBe(oldSludge);
    expect(disposed).toBe(oldGeoms.length);
    s.dispose();
    expect(s.pool.size).toBe(0);
  });

  it('comparte geometría idéntica entre paletas de igual sección y longitud', () => {
    const s = new SceneSync();
    s.sync(designClarifier(DEC_005_DIDACTIC).assembly);
    const geoms = new Set<THREE.BufferGeometry>();
    let meshes = 0;
    s.getObject('MEC-005')!.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        meshes++;
        geoms.add((o as THREE.Mesh).geometry);
      }
    });
    // Las paletas sobre pendiente uniforme comparten malla; solo difieren las que cruzan el quiebro de la poceta.
    expect(meshes).toBeGreaterThanOrEqual(8);
    expect(geoms.size).toBeLessThanOrEqual(meshes / 2);
    s.dispose();
  });

  it('cambiar de 5 a 10 L/s regenera el modelo sin alterar el original', () => {
    const v5 = createBaseVariant(DEC_005_DIDACTIC, { createdAt: 'x' });
    const v10 = createVariant(v5, { tag: 'DEC-010', flow: { averageLps: 10 } }, { createdAt: 'x' });
    const s5 = new SceneSync();
    const s10 = new SceneSync();
    s5.sync(regenerate(v5).assembly);
    s10.sync(regenerate(v10).assembly);
    const w5 = new THREE.Box3().setFromObject(s5.getObject('CIV-002')!);
    const w10 = new THREE.Box3().setFromObject(s10.getObject('CIV-002')!);
    expect(w10.max.x).toBeGreaterThan(w5.max.x);
    expect(v5.calculatedOutputs.values['tank.diameter']!.value).toBeCloseTo(3.9088, 4);
    s5.dispose();
    s10.dispose();
  });
});
