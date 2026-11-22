import { Grid, Html, Line, OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { ClarifierDesign } from '@eo/equipment-library';
import { EngineeringAssembly } from '@eo/r3f-components';

export type ViewMode = 'iso' | 'plan' | 'elevation';

function CameraRig({ view, extent, centerY, nonce }: { view: ViewMode; extent: number; centerY: number; nonce: number }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  useEffect(() => {
    const d = extent * 2.4;
    const target = new THREE.Vector3(0, centerY, 0);
    if (view === 'plan') camera.position.set(0, centerY + d * 1.3, 0.0001);
    else if (view === 'elevation') camera.position.set(0, centerY, d * 1.35);
    else camera.position.set(d, centerY + d * 0.75, d);
    camera.lookAt(target);
    if (controls) {
      controls.target.copy(target);
      controls.update();
    }
  }, [view, extent, centerY, camera, controls, nonce]);
  return null;
}

function Dim({ a, b, label, color = '#ffb020' }: { a: [number, number, number]; b: [number, number, number]; label: string; color?: string }) {
  const mid: [number, number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  return (
    <group>
      <Line points={[a, b]} color={color} lineWidth={1.5} depthTest={false} renderOrder={10} />
      <Line points={[a, [a[0], a[1] + 0.12, a[2]]]} color={color} lineWidth={1} depthTest={false} />
      <Line points={[b, [b[0], b[1] + 0.12, b[2]]]} color={color} lineWidth={1} depthTest={false} />
      <Html position={mid} center zIndexRange={[10, 0]}>
        <div className="dim-label">{label}</div>
      </Html>
    </group>
  );
}

function Dimensions({ design }: { design: ClarifierDesign }) {
  const m = design.model;
  const yTop = m.yChannelTop + 0.35;
  return (
    <group>
      <Dim a={[-m.R, m.H + 0.02, 0]} b={[m.R, m.H + 0.02, 0]} label={`D = ${m.D.toFixed(3)} m`} />
      <Dim a={[-m.rChannelOuter, yTop, 0]} b={[m.rChannelOuter, yTop, 0]} label={`Dcanal = ${(2 * m.rChannelOuter).toFixed(2)} m`} color="#7cc4ff" />
      <Dim a={[m.R - 0.05, 0, 0.02]} b={[m.R - 0.05, m.H, 0.02]} label={`H = ${m.H.toFixed(2)} m`} />
      <Dim a={[0.0, m.ySumpBottom, 0.02]} b={[0.0, -m.sumpDrop, 0.02]} label={`poceta ${(-m.sumpDrop - m.ySumpBottom).toFixed(2)} m`} color="#9be38c" />
      <Dim a={[-m.rFeedwellOuter, m.yFeedwellBottom - 0.05, 0]} b={[m.rFeedwellOuter, m.yFeedwellBottom - 0.05, 0]} label={`Dpozo = ${(2 * m.rFeedwellOuter).toFixed(2)} m`} color="#9be38c" />
    </group>
  );
}

function Water({ design, plane }: { design: ClarifierDesign; plane: THREE.Plane | null }) {
  const m = design.model;
  return (
    <mesh position={[0, m.yWaterAvgOperating, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
      <circleGeometry args={[m.R - 0.01, 96]} />
      <meshStandardMaterial color="#3d6f85" transparent opacity={0.35} depthWrite={false} side={THREE.DoubleSide} clippingPlanes={plane ? [plane] : []} />
    </mesh>
  );
}

/** Manto de lodos de diseño: capa translúcida desde el fondo hasta su cota (solo visual). */
function SludgeBlanket({ design, plane }: { design: ClarifierDesign; plane: THREE.Plane | null }) {
  const h = design.input.geometry.sludgeBlanketDepthM;
  const m = design.model;
  const geometry = useMemo(() => {
    if (h === undefined) return null;
    const pts = [
      new THREE.Vector2(0, -m.sumpDrop),
      new THREE.Vector2(m.rSump, -m.sumpDrop),
      ...(m.rSlopeStart < m.R ? [new THREE.Vector2(m.rSlopeStart, 0)] : []),
      new THREE.Vector2(m.R - 0.01, 0),
      new THREE.Vector2(m.R - 0.01, h),
      new THREE.Vector2(0, h),
    ];
    return new THREE.LatheGeometry(pts, 96);
  }, [h, m]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry} renderOrder={1}>
      <meshStandardMaterial color="#6b4f2a" transparent opacity={0.45} depthWrite={false} side={THREE.DoubleSide} clippingPlanes={plane ? [plane] : []} />
    </mesh>
  );
}

export interface ViewerProps {
  design: ClarifierDesign;
  view: ViewMode;
  viewNonce: number;
  section: boolean;
  showDims: boolean;
  showWater: boolean;
  selectedId: string | null;
  isolatedIds: string[] | null;
  onSelect: (id: string | null) => void;
}

export function Viewer({ design, view, viewNonce, section, showDims, showWater, selectedId, isolatedIds, onSelect }: ViewerProps) {
  const extent = design.model.rChannelOuter + 0.5;
  const centerY = (design.model.yPitBottom + design.model.yDeck) / 2;
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, -1), 0), []);
  return (
    <Canvas shadows camera={{ fov: 35, near: 0.05, far: 500, position: [8, 6, 8] }} gl={{ antialias: true, preserveDrawingBuffer: true }} onPointerMissed={() => onSelect(null)}>
      <color attach="background" args={['#11161c']} />
      <hemisphereLight args={['#dfe9f3', '#2a2f36', 0.9]} />
      <directionalLight position={[8, 14, 6]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
      <directionalLight position={[-6, 5, -8]} intensity={0.45} />
      <EngineeringAssembly assembly={design.assembly} selectedId={selectedId} isolatedIds={isolatedIds} sectionPlane={section ? plane : null} onSelect={onSelect} />
      {showWater && !isolatedIds && <Water design={design} plane={section ? plane : null} />}
      {showWater && !isolatedIds && <SludgeBlanket design={design} plane={section ? plane : null} />}
      {showDims && <Dimensions design={design} />}
      <Grid position={[0, design.model.yPitBottom - 0.01, 0]} args={[40, 40]} cellSize={0.5} sectionSize={2.5} cellColor="#26303a" sectionColor="#3a4856" fadeDistance={40} infiniteGrid />
      <OrbitControls makeDefault enableDamping dampingFactor={0.12} />
      <CameraRig view={view} extent={extent} centerY={centerY} nonce={viewNonce} />
    </Canvas>
  );
}
