import { DEC_005_DIDACTIC } from '../primary-clarifier/presets/presets.js';
import type { ClfInputRaw } from './schema.js';

const base = DEC_005_DIDACTIC;
const { feedwellDiameterRatio: _r, feedwellMinDiameterM: _m, feedwellDepthM: _d, feedwellPlateThicknessM: _t, ...hydraulics } = base.hydraulics;

/**
 * Clarifloculador de referencia para potabilización (10 L/s). Los valores son DATOS DE PARTIDA del
 * proyectista para ejercitar el motor: los rangos con fuente viven en el perfil `water-reference`.
 */
export const CLF_010_WATER: ClfInputRaw = {
  tag: 'CLF-010',
  name: 'Clarifloculador 10 L/s — potabilización (rangos de referencia)',
  profileId: 'water-reference',
  flow: { averageLps: 10, peak: { method: 'factor', factor: 1.5 } }, // factor de punta de ejemplo
  influent: { tssMgL: 60, turbidityNtu: 40, temperatureC: 15 },
  designCriteria: {
    settlingLoadingAvgM_h: 1.5, // dentro de la banda 1,0–2,4 m/h del perfil
    hrtTargetMinH: 1.5,
  },
  criteriaOverrides: {},
  flocculation: {
    designFlow: 'peak', // el volumen de floculación se dimensiona con el caudal punta
    detentionTimeMin: 30,
    chamberDepthM: 2.5,
    chamberWallThicknessM: 0.008,
    chamberMinInnerDiameterM: 0,
    velocityGradientS: 40,
    designTemperatureC: 10, // temperatura mínima de invierno: gobierna la viscosidad
    paddles: {
      tipSpeedM_s: 0.6,
      relativeVelocityFactor: 0.75, // hipótesis habitual de deslizamiento (MWH, TO_VERIFY)
      dragCoefficient: 1.8, // paleta plana esbelta (MWH, TO_VERIFY)
      armCount: 4,
      bladeWidthM: 0.15,
      bladeHeightRatio: 0.7,
      wallClearanceM: 0.15,
      sleeveClearanceM: 0.05,
      sleeveWallThicknessM: 0.006,
      bladeThicknessM: 0.008,
      maxRings: 6,
    },
    drive: { footprintM: 0.5, heightM: 0.5 },
    materials: { chamber: 'SS-1.4301', paddles: 'SS-1.4301' },
  },
  geometry: {
    sideWaterDepthM: 3.5,
    diameterRoundingStepM: 0.1,
    minDiameterM: 0,
    freeboardM: 0.5,
    floorSlope: 1 / 12,
    sumpDiameterM: 0.8,
    sumpDepthM: 0.6,
  },
  civil: base.civil,
  hydraulics,
  // Tablero de 1,6 m: el tubo de giro del agitador pasa entre las vigas y el reductor anular apoya sobre él.
  mechanical: { ...base.mechanical, bridgeWidthM: 1.6 },
  site: { groundLevelM: 3.7, excavationWorkingSpaceM: 0.5 },
  meshResolution: { circularSegments: 96 },
};
