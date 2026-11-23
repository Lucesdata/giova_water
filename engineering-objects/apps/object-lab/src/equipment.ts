import { MATERIAL_IDS, getMaterial } from '@eo/material-library';
import {
  CLARIFLOCCULATOR_DEFINITION,
  CLF_010_WATER,
  CLF_COMPARISON_KEYS,
  CLF_PROFILES,
  CLF_RESIZE_GROUPS,
  COMPARISON_KEYS,
  DEC_005_DIDACTIC,
  FLOC_RULES,
  PRIMARY_CLARIFIER_DEFINITION,
  PROFILES,
  RESIZE_GROUPS,
  type CircularDesign,
  type EquipmentDefinition,
  type EquipmentVariant,
  type ProfileInfo,
  type ResizeGroup,
} from '@eo/equipment-library';

/**
 * Registro de equipos del laboratorio. El laboratorio no contiene lógica de ingeniería: cada equipo
 * aporta su definición (cálculo, variantes, importación) y la configuración de sus formularios y tablas.
 */
export type FieldKind = 'number' | 'optional-number' | 'select' | 'text';
export interface Field {
  path: string;
  label: string;
  unit?: string;
  kind: FieldKind;
  step?: number;
  options?: { value: string; label: string }[];
}

const materialOptions = (family?: string) =>
  MATERIAL_IDS.filter((id) => !family || getMaterial(id).family.includes(family)).map((id) => ({ value: id, label: id }));

export interface FieldGroup {
  title: string;
  fields: Field[];
}

const profileField = (profiles: Record<string, ProfileInfo>): Field => ({
  path: 'profileId',
  label: 'Perfil de diseño',
  kind: 'select',
  options: Object.values(profiles).map((p) => ({ value: p.id, label: p.name })),
});

const PRIMARY_GROUPS: FieldGroup[] = [
  {
    title: 'Caudal',
    fields: [
      { path: 'flow.averageLps', label: 'Caudal medio Qmed', unit: 'L/s', kind: 'number', step: 0.5 },
      { path: 'flow.peak.factor', label: 'Factor de punta Fp', unit: '—', kind: 'number', step: 0.1 },
    ],
  },
  {
    title: 'Criterios hidráulicos',
    fields: [
      profileField(PROFILES),
      { path: 'designCriteria.surfaceLoadingAvgM_h', label: 'CHS admisible (media)', unit: 'm/h', kind: 'number', step: 0.05 },
      { path: 'designCriteria.surfaceLoadingPeakM_h', label: 'CHS admisible (punta)', unit: 'm/h', kind: 'optional-number', step: 0.1 },
      { path: 'designCriteria.hrtTargetMinH', label: 'TRH mínimo objetivo', unit: 'h', kind: 'optional-number', step: 0.1 },
      { path: 'designCriteria.weirLoadingMaxM3_md', label: 'CLV máxima', unit: 'm³/(m·d)', kind: 'optional-number', step: 10 },
    ],
  },
  {
    title: 'Geometría',
    fields: [
      { path: 'geometry.sideWaterDepthM', label: 'Profundidad útil H', unit: 'm', kind: 'number', step: 0.1 },
      { path: 'geometry.diameterRoundingStepM', label: 'Paso de redondeo de D', unit: 'm', kind: 'number', step: 0.05 },
      { path: 'geometry.floorSlope', label: 'Pendiente del fondo', unit: 'm/m', kind: 'number', step: 0.005 },
      { path: 'geometry.sumpDiameterM', label: 'Diámetro de poceta', unit: 'm', kind: 'number', step: 0.05 },
      { path: 'geometry.sumpDepthM', label: 'Profundidad de poceta', unit: 'm', kind: 'number', step: 0.05 },
      { path: 'geometry.freeboardM', label: 'Resguardo', unit: 'm', kind: 'number', step: 0.05 },
      { path: 'geometry.sludgeBlanketDepthM', label: 'Altura del manto de lodos', unit: 'm', kind: 'optional-number', step: 0.1 },
    ],
  },
  {
    title: 'Obra civil (espesores no verificados)',
    fields: [
      { path: 'civil.wallThicknessM', label: 'Espesor de muro', unit: 'm', kind: 'number', step: 0.05 },
      { path: 'civil.baseSlabThicknessM', label: 'Espesor de losa', unit: 'm', kind: 'number', step: 0.05 },
      { path: 'civil.launderWidthM', label: 'Ancho de canal', unit: 'm', kind: 'number', step: 0.05 },
      { path: 'civil.launderDepthM', label: 'Profundidad de canal', unit: 'm', kind: 'number', step: 0.05 },
      { path: 'civil.concrete', label: 'Hormigón', kind: 'select', options: materialOptions('concrete') },
    ],
  },
  {
    title: 'Hidráulica de componentes',
    fields: [
      { path: 'hydraulics.feedwellDiameterRatio', label: 'Dpozo / D', unit: '—', kind: 'number', step: 0.01 },
      { path: 'hydraulics.feedwellDepthM', label: 'Profundidad del pozo', unit: 'm', kind: 'number', step: 0.1 },
      { path: 'hydraulics.notchSpacingM', label: 'Paso de escotaduras', unit: 'm', kind: 'number', step: 0.05 },
      { path: 'hydraulics.sludgePipeMinDn', label: 'DN mínimo de lodos', unit: 'mm', kind: 'number', step: 50 },
    ],
  },
  {
    title: 'Mecánica',
    fields: [
      {
        path: 'mechanical.bridgeType',
        label: 'Tipo de puente',
        kind: 'select',
        options: [
          { value: 'full-span', label: 'Vano completo' },
          { value: 'radial', label: 'Radial' },
        ],
      },
      {
        path: 'mechanical.armCount',
        label: 'Número de brazos',
        kind: 'select',
        options: [
          { value: '2', label: '2' },
          { value: '4', label: '4' },
        ],
      },
      { path: 'mechanical.bladeFloorClearanceM', label: 'Holgura paleta–fondo', unit: 'm', kind: 'number', step: 0.005 },
      { path: 'mechanical.materials.submerged', label: 'Material sumergido', kind: 'select', options: materialOptions('steel') },
    ],
  },
];

