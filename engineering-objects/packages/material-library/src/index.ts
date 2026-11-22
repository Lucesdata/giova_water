/**
 * Catálogo técnico de materiales (spec §7.3). Propiedades en SI y con fuente.
 * El aspecto visual vive en otro sitio (three-adapter/renderMaterials): un color metálico
 * no es una especificación de material.
 */
import type { ReferenceId } from '@eo/engineering-core';

export type MaterialFamily = 'concrete' | 'structural-steel' | 'stainless-steel' | 'polymer' | 'elastomer';

interface MaterialBase {
  readonly id: string;
  readonly family: MaterialFamily;
  readonly designation: string;
  /** kg/m³ */
  readonly densityKgM3: number;
  readonly sources: readonly ReferenceId[];
  readonly notes?: string;
}

export interface ConcreteMaterial extends MaterialBase {
  readonly family: 'concrete';
  readonly strengthClass: string;
  /** Resistencia característica en probeta cilíndrica, MPa */
  readonly fckMPa: number;
  /** Módulo secante, GPa */
  readonly ecmGPa: number;
  readonly exposureClasses: readonly string[];
  readonly durability: string;
}

export interface SteelMaterial extends MaterialBase {
  readonly family: 'structural-steel' | 'stainless-steel';
  readonly grade: string;
  /** Límite elástico mínimo, MPa */
  readonly yieldStrengthMPa: number;
  readonly elasticModulusGPa: number;
  readonly corrosionProtection: string;
  readonly environmentalCompatibility?: string;
}

export interface PolymerMaterial extends MaterialBase {
  readonly family: 'polymer' | 'elastomer';
  readonly functionalProperties: string;
  readonly chemicalResistance?: string;
}

export type TechnicalMaterial = ConcreteMaterial | SteelMaterial | PolymerMaterial;

const CATALOG = {
  'CONC-C30/37-XC4-XA1': {
    id: 'CONC-C30/37-XC4-XA1',
    family: 'concrete',
    designation: 'Hormigón armado HA-30, estructura estanca en contacto con agua residual',
    strengthClass: 'C30/37',
    fckMPa: 30,
    ecmGPa: 33,
    densityKgM3: 2500,
    exposureClasses: ['XC4', 'XA1'],
    durability:
      'Clases de exposición orientativas para agua residual urbana: deben fijarse según la agresividad real (EN 206 y anejo nacional).',
    sources: ['EN-1992-1-1-2004', 'EN-1991-1-1-2002', 'EN-206-2013'],
    notes: 'Densidad de hormigón armado normal (EN 1991-1-1, anexo A).',
  },
  'CONC-C20/25-FILL': {
    id: 'CONC-C20/25-FILL',
    family: 'concrete',
    designation: 'Hormigón en masa para formación de pendientes',
    strengthClass: 'C20/25',
    fckMPa: 20,
    ecmGPa: 30,
    densityKgM3: 2400,
    exposureClasses: ['XC2'],
    durability: 'Capa no estructural; protegida por el revestimiento de fondo.',
    sources: ['EN-1992-1-1-2004', 'EN-1991-1-1-2002'],
  },
  'STEEL-S275JR-HDG': {
    id: 'STEEL-S275JR-HDG',
    family: 'structural-steel',
    designation: 'Acero estructural S275JR galvanizado en caliente',
    grade: 'S275JR',
    yieldStrengthMPa: 275,
    elasticModulusGPa: 210,
    densityKgM3: 7850,
    corrosionProtection: 'Galvanizado en caliente (EN ISO 1461). Espesor y categoría de corrosividad por definir.',
    sources: ['EN-10025-2-2019', 'EN-1991-1-1-2002'],
  },
  'SS-1.4301': {
    id: 'SS-1.4301',
    family: 'stainless-steel',
    designation: 'Acero inoxidable austenítico X5CrNi18-10 (AISI 304)',
    grade: '1.4301',
    yieldStrengthMPa: 230,
    elasticModulusGPa: 200,
    densityKgM3: 7900,
    corrosionProtection: 'Pasivado. Sin recubrimiento.',
    environmentalCompatibility:
      'Adecuado para partes sumergidas en agua residual urbana con cloruros moderados; con H₂S o cloruros elevados valorar 1.4404.',
    sources: ['EN-10088-2-2014'],
  },
  'SS-1.4404': {
    id: 'SS-1.4404',
    family: 'stainless-steel',
    designation: 'Acero inoxidable austenítico X2CrNiMo17-12-2 (AISI 316L)',
    grade: '1.4404',
    yieldStrengthMPa: 240,
    elasticModulusGPa: 200,
    densityKgM3: 8000,
    corrosionProtection: 'Pasivado. Sin recubrimiento.',
    environmentalCompatibility: 'Mayor resistencia a picaduras por cloruros que 1.4301.',
    sources: ['EN-10088-2-2014'],
  },
  'PE-HD-PE100': {
    id: 'PE-HD-PE100',
    family: 'polymer',
    designation: 'Polietileno de alta densidad PE100',
    densityKgM3: 955,
    functionalProperties: 'Tuberías de presión y gravedad; soldable a tope.',
    chemicalResistance: 'Buena frente a agua residual urbana.',
    sources: [],
    notes: 'Densidad típica de fabricante (0,94–0,96 g/cm³); confirmar con ficha técnica.',
  },
  'EPDM-WIPER': {
    id: 'EPDM-WIPER',
    family: 'elastomer',
    designation: 'Banda de barrido EPDM',
    densityKgM3: 1300,
    functionalProperties: 'Labio de rasqueta y de barredor de flotantes.',
    chemicalResistance: 'Aceptable con agua residual urbana; vigilar aceites y grasas (valorar NBR).',
    sources: [],
    notes: 'Densidad típica de fabricante; confirmar con ficha técnica.',
  },
} as const satisfies Record<string, TechnicalMaterial>;

export type MaterialId = keyof typeof CATALOG;

export const MATERIAL_IDS = Object.keys(CATALOG) as MaterialId[];

export function getMaterial(id: MaterialId): TechnicalMaterial {
  return CATALOG[id];
}

export function isMaterialId(id: string): id is MaterialId {
  return id in CATALOG;
}

export function listMaterials(): TechnicalMaterial[] {
  return Object.values(CATALOG);
}
