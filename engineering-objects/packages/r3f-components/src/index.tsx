import { useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { Assembly, AssemblyDiff } from '@eo/geometry-engine';
import { SceneSync } from '@eo/three-adapter';

export interface EngineeringAssemblyProps {
  readonly assembly: Assembly;
  readonly selectedId?: string | null;
  /** Componentes aislados (null = todos visibles). */
  readonly isolatedIds?: readonly string[] | null;
  /** Plano de corte para la vista en sección (null = sin corte). */
  readonly sectionPlane?: THREE.Plane | null;
  readonly onSelect?: (componentId: string | null) => void;
  readonly onSync?: (diff: AssemblyDiff) => void;
}

/**
 * Renderiza un ensamblaje de ingeniería. La regeneración es selectiva (SceneSync) y los recursos
 * GPU se liberan al desmontar. No contiene lógica de ingeniería: solo recibe el ensamblaje.
 */
export function EngineeringAssembly({ assembly, selectedId = null, isolatedIds = null, sectionPlane = null, onSelect, onSync }: EngineeringAssemblyProps) {
  const sync = useMemo(() => new SceneSync(), []);
  const gl = useThree((s) => s.gl);

  useEffect(() => () => sync.dispose(), [sync]);

  useEffect(() => {
    const diff = sync.sync(assembly);
    onSync?.(diff);
  }, [sync, assembly, onSync]);

  useEffect(() => sync.setHighlighted(selectedId), [sync, selectedId, assembly]);
  useEffect(() => sync.setIsolated(isolatedIds), [sync, isolatedIds, assembly]);

  useEffect(() => {
    gl.localClippingEnabled = true;
    sync.materials.setClippingPlanes(sectionPlane ? [sectionPlane] : []);
  }, [gl, sync, sectionPlane]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const id = (e.object.userData.componentId as string | undefined) ?? null;
    onSelect?.(id);
  };

  return <primitive object={sync.root} onClick={handleClick} onPointerMissed={() => onSelect?.(null)} />;
}

export { SceneSync };
