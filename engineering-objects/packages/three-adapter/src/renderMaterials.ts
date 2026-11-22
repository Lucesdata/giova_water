import * as THREE from 'three';

/**
 * Aspecto visual por material técnico. Esto es SOLO apariencia: la especificación del material
 * vive en @eo/material-library y no se deduce de aquí.
 */
type Look = { color: number; metalness: number; roughness: number; opacity?: number };
const LOOK: Record<string, Look> = {
  'CONC-C30/37-XC4-XA1': { color: 0xb9b6ae, metalness: 0, roughness: 0.92 },
  'CONC-C20/25-FILL': { color: 0x9c978c, metalness: 0, roughness: 0.95 },
  'STEEL-S275JR-HDG': { color: 0x8f969b, metalness: 0.55, roughness: 0.55 },
  'SS-1.4301': { color: 0xc7ccd0, metalness: 0.75, roughness: 0.32 },
  'SS-1.4404': { color: 0xcfd4d8, metalness: 0.75, roughness: 0.3 },
  'PE-HD-PE100': { color: 0x2b2f33, metalness: 0, roughness: 0.6 },
  'EPDM-WIPER': { color: 0x1d1d1d, metalness: 0, roughness: 0.85 },
  NONE: { color: 0x3a7bd5, metalness: 0, roughness: 0.6, opacity: 0.6 },
};
const FALLBACK: Look = { color: 0xff00ff, metalness: 0, roughness: 0.5 };

/** Biblioteca de materiales compartidos: una instancia por material técnico y estado. */
export class RenderMaterialLibrary {
  private readonly base = new Map<string, THREE.MeshStandardMaterial>();
  private readonly highlight = new Map<string, THREE.MeshStandardMaterial>();
  private readonly marker: THREE.MeshBasicMaterial;
  private clipping: THREE.Plane[] = [];

  constructor() {
    this.marker = new THREE.MeshBasicMaterial({ color: 0x0b1f33, side: THREE.DoubleSide });
  }

  get(materialId: string, highlighted = false): THREE.MeshStandardMaterial {
    const map = highlighted ? this.highlight : this.base;
    let m = map.get(materialId);
    if (!m) {
      const look = LOOK[materialId] ?? FALLBACK;
      m = new THREE.MeshStandardMaterial({
        color: look.color,
        metalness: look.metalness,
        roughness: look.roughness,
        transparent: look.opacity !== undefined,
        opacity: look.opacity ?? 1,
        side: THREE.DoubleSide,
        clippingPlanes: this.clipping,
        clipShadows: true,
      });
      if (highlighted) {
        m.emissive = new THREE.Color(0xff8a00);
        m.emissiveIntensity = 0.45;
      }
      map.set(materialId, m);
    }
    return m;
  }

  markerMaterial(): THREE.MeshBasicMaterial {
    return this.marker;
  }

  /** Planos de corte compartidos por todos los materiales (vista en sección). */
  setClippingPlanes(planes: THREE.Plane[]): void {
    this.clipping = planes;
    for (const m of [...this.base.values(), ...this.highlight.values(), this.marker]) {
      m.clippingPlanes = planes;
      m.needsUpdate = true;
    }
  }

  dispose(): void {
    for (const m of [...this.base.values(), ...this.highlight.values(), this.marker]) m.dispose();
    this.base.clear();
    this.highlight.clear();
  }
}