const CLF_GROUPS: FieldGroup[] = [
  PRIMARY_GROUPS[0]!,
  {
    title: 'Criterios de sedimentación',
    fields: [
      profileField(CLF_PROFILES),
      { path: 'designCriteria.settlingLoadingAvgM_h', label: 'CHS admisible en la corona (media)', unit: 'm/h', kind: 'number', step: 0.05 },
      { path: 'designCriteria.settlingLoadingPeakM_h', label: 'CHS admisible en la corona (punta)', unit: 'm/h', kind: 'optional-number', step: 0.1 },
      { path: 'designCriteria.hrtTargetMinH', label: 'TRH mínimo objetivo', unit: 'h', kind: 'optional-number', step: 0.1 },
      { path: 'designCriteria.weirLoadingMaxM3_md', label: 'CLV máxima', unit: 'm³/(m·d)', kind: 'optional-number', step: 10 },
    ],
  },
  {
    title: 'Floculación',
    fields: [
      {
        path: 'flocculation.designFlow',
        label: 'Caudal de diseño de la cámara',
        kind: 'select',
        options: [
          { value: 'average', label: 'Medio' },
          { value: 'peak', label: 'Punta' },
        ],
      },
      { path: 'flocculation.detentionTimeMin', label: 'Tiempo de floculación', unit: 'min', kind: 'number', step: 1 },
      { path: 'flocculation.chamberDepthM', label: 'Profundidad de la cámara', unit: 'm', kind: 'number', step: 0.1 },
      { path: 'flocculation.velocityGradientS', label: 'Gradiente G de diseño', unit: 's⁻¹', kind: 'number', step: 5 },
      { path: 'flocculation.designTemperatureC', label: 'Temperatura de diseño', unit: '°C', kind: 'number', step: 1 },
      { path: 'flocculation.paddles.tipSpeedM_s', label: 'Velocidad periférica', unit: 'm/s', kind: 'number', step: 0.05 },
      { path: 'flocculation.paddles.armCount', label: 'Brazos del agitador', unit: '—', kind: 'number', step: 1 },
      { path: 'flocculation.paddles.bladeWidthM', label: 'Ancho de paleta', unit: 'm', kind: 'number', step: 0.01 },
      { path: 'flocculation.paddles.bladeHeightRatio', label: 'Altura de paleta / cámara', unit: '—', kind: 'number', step: 0.05 },
    ],
  },
  ...PRIMARY_GROUPS.filter((g) => g.title === 'Geometría' || g.title.startsWith('Obra civil')),
  {
    title: 'Hidráulica de componentes',
    fields: [
      { path: 'hydraulics.notchSpacingM', label: 'Paso de escotaduras', unit: 'm', kind: 'number', step: 0.05 },
      { path: 'hydraulics.sludgePipeMinDn', label: 'DN mínimo de lodos', unit: 'mm', kind: 'number', step: 50 },
    ],
  },
  {
    title: 'Mecánica',
    fields: [
      ...PRIMARY_GROUPS.find((g) => g.title === 'Mecánica')!.fields,
      { path: 'mechanical.cageHalfWidthM', label: 'Semiancho de la jaula', unit: 'm', kind: 'number', step: 0.01 },
    ],
  },
];

