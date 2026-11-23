import { PHYSICAL } from '../units/units.js';

/**
 * Fórmulas hidráulicas genéricas. Funciones puras en unidades SI, sin estado.
 * La trazabilidad (qué ecuación, qué datos) la registra el motor que las usa.
 */

/** Área requerida por carga superficial: A = Q / CHS (spec §5.2). Q y CHS en unidades coherentes. */
export function requiredSurfaceArea(flow: number, surfaceLoading: number): number {
  if (!(surfaceLoading > 0)) throw new RangeError('La carga superficial debe ser > 0');
  return flow / surfaceLoading;
}

/** D = √(4A/π) (spec §5.3). */
export function circleDiameterFromArea(area: number): number {
  return Math.sqrt((4 * area) / Math.PI);
}

export function circleArea(diameter: number): number {
  return (Math.PI * diameter * diameter) / 4;
}

export function annulusArea(outerDiameter: number, innerDiameter: number): number {
  return circleArea(outerDiameter) - circleArea(innerDiameter);
}

/** Velocidad media en conducto circular lleno, m/s. */
export function pipeVelocity(flowM3s: number, innerDiameterM: number): number {
  return flowM3s / circleArea(innerDiameterM);
}

/**
 * Vertedero triangular de pared delgada (ISO 1438, Kindsvater-Shen simplificada):
 *   Q = Cd · (8/15) · √(2g) · tan(θ/2) · h^(5/2)
 * Devuelve el caudal por escotadura (m³/s) para una carga h (m).
 */
export function vNotchFlow(headM: number, angleRad: number, cd: number): number {
  return cd * (8 / 15) * Math.sqrt(2 * PHYSICAL.g) * Math.tan(angleRad / 2) * Math.pow(Math.max(headM, 0), 2.5);
}

/** Inversa de vNotchFlow: carga necesaria para que una escotadura evacúe q (m³/s). */
export function vNotchHead(flowPerNotchM3s: number, angleRad: number, cd: number): number {
  const k = cd * (8 / 15) * Math.sqrt(2 * PHYSICAL.g) * Math.tan(angleRad / 2);
  return Math.pow(flowPerNotchM3s / k, 0.4);
}

/** Calado crítico en canal rectangular: yc = (Q² / (g·b²))^(1/3). */
export function criticalDepthRect(flowM3s: number, widthM: number): number {
  return Math.cbrt((flowM3s * flowM3s) / (PHYSICAL.g * widthM * widthM));
}

/**
 * Calado aguas arriba en canal horizontal con aporte lateral uniforme y salida libre
 * (Chow 1959; uso habitual en canales de vertedero): y₀ ≈ √3 · yc.
 */
export function lateralSpillChannelUpstreamDepth(flowM3s: number, widthM: number): number {
  return Math.sqrt(3) * criticalDepthRect(flowM3s, widthM);
}
