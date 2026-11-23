import { describe, expect, it } from 'vitest';
import { getReference } from '@eo/engineering-core';
import { listMaterials } from '../src/index.js';

describe('catálogo técnico de materiales', () => {
  it('cada material tiene densidad SI y fuentes catalogadas', () => {
    for (const m of listMaterials()) {
      expect(m.densityKgM3).toBeGreaterThan(500);
      for (const s of m.sources) expect(getReference(s), `${m.id} → ${s}`).toBeDefined();
      if (m.sources.length === 0) expect(m.notes, `${m.id} sin fuente debe justificar el dato`).toBeTruthy();
    }
  });
  it('no contiene propiedades de renderizado', () => {
    for (const m of listMaterials()) {
      const keys = Object.keys(m).join(',');
      expect(keys).not.toMatch(/color|metalness|roughness|texture/i);
    }
  });
});