export type AnyDesign = CircularDesign<{ readonly tag: string; readonly name?: string; readonly geometry: { readonly sludgeBlanketDepthM?: number } }, ProfileInfo, Record<string, number>>;
export type LabVariant = EquipmentVariant<unknown, Record<string, number>>;

export interface LabEquipment {
  readonly id: 'primary-clarifier' | 'clariflocculator';
  readonly label: string;
  readonly definition: EquipmentDefinition<unknown, Record<string, number>, AnyDesign>;
  readonly preset: unknown;
  readonly quick: readonly { lps: number; tag: string }[];
  readonly groups: FieldGroup[];
  readonly resizeGroups: readonly ResizeGroup[];
  readonly dimsKeys: readonly string[];
  readonly hydKeys: readonly string[];
  readonly comparisonKeys: readonly string[];
  readonly reportRules: Readonly<Record<string, number>>;
  /** Nombre corto de la zona central para las cotas. */
  readonly centralLabel: string;
}

const COMMON_DIMS = ['tank.diameter.theoretical', 'tank.diameter', 'civil.structuralOuterDiameter', 'civil.channelOuterDiameter', 'tank.depth', 'floor.dropAtSump', 'level.sumpBottom', 'feedwell.diameter', 'inlet.dn', 'effluent.dn', 'sludge.dn', 'weir.notchCount', 'arm.length', 'bridge.span'];
const COMMON_HYD = ['flow.avg.Ls', 'flow.peak.Ls', 'area.required', 'tank.area', 'loading.surface.avg', 'loading.surface.peak', 'volume.gross', 'volume.effective', 'hrt.avg', 'hrt.peak', 'loading.weir.avg', 'loading.weir.peak', 'weir.head.peak', 'inlet.velocity.peak', 'inlet.velocity.avg', 'feedwell.downwardVelocity.peak', 'column.portVelocity.peak', 'launder.freeFall', 'solids.influentLoad.avg', 'loading.solids.avg', 'loading.solids.peak', 'volume.deduction.sludgeBlanket', 'sludgeBlanket.clearanceToFeedwell'];

export const EQUIPMENT: readonly LabEquipment[] = [
  {
    id: 'primary-clarifier',
    label: 'Decantador primario',
    definition: PRIMARY_CLARIFIER_DEFINITION as unknown as LabEquipment['definition'],
    preset: DEC_005_DIDACTIC,
    quick: [
      { lps: 10, tag: 'DEC-010' },
      { lps: 3, tag: 'DEC-003' },
    ],
    groups: PRIMARY_GROUPS,
    resizeGroups: RESIZE_GROUPS,
    dimsKeys: COMMON_DIMS,
    hydKeys: COMMON_HYD,
    comparisonKeys: COMPARISON_KEYS,
    reportRules: {},
    centralLabel: 'Dpozo',
  },
  {
    id: 'clariflocculator',
    label: 'Clarifloculador',
    definition: CLARIFLOCCULATOR_DEFINITION as unknown as LabEquipment['definition'],
    preset: CLF_010_WATER,
    quick: [
      { lps: 20, tag: 'CLF-020' },
      { lps: 5, tag: 'CLF-005' },
    ],
    groups: CLF_GROUPS,
    resizeGroups: CLF_RESIZE_GROUPS,
    dimsKeys: [...COMMON_DIMS.slice(0, 7), 'feedwell.diameter', 'floc.chamber.innerDiameter.required', ...COMMON_DIMS.slice(8)],
    hydKeys: [
      'flow.avg.Ls',
      'flow.peak.Ls',
      'floc.volume.required',
      'floc.volume',
      'floc.time.design',
      'floc.time.peak',
      'water.viscosity',
      'floc.power.required',
      'floc.power.delivered',
      'floc.G',
      'floc.Gt',
      'floc.paddle.rpm',
      'floc.paddle.rings',
      'floc.paddle.area',
      'floc.paddle.areaRatio',
      'area.required',
      'settling.area',
      'loading.surface.avg',
      'loading.surface.peak',
      'volume.effective',
      'hrt.avg',
      'loading.weir.peak',
      'weir.head.peak',
      'loading.solids.avg',
    ],
    comparisonKeys: CLF_COMPARISON_KEYS,
    reportRules: FLOC_RULES,
    centralLabel: 'Dcámara',
  },
];
