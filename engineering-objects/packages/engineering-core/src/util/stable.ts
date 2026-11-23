/** Serialización JSON con claves ordenadas: base de la reproducibilidad y de los hashes. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v !== null && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort()) {
      const val = (v as Record<string, unknown>)[k];
      if (val !== undefined) out[k] = sortKeys(val);
    }
    return out;
  }
  if (typeof v === 'number' && !Number.isFinite(v)) return String(v);
  return v;
}

/**
 * Hash FNV-1a de 64 bits (dos mitades de 32) en hexadecimal.
 * No es criptográfico: identifica contenidos de forma determinista y sin depender de node:crypto,
 * para que el núcleo funcione igual en navegador, Node o un worker.
 */
export function contentHash(value: unknown): string {
  const s = typeof value === 'string' ? value : stableStringify(value);
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x01000193) ^ (h1 >>> 15);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

/** Congelado profundo: las variantes y definiciones son inmutables. */
export function deepFreeze<T>(obj: T): T {
  if (obj !== null && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    for (const k of Object.keys(obj as object)) deepFreeze((obj as Record<string, unknown>)[k]);
  }
  return obj;
}

/** Copia profunda de datos JSON (sin funciones, sin ciclos). */
export function cloneData<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Redondeo a n decimales para presentación (nunca para cálculo). */
export function round(v: number, decimals = 3): number {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}

/** Redondeo hacia arriba a un incremento constructivo. 0 o negativo = sin redondeo. */
export function ceilTo(v: number, step: number): number {
  if (!(step > 0)) return v;
  // tolerancia para no subir un escalón por error de coma flotante
  return Math.ceil(v / step - 1e-9) * step;
}
