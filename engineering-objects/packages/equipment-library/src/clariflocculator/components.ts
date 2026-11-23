import { COMPONENTS, COMPONENT_DEPENDENCIES, COMPONENT_IDS } from '../primary-clarifier/definition/components.js';
import { CIRCULAR_ASSEMBLY_CONSTRAINTS, CIRCULAR_MOTION, type ComponentCatalog } from '../primary-clarifier/definition/design.js';

/** Componentes del clarifloculador: los del tanque circular común más el agitador y su accionamiento. */
export const CLF_COMPONENT_IDS = [...COMPONENT_IDS, 'MEC-007', 'MEC-008'] as const;

export const CLF_CATALOG: ComponentCatalog = {
  ids: CLF_COMPONENT_IDS,
  info: {
    ...COMPONENTS,
    'HYD-002': { name: 'Cámara de floculación', discipline: 'hydraulic' },
    'HYD-003': { name: 'Deflectores de entrada a la cámara', discipline: 'hydraulic' },
    'MEC-007': { name: 'Agitador de paletas de floculación', discipline: 'mechanical' },
    'MEC-008': { name: 'Accionamiento del floculador', discipline: 'mechanical' },
  },
  dependencies: {
    ...COMPONENT_DEPENDENCIES,
    'HYD-002': ['decision.feedwellDiameterM', 'input.flocculation.detentionTimeMin', 'input.flocculation.designFlow', 'input.flocculation.chamberDepthM', 'input.flocculation.chamberWallThicknessM', 'decision.sideWaterDepthM'],
    'MEC-007': ['decision.feedwellDiameterM', 'decision.paddleRings', 'input.flocculation.velocityGradientS', 'input.flocculation.designTemperatureC', 'input.flocculation.paddles', 'input.mechanical.cageHalfWidthM'],
    'MEC-008': ['input.flocculation.drive', 'input.mechanical.driveFootprintM'],
  },
  motion: {
    ...CIRCULAR_MOTION,
    'MEC-007': { type: 'rotation', dof: 1, axis: [0, 1, 0], origin: [0, 0, 0], note: 'Gira a la velocidad del floculador, independiente del rascador.' },
    'MEC-008': { type: 'rotation', dof: 1, axis: [0, 1, 0], origin: [0, 0, 0], note: 'Solo la salida gira; la carcasa es fija.' },
  },
  constraints: {
    ...CIRCULAR_ASSEMBLY_CONSTRAINTS,
    'HYD-002': ['Colgada de MEC-001 (y de la columna en puente radial). Delimita la zona de floculación.'],
    'MEC-007': ['Cuelga de MEC-008; gira concéntrico y por fuera de la jaula MEC-003 sin contacto.'],
    'MEC-008': ['Apoya en el tablero de MEC-001, alrededor de MEC-002.'],
  },
};
