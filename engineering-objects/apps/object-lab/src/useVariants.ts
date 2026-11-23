import { useCallback, useMemo, useState } from 'react';
import { createBaseVariantOf, createVariantOf, importVariantOf, regenerateOf, type VariantOptions } from '@eo/equipment-library';
import type { AnyDesign, LabEquipment, LabVariant } from './equipment';

type LabDesign = AnyDesign;

/**
 * Estado del laboratorio para un equipo: lista inmutable de variantes. Generar una variante nunca
 * modifica las existentes; el diseño completo (geometría) se regenera bajo demanda y se memoiza.
 */
export function useVariants(eq: LabEquipment) {
  const def = eq.definition;
  const [variants, setVariants] = useState<LabVariant[]>(() => [createBaseVariantOf(def, eq.preset) as LabVariant]);
  const [selectedId, setSelectedId] = useState<string>(() => variants[0]!.variantId);
  const [error, setError] = useState<string | null>(null);
  const designs = useMemo(() => new Map<string, LabDesign>(), []);

  const designOf = useCallback(
    (v: LabVariant) => {
      let d = designs.get(v.variantId);
      if (!d) {
        d = regenerateOf(def, v);
        designs.set(v.variantId, d);
      }
      return d;
    },
    [designs, def],
  );

  const add = useCallback((v: LabVariant) => {
    setVariants((prev) => (prev.some((x) => x.variantId === v.variantId) ? prev : [...prev, v]));
    setSelectedId(v.variantId);
  }, []);

  const derive = useCallback(
    (parent: LabVariant, changes: unknown, opts: VariantOptions) => {
      try {
        add(createVariantOf(def, parent, changes, opts) as LabVariant);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [add, def],
  );

  const importJson = useCallback(
    (json: string) => {
      try {
        const r = importVariantOf(def, json);
        add(r.variant as LabVariant);
        setError(r.notes.length ? r.notes.join(' ') : null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [add, def],
  );

  const selected = variants.find((v) => v.variantId === selectedId) ?? variants[0]!;
  return { variants, selected, selectDesign: designOf(selected), designOf, setSelectedId, derive, importJson, error, setError };
}
