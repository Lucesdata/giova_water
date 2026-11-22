import { describe, expect, it } from 'vitest';
import { beam, box, checkConnections, component, cylinder, diffAssemblies, measureNode, node, nodeBounds, pipe, polar, revolve, ring, shapeVolume, type Assembly } from '../src/index.js';

describe('volúmenes exactos', () => {
  it('anillo de revolución = π(R²−r²)h', () => {
    expect(shapeVolume(ring(2, 2.3, 0, 3))).toBeCloseTo(Math.PI * (2.3 ** 2 - 4) * 3, 10);
  });
  it('cono por Pappus = πr²h/3', () => {
    expect(shapeVolume(revolve([[0, 0], [1.5, 0], [0, 2]]))).toBeCloseTo((Math.PI * 1.5 ** 2 * 2) / 3, 10);
  });
  it('el volumen no depende de la resolución de malla', () => {
    expect(shapeVolume(ring(1, 2, 0, 1, 16))).toBe(shapeVolume(ring(1, 2, 0, 1, 512)));
  });
  it('caja, cilindro, tubo y viga', () => {
    expect(shapeVolume(box(1, 2, 3))).toBe(6);
    expect(shapeVolume(cylinder(1, 2))).toBeCloseTo(2 * Math.PI, 10);
    expect(shapeVolume(pipe([[0, 0, 0], [3, 0, 0], [3, 4, 0]], 0.1, 0.09))).toBeCloseTo(Math.PI * (0.01 - 0.0081) * 7, 10);
    expect(shapeVolume(beam([0, 0, 0], [0, 0, 2], 0.1, 0.2))).toBeCloseTo(0.04, 12);
  });
  it('rechaza geometría degenerada', () => {
    expect(() => ring(2, 1, 0, 1)).toThrow();
    expect(() => revolve([[0, 0], [1, 0]])).toThrow();
  });
});

describe('ensamblajes', () => {
  const mk = (r: number): Assembly => ({
    objectId: 'X',
    transform: { position: [0, 0, 0], rotationY: 0 },
    components: [
      component('A', node('A', 'a', 'M', ring(r, r + 0.3, 0, 1)), [{ id: 'A.p', componentId: 'A', position: polar(r, 0, 1), matesWith: 'B.p', description: '' }]),
      component('B', node('B', 'b', 'M', box(1, 1, 1)), [{ id: 'B.p', componentId: 'B', position: polar(2, 0, 1), description: '' }]),
    ],
  });
  it('diffAssemblies identifica solo los componentes cambiados', () => {
    const d = diffAssemblies(mk(2), mk(2.5));
    expect(d.changed).toEqual(['A']);
    expect(d.unchanged).toEqual(['B']);
    expect(diffAssemblies(undefined, mk(2)).added).toEqual(['A', 'B']);
  });
  it('checkConnections detecta conexiones abiertas', () => {
    expect(checkConnections(mk(2)).every((c) => c.ok)).toBe(true);
    expect(checkConnections(mk(2.5)).some((c) => !c.ok)).toBe(true);
  });
  it('los marcadores no se miden y los límites se calculan', () => {
    const n = node('G', 'g', 'NONE', undefined, { children: [node('s', 's', 'M', box(1, 1, 1)), node('m', 'm', 'NONE', box(5, 5, 5), { role: 'marker' })] });
    expect(measureNode(n)).toHaveLength(1);
    const b = nodeBounds(node('r', 'r', 'M', ring(1, 2, 0, 3)));
    expect(b?.max[1]).toBe(3);
    expect(b?.max[0]).toBeCloseTo(2, 10);
  });
});
