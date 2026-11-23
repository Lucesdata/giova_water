import { useCallback, useMemo, useState } from 'react';
import {
  DEC_005_DIDACTIC,
  createBaseVariant,
  createVariant,
  importVariant,
  regenerate,
  type ClarifierDesign,
  type ClarifierVariant,
  type DeepPartial,
  type DesignInputRaw,
  type VariantOptions,
} from '@eo/equipment-library';

/**
 * Estado del laboratorio: lista inmutable de variantes. Generar una variante nunca modifica las
 * existentes; el diseño completo (geometría) se regenera bajo demanda y se memoiza por variante.
 */
export function useVariants() {
  const [variants, setVariants] = useState<ClarifierVariant[]>(() => [createBaseVariant(DEC_005_DIDACTIC)]);
  const [selectedId, setSelectedId] = useState<string>(() => variants[0]!.variantId);
  const [error, setError] = useState<string | null>(null);
  const designs = useMemo(() => new Map<string, ClarifierDesign>(), []);

  const designOf = useCallback(
    (v: ClarifierVariant) => {
      let d = designs.get(v.variantId);
      if (!d) {
        d = regenerate(v);
        designs.set(v.variantId, d);
      }
      return d;
    },
    [designs],
  );

  const add = useCallback((v: ClarifierVariant) => {
    setVariants((prev) => (prev.some((x) => x.variantId === v.variantId) ? prev : [...prev, v]));
    setSelectedId(v.variantId);
  }, []);

  const derive = useCallback(
    (parent: ClarifierVariant, changes: DeepPartial<DesignInputRaw>, opts: VariantOptions) => {
      try {
        add(createVariant(parent, changes, opts));
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [add],
  );

  const importJson = useCallback(
    (json: string) => {
      try {
        const r = importVariant(json);
        add(r.variant);
        setError(r.notes.length ? r.notes.join(' ') : null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [add],
  );

  const selected = variants.find((v) => v.variantId === selectedId) ?? variants[0]!;
  return { variants, selected, selectDesign: designOf(selected), designOf, setSelectedId, derive, importJson, error, setError };
}
