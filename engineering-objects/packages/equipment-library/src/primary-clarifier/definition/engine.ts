import {
  CalcTrace,
  CheckList,
  ceilTo,
  circleArea,
  circleDiameterFromArea,
  conicalFloorVolume,
  cylinderVolume,
  degToRad,
  evaluateRange,
  getReference,
  lateralSpillChannelUpstreamDepth,
  lpsToM3h,
  m3hToM3d,
  requiredSurfaceArea,
  selectDn,
  unitLabel,
  vNotchHead,
  type CheckStatus,
  type ValidationLevel,
} from '@eo/engineering-core';
import { CRITERION_META, type Criterion, type CriterionKey } from './profiles.js';
import type { DesignInput } from './schema.js';

/** Versión del método de cálculo. Cambia cuando cambia cualquier ecuación o regla. */
export const ENGINEERING_MODEL_VERSION = 'PC-ENG-1.0.0';

/**
 * Decisiones de dimensionamiento: los valores que el motor ELIGE (frente a los que calcula
 * por consecuencia). Son lo que se congela en los modos B y C del redimensionamiento.
 */
export interface SizingDecisions {
  readonly diameterM: number;
  readonly sideWaterDepthM: number;
  readonly inletDn: number;
  readonly portHeightM: number;
  readonly feedwellDiameterM: number;
  readonly notchCount: number;
  readonly effluentDn: number;
  readonly sludgeDn: number;
}

export type ResizeGroup = 'tank' | 'inlet' | 'feedwell' | 'weir' | 'effluent' | 'sludge';

export const DECISION_GROUP: Record<keyof SizingDecisions, ResizeGroup> = {
  diameterM: 'tank',
  sideWaterDepthM: 'tank',
  inletDn: 'inlet',
  portHeightM: 'inlet',
  feedwellDiameterM: 'feedwell',
  notchCount: 'weir',
  effluentDn: 'effluent',
  sludgeDn: 'sludge',
};

/**
 * Modelo resuelto: todas las magnitudes geométricas que necesitan los constructores de geometría
 * y las comprobaciones. Radios en m desde el eje; cotas y en m desde el fondo en pared.
 */
export interface ResolvedModel {
  readonly D: number;
  readonly R: number;
  readonly H: number;
  readonly floorSlope: number;
  readonly rSlopeStart: number;
  readonly rSump: number;
  readonly rSumpOuter: number;
  readonly sumpDrop: number;
  readonly ySumpBottom: number;
  readonly ySlabTop: number;
  readonly ySlabBottom: number;
  readonly yPitBottom: number;
  readonly rSlab: number;
  readonly rWallOuter: number;
  readonly rLaunderOuter: number;
  readonly rChannelOuter: number;
  readonly yLaunderFloor: number;
  readonly yChannelTop: number;
  readonly channelFloorThickness: number;
  readonly yWaterAvg: number;
  readonly yWaterPeak: number;
  readonly weirPlateThickness: number;
  readonly notchDepth: number;
  readonly notchCount: number;
  readonly notchAngle: number;
  readonly rColumnInner: number;
  readonly rColumnOuter: number;
  readonly yInletAxis: number;
  readonly yColumnTop: number;
  readonly portCount: number;
  readonly portWidth: number;
  readonly portHeight: number;
  readonly yPortCenter: number;
  readonly rFeedwellOuter: number;
  readonly rFeedwellInner: number;
  readonly yFeedwellBottom: number;
  readonly yFeedwellTop: number;
  readonly inletDnM: number;
  readonly effluentDnM: number;
  readonly sludgeDnM: number;
  readonly pipeWall: number;
  readonly ySludgeAxis: number;
  readonly yEffluentAxis: number;
  readonly bridgeType: 'full-span' | 'radial';
  readonly rBearing: number;
  readonly bridgeSpan: number;
  readonly bridgeWidth: number;
  readonly yBridgeBearing: number;
  readonly yGirderBottom: number;
  readonly yDeck: number;
  readonly driveFootprint: number;
  readonly driveHeight: number;
  readonly cageHalfWidth: number;
  readonly cageMember: number;
  readonly armCount: number;
  readonly rArmRoot: number;
  readonly rArmTip: number;
  readonly armTrussDepth: number;
  readonly bladeHeight: number;
  readonly bladeClearance: number;
  readonly bladeLength: number;
  readonly bladeAngle: number;
  readonly bladeThickness: number;
  readonly rBaffleInner: number;
  readonly baffleThickness: number;
  readonly yBaffleBottom: number;
  readonly yBaffleTop: number;
  readonly rSkimmerStart: number;
  readonly rSkimmerTip: number;
  readonly scumBoxLength: number;
  readonly scumBoxWidth: number;
  readonly segments: number;
}

/** Cota del fondo terminado en función del radio (continuidad garantizada por construcción). */
export function floorElevation(m: Pick<ResolvedModel, 'floorSlope' | 'rSlopeStart' | 'rSump'>, r: number): number {
  const rr = Math.max(r, m.rSump);
  if (rr >= m.rSlopeStart) return 0;
  return -m.floorSlope * (m.rSlopeStart - rr);
}

/** Reglas de modelado (no son criterios de diseño): se documentan en specs/parameter-inventory.md. */
export const MODELLING_RULES = {
  /** Ventana de la columna = 50 % del paso circunferencial entre ventanas. */
  portWidthToPitch: 0.5,
  /** Margen libre por encima y por debajo de las ventanas dentro del pozo de alimentación, m. */
  portMarginInFeedwellM: 0.1,
  /** Resguardo de la parte superior del pozo de alimentación sobre la lámina en punta, m. */
  feedwellTopAboveWaterM: 0.15,
  /** Resguardo de la parte superior del deflector de flotantes sobre la lámina en punta, m. */
  baffleTopAboveWaterM: 0.15,
  /** Recubrimiento entre la generatriz superior de la tubería enterrada y el elemento más bajo, m. */
  buriedPipeCoverM: 0.3,
  /** Sección representativa de los perfiles de la jaula, m (no es una sección resistente). */
  cageMemberM: 0.08,
  /** Espesor de chapa de las paletas, m. */
  bladeThicknessM: 0.006,
  /** Cota del eje del colector de efluente bajo la losa del canal, m. */
  effluentDropM: 0.6,
} as const;

interface EngineOutput {
  trace: CalcTrace;
  decisions: SizingDecisions;
  model: ResolvedModel;
  sourcesUsed: Set<string>;
}

/**
 * Motor de cálculo (spec §5.8): convierte, calcula condiciones hidráulicas, resuelve dimensiones,
 * aplica restricciones y registra comprobaciones. Nunca ajusta un valor en silencio: cuando una
 * restricción impide cumplir un criterio, el valor se mantiene y se registra FAIL.
 */
export function runEngine(
  input: DesignInput,
  criteria: Partial<Record<CriterionKey, Criterion>>,
  fixed: Partial<SizingDecisions>,
  checks: CheckList,
): EngineOutput {
  const t = new CalcTrace(ENGINEERING_MODEL_VERSION);
  const sourcesUsed = new Set<string>();
  const g = input.geometry;
  const hy = input.hydraulics;
  const me = input.mechanical;
  const civ = input.civil;
  const crit = input.designCriteria;

  /** Comprueba un valor frente al criterio del perfil; sin criterio → NOT_EVALUATED. */
  const criterionCheck = (id: string, level: ValidationLevel, key: CriterionKey, value: number, componentIds: string[] = []) => {
    const c = criteria[key];
    const meta = CRITERION_META[key];
    if (!c) {
      checks.add({
        id,
        level,
        status: 'NOT_EVALUATED',
        title: meta.label,
        message: 'El perfil de diseño no define criterio para esta magnitud.',
        value,
        unit: unitLabel(meta.unit),
        componentIds,
      });
      return;
    }
    sourcesUsed.add(c.sourceId);
    const ev = evaluateRange(value, c.constraint);
    const ref = getReference(c.sourceId);
    checks.add({
      id,
      level,
      status: ev.status,
      title: meta.label,
      message: `${ev.status === 'PASS' ? 'Cumple' : ev.status === 'WARNING' ? 'Fuera de la banda recomendada' : 'Incumple'} el criterio (${ref?.title ?? c.sourceId}${c.note ? ` — ${c.note}` : ''}).`,
      value,
      limit: ev.limit,
      unit: unitLabel(meta.unit),
      componentIds,
      sourceId: c.sourceId,
    });
  };

  const simple = (id: string, level: ValidationLevel, status: CheckStatus, title: string, message: string, extra: Partial<{ value: number; limit: string; unit: string; componentIds: string[] }> = {}) =>
    checks.add({ id, level, status, title, message, ...extra });

  /** Decisión: valor fijado por restricción (modos B/C) o calculado por el motor. */
  const decide = <K extends keyof SizingDecisions>(key: K, computed: () => number): { value: number; fixed: boolean } => {
    const f = fixed[key];
    if (f !== undefined) return { value: f, fixed: true };
    return { value: computed(), fixed: false };
  };

  // ───────────────────────── 1. Caudales ─────────────────────────
  const qAvgLs = t.record('flow.avg.Ls', input.flow.averageLps, { label: 'Caudal medio', unit: 'L/s', inputs: ['input.flow.averageLps'], equation: 'Qmed (dato)', origin: 'INPUT' });
  const qAvgH = t.record('flow.avg.m3h', lpsToM3h(qAvgLs), { label: 'Caudal medio', unit: 'm3/h', inputs: ['flow.avg.Ls'], equation: 'Q[m³/h] = 3,6 · Q[L/s]' });
  const qAvgD = t.record('flow.avg.m3d', m3hToM3d(qAvgH), { label: 'Caudal medio diario', unit: 'm3/d', inputs: ['flow.avg.m3h'], equation: 'Q[m³/d] = 24 · Q[m³/h]' });

  let qPeakLs: number;
  if (input.flow.peak.method === 'factor') {
    qPeakLs = t.record('flow.peak.Ls', qAvgLs * input.flow.peak.factor, { label: 'Caudal punta', unit: 'L/s', inputs: ['flow.avg.Ls', 'input.flow.peak.factor'], equation: 'Qmax = Fp · Qmed' });
  } else {
    qPeakLs = t.record('flow.peak.Ls', input.flow.peak.peakLps, { label: 'Caudal punta', unit: 'L/s', inputs: ['input.flow.peak.peakLps'], equation: 'Qmax (dato directo; no se aplica factor de punta)', origin: 'INPUT' });
  }
  simple('DATA-PEAK-GE-AVG', 1, qPeakLs >= qAvgLs ? 'PASS' : 'FAIL', 'Caudal punta ≥ caudal medio', qPeakLs >= qAvgLs ? 'Coherente.' : 'El caudal punta introducido es inferior al medio.', { value: qPeakLs, limit: `≥ ${qAvgLs}`, unit: 'L/s' });
  const qPeakH = t.record('flow.peak.m3h', lpsToM3h(qPeakLs), { label: 'Caudal punta', unit: 'm3/h', inputs: ['flow.peak.Ls'], equation: 'Q[m³/h] = 3,6 · Q[L/s]' });
  const qPeakS = qPeakH / 3600;
  t.record('flow.peak.m3d', m3hToM3d(qPeakH), { label: 'Caudal punta en base diaria', unit: 'm3/d', inputs: ['flow.peak.m3h'], equation: 'Q[m³/d] = 24 · Q[m³/h]' });
  const qPeakD = t.get('flow.peak.m3d');

  // ───────────────────────── 2. Superficie y diámetro ─────────────────────────
  const aAvg = t.record('area.required.avg', requiredSurfaceArea(qAvgH, crit.surfaceLoadingAvgM_h), {
    label: 'Superficie requerida a caudal medio',
    unit: 'm2',
    inputs: ['flow.avg.m3h', 'input.designCriteria.surfaceLoadingAvgM_h'],
    equation: 'A = Qmed / CHSmed',
  });
  let aReq = aAvg;
  let governing = 'caudal medio';
  if (crit.surfaceLoadingPeakM_h !== undefined) {
    const aPeak = t.record('area.required.peak', requiredSurfaceArea(qPeakH, crit.surfaceLoadingPeakM_h), {
      label: 'Superficie requerida a caudal punta',
      unit: 'm2',
      inputs: ['flow.peak.m3h', 'input.designCriteria.surfaceLoadingPeakM_h'],
      equation: 'A = Qmax / CHSmax',
    });
    if (aPeak > aReq) {
      aReq = aPeak;
      governing = 'caudal punta';
    }
  }
  t.record('area.required', aReq, {
    label: `Superficie requerida (gobierna ${governing})`,
    unit: 'm2',
    inputs: crit.surfaceLoadingPeakM_h !== undefined ? ['area.required.avg', 'area.required.peak'] : ['area.required.avg'],
    equation: 'A = max(Amed, Amax)',
  });
  const dTheory = t.record('tank.diameter.theoretical', circleDiameterFromArea(aReq), {
    label: 'Diámetro hidráulico teórico',
    unit: 'm',
    inputs: ['area.required'],
    equation: 'D = √(4A/π)',
  });
  const dReq = Math.max(dTheory, g.minDiameterM);

  const dDecision = decide('diameterM', () => (g.adoptedDiameterM !== undefined ? g.adoptedDiameterM : ceilTo(dReq, g.diameterRoundingStepM)));
  const D = t.record('tank.diameter', dDecision.value, {
    label: 'Diámetro interior hidráulico adoptado',
    unit: 'm',
    inputs: ['tank.diameter.theoretical', 'input.geometry.diameterRoundingStepM', 'input.geometry.minDiameterM'],
    equation: dDecision.fixed
      ? 'D fijado por la geometría existente / restricción'
      : g.adoptedDiameterM !== undefined
        ? 'D impuesto por el usuario'
        : g.diameterRoundingStepM > 0
          ? 'D = ⌈max(Dteórico, Dmín) / paso⌉ · paso'
          : 'D = max(Dteórico, Dmín) (sin redondeo)',
    origin: dDecision.fixed ? 'FIXED_BY_CONSTRAINT' : g.adoptedDiameterM !== undefined ? 'INPUT' : g.diameterRoundingStepM > 0 || g.minDiameterM > dTheory ? 'ADOPTED' : 'CALCULATED',
  });
  const R = D / 2;
  simple('HYD-DIAMETER-GE-REQUIRED', 2, D + 1e-9 >= dReq ? 'PASS' : 'FAIL', 'Diámetro adoptado ≥ requerido', D + 1e-9 >= dReq ? 'El diámetro cubre la superficie requerida.' : `El diámetro ${dDecision.fixed ? 'fijado' : 'impuesto'} (${D.toFixed(2)} m) no proporciona la superficie requerida; no se corrige automáticamente.`, { value: D, limit: `≥ ${dReq.toFixed(3)}`, unit: 'm', componentIds: ['CIV-002'] });
  criterionCheck('HYD-DIAMETER-RANGE', 3, 'diameter', D, ['CIV-002']);

  const area = t.record('tank.area', circleArea(D), { label: 'Superficie libre adoptada', unit: 'm2', inputs: ['tank.diameter'], equation: 'A = π·D²/4' });
  const chsAvg = t.record('loading.surface.avg', qAvgH / area, { label: 'Carga superficial real a caudal medio', unit: 'm3/(m2.h)', inputs: ['flow.avg.m3h', 'tank.area'], equation: 'CHS = Qmed / A' });
  const chsPeak = t.record('loading.surface.peak', qPeakH / area, { label: 'Carga superficial real a caudal punta', unit: 'm3/(m2.h)', inputs: ['flow.peak.m3h', 'tank.area'], equation: 'CHS = Qmax / A' });

  {
    const ev = evaluateRange(chsAvg, { max: crit.surfaceLoadingAvgM_h });
    simple('HYD-CHS-AVG-ADMISSIBLE', 2, ev.status, 'CHS media ≤ admisible de diseño', ev.status === 'PASS' ? 'Cumple la carga admisible adoptada.' : 'La geometría no cumple la carga superficial admisible adoptada.', { value: chsAvg, limit: ev.limit, unit: 'm³/(m²·h)', componentIds: ['CIV-002'] });
  }
  if (crit.surfaceLoadingPeakM_h !== undefined) {
    const ev = evaluateRange(chsPeak, { max: crit.surfaceLoadingPeakM_h });
    simple('HYD-CHS-PEAK-ADMISSIBLE', 2, ev.status, 'CHS punta ≤ admisible de diseño', ev.status === 'PASS' ? 'Cumple la carga admisible adoptada.' : 'La geometría no cumple la carga superficial admisible en punta.', { value: chsPeak, limit: ev.limit, unit: 'm³/(m²·h)', componentIds: ['CIV-002'] });
  } else {
    simple('HYD-CHS-PEAK-ADMISSIBLE', 2, 'NOT_EVALUATED', 'CHS punta ≤ admisible de diseño', 'No se ha definido carga superficial admisible a caudal punta.', { value: chsPeak, unit: 'm³/(m²·h)' });
  }
  criterionCheck('HYD-CHS-AVG-CRITERION', 2, 'surfaceLoadingAvg', chsAvg, ['CIV-002']);
  criterionCheck('HYD-CHS-PEAK-CRITERION', 2, 'surfaceLoadingPeak', chsPeak, ['CIV-002']);

  // ───────────────────────── 3. Profundidad y fondo ─────────────────────────
  const hDecision = decide('sideWaterDepthM', () => g.sideWaterDepthM);
  if (hDecision.fixed && Math.abs(hDecision.value - g.sideWaterDepthM) > 1e-9) {
    simple('DATA-DEPTH-LOCKED', 1, 'WARNING', 'Profundidad fijada', `La profundidad está bloqueada en ${hDecision.value} m; se ignora el valor de entrada ${g.sideWaterDepthM} m.`);
  }
  const H = t.record('tank.depth', hDecision.value, { label: 'Profundidad útil en pared (fondo → cresta)', unit: 'm', inputs: ['input.geometry.sideWaterDepthM'], equation: hDecision.fixed ? 'H fijada por la geometría existente' : 'H (dato)', origin: hDecision.fixed ? 'FIXED_BY_CONSTRAINT' : 'INPUT' });
  criterionCheck('HYD-DEPTH-CRITERION', 2, 'sideWaterDepth', H, ['CIV-002']);

  const s = g.floorSlope;
  const rs = t.record('floor.slopeStartRadius', g.slopeStartRadiusM ?? R, { label: 'Radio de comienzo de la pendiente', unit: 'm', inputs: ['tank.diameter', 'input.geometry.slopeStartRadiusM'], equation: g.slopeStartRadiusM !== undefined ? 'rs (dato)' : 'rs = D/2' , origin: g.slopeStartRadiusM !== undefined ? 'INPUT' : 'CALCULATED'});
  const rp = g.sumpDiameterM / 2;
  simple('GEO-SLOPE-START-INSIDE', 3, rs <= R + 1e-9 ? 'PASS' : 'FAIL', 'Comienzo de pendiente dentro del tanque', rs <= R + 1e-9 ? 'rs ≤ R.' : 'El radio de comienzo de pendiente supera el radio interior.', { value: rs, limit: `≤ ${R.toFixed(3)}`, unit: 'm', componentIds: ['CIV-003'] });
  simple('GEO-SUMP-INSIDE-SLOPE', 3, rp < rs ? 'PASS' : 'FAIL', 'Poceta dentro de la zona en pendiente', rp < rs ? 'rp < rs.' : 'La poceta es mayor que la zona en pendiente.', { value: rp, limit: `< ${rs.toFixed(3)}`, unit: 'm', componentIds: ['CIV-004'] });
  criterionCheck('GEO-FLOOR-SLOPE-CRITERION', 3, 'floorSlope', s, ['CIV-003']);
  const sumpDrop = t.record('floor.dropAtSump', s * Math.max(0, rs - rp), { label: 'Descenso del fondo hasta el borde de la poceta', unit: 'm', inputs: ['floor.slopeStartRadius', 'input.geometry.floorSlope', 'input.geometry.sumpDiameterM'], equation: 'Δy = s · (rs − rp)' });
  const ySumpBottom = t.record('level.sumpBottom', -sumpDrop - g.sumpDepthM, { label: 'Cota del fondo de la poceta', unit: 'm', inputs: ['floor.dropAtSump', 'input.geometry.sumpDepthM'], equation: 'y = −Δy − hp' });

  // ───────────────────────── 4. Entrada y columna central ─────────────────────────
  const inletSel = selectDn(qPeakS, hy.inletMaxVelocityM_s);
  const inletDecision = decide('inletDn', () => inletSel.dn);
  const inletDn = t.record('inlet.dn', inletDecision.value, { label: 'DN de la tubería de entrada', unit: 'mm', inputs: ['flow.peak.m3h', 'input.hydraulics.inletMaxVelocityM_s'], equation: inletDecision.fixed ? 'DN fijado' : 'menor DN (ISO 6708) con v(Qmax) ≤ vmax', origin: inletDecision.fixed ? 'FIXED_BY_CONSTRAINT' : 'ADOPTED' });
  sourcesUsed.add('ISO-6708-1995');
  const dIn = inletDn / 1000;
  const vInPeak = t.record('inlet.velocity.peak', qPeakS / circleArea(dIn), { label: 'Velocidad en la entrada a caudal punta', unit: 'm/s', inputs: ['inlet.dn', 'flow.peak.m3h'], equation: 'v = Qmax / (π·DN²/4)' });
  const vInAvg = t.record('inlet.velocity.avg', qAvgH / 3600 / circleArea(dIn), { label: 'Velocidad en la entrada a caudal medio', unit: 'm/s', inputs: ['inlet.dn', 'flow.avg.m3h'], equation: 'v = Qmed / (π·DN²/4)' });
  {
    const ev = evaluateRange(vInPeak, { max: hy.inletMaxVelocityM_s });
    simple('HYD-INLET-VMAX', 2, inletSel.exhausted && !inletDecision.fixed ? 'FAIL' : ev.status, 'Velocidad máxima en la entrada', ev.status === 'PASS' ? 'Cumple.' : 'La velocidad a caudal punta supera el máximo adoptado.', { value: vInPeak, limit: ev.limit, unit: 'm/s', componentIds: ['HYD-001'] });
    const ev2 = evaluateRange(vInAvg, { warnMin: hy.inletMinVelocityM_s });
    simple('HYD-INLET-VMIN', 2, ev2.status, 'Velocidad mínima en la entrada (autolimpieza)', ev2.status === 'PASS' ? 'Cumple.' : 'A caudal medio la velocidad es inferior a la mínima adoptada: riesgo de sedimentación en la conducción.', { value: vInAvg, limit: ev2.limit, unit: 'm/s', componentIds: ['HYD-001'] });
  }
  const rColumnInner = dIn / 2;
  const rColumnOuter = t.record('column.outerRadius', rColumnInner + hy.columnWallThicknessM, { label: 'Radio exterior de la columna central', unit: 'm', inputs: ['inlet.dn', 'input.hydraulics.columnWallThicknessM'], equation: 'rc = DN/2 + e' });
  simple('GEO-SUMP-CLEAR-OF-COLUMN', 3, rp > rColumnOuter ? 'PASS' : 'FAIL', 'Poceta mayor que la columna central', rp > rColumnOuter ? 'Queda corona libre para el lodo.' : 'La columna ocupa toda la poceta.', { value: rp - rColumnOuter, limit: '> 0', unit: 'm', componentIds: ['CIV-004', 'HYD-001'] });

  // ───────────────────────── 5. Pozo de alimentación ─────────────────────────
  const fwByRatio = hy.feedwellDiameterRatio * D;
  const fwDecision = decide('feedwellDiameterM', () => Math.max(fwByRatio, hy.feedwellMinDiameterM));
  const dFw = t.record('feedwell.diameter', fwDecision.value, {
    label: 'Diámetro del pozo de alimentación',
    unit: 'm',
    inputs: ['tank.diameter', 'input.hydraulics.feedwellDiameterRatio', 'input.hydraulics.feedwellMinDiameterM'],
    equation: fwDecision.fixed ? 'Dpa fijado' : 'Dpa = max(k · D, Dpa,mín constructivo)',
    origin: fwDecision.fixed ? 'FIXED_BY_CONSTRAINT' : fwByRatio >= hy.feedwellMinDiameterM ? 'CALCULATED' : 'ADOPTED',
    warnings: !fwDecision.fixed && fwByRatio < hy.feedwellMinDiameterM ? ['Gobierna el diámetro mínimo constructivo, no la proporción hidráulica.'] : [],
  });
  criterionCheck('HYD-FEEDWELL-RATIO', 2, 'feedwellDiameterRatio', dFw / D, ['HYD-002']);
  criterionCheck('HYD-FEEDWELL-DEPTH', 2, 'feedwellDepth', hy.feedwellDepthM, ['HYD-002']);
  simple('GEO-FEEDWELL-DEPTH-LT-H', 3, hy.feedwellDepthM < H ? 'PASS' : 'FAIL', 'Pozo de alimentación menos profundo que el tanque', hy.feedwellDepthM < H ? 'Cumple.' : 'El pozo de alimentación llega al fondo.', { value: hy.feedwellDepthM, limit: `< ${H}`, unit: 'm', componentIds: ['HYD-002'] });
  const rFwOuter = dFw / 2;
  const rFwInner = rFwOuter - hy.feedwellPlateThicknessM;
  const yFwBottom = t.record('level.feedwellBottom', H - hy.feedwellDepthM, { label: 'Cota inferior del pozo de alimentación', unit: 'm', inputs: ['tank.depth', 'input.hydraulics.feedwellDepthM'], equation: 'y = H − hpa' });
  const vFw = t.record('feedwell.downwardVelocity.peak', qPeakS / (Math.PI * (rFwInner ** 2 - rColumnOuter ** 2)), {
    label: 'Velocidad descendente en el pozo a caudal punta',
    unit: 'm/s',
    inputs: ['flow.peak.m3h', 'feedwell.diameter', 'column.outerRadius'],
    equation: 'v = Qmax / (π·(rpa,int² − rc²))',
  });
  criterionCheck('HYD-FEEDWELL-VELOCITY', 2, 'feedwellDownwardVelocityPeak', vFw, ['HYD-002']);

  // Ventanas de la columna
  const portWidth = t.record('column.portWidth', MODELLING_RULES.portWidthToPitch * ((2 * Math.PI * rColumnOuter) / hy.columnPortCount), {
    label: 'Anchura de ventana de la columna',
    unit: 'm',
    inputs: ['column.outerRadius', 'input.hydraulics.columnPortCount'],
    equation: 'b = 0,5 · 2π·rc / n (regla de modelado)',
  });
  const portDecision = decide('portHeightM', () => qPeakS / hy.portMaxVelocityM_s / (hy.columnPortCount * portWidth));
  const portHeight = t.record('column.portHeight', portDecision.value, { label: 'Altura de ventana de la columna', unit: 'm', inputs: ['flow.peak.m3h', 'input.hydraulics.portMaxVelocityM_s', 'column.portWidth'], equation: portDecision.fixed ? 'h fijada' : 'h = Qmax / (vmax · n · b)', origin: portDecision.fixed ? 'FIXED_BY_CONSTRAINT' : 'CALCULATED' });
  const vPort = t.record('column.portVelocity.peak', qPeakS / (hy.columnPortCount * portWidth * portHeight), { label: 'Velocidad en ventanas a caudal punta', unit: 'm/s', inputs: ['column.portHeight', 'column.portWidth', 'flow.peak.m3h'], equation: 'v = Qmax / (n · b · h)' });
  {
    const ev = evaluateRange(vPort, { max: hy.portMaxVelocityM_s });
    simple('HYD-PORT-VELOCITY', 2, ev.status, 'Velocidad de salida por las ventanas', ev.status === 'PASS' ? 'Cumple.' : 'La velocidad en las ventanas supera el máximo adoptado.', { value: vPort, limit: ev.limit, unit: 'm/s', componentIds: ['HYD-001', 'HYD-003'] });
    const avail = hy.feedwellDepthM - 2 * MODELLING_RULES.portMarginInFeedwellM;
    simple('GEO-PORTS-INSIDE-FEEDWELL', 3, portHeight <= avail ? 'PASS' : 'FAIL', 'Ventanas contenidas en el pozo de alimentación', portHeight <= avail ? 'Cumple.' : 'Las ventanas no caben dentro del pozo de alimentación con el margen de modelado.', { value: portHeight, limit: `≤ ${avail.toFixed(3)}`, unit: 'm', componentIds: ['HYD-001', 'HYD-002'] });
  }
  const yPortCenter = H - hy.feedwellDepthM / 2;

  // ───────────────────────── 6. Vertedero ─────────────────────────
  const weirLength = t.record('weir.length.gross', 2 * Math.PI * (R - hy.weirPlateThicknessM / 2), { label: 'Longitud bruta de vertedero', unit: 'm', inputs: ['tank.diameter', 'input.hydraulics.weirPlateThicknessM'], equation: 'L = 2π·(R − e/2)' });
  const weirEff = t.record('weir.length.effective', weirLength - hy.weirExclusionLengthM, { label: 'Longitud efectiva de vertedero', unit: 'm', inputs: ['weir.length.gross', 'input.hydraulics.weirExclusionLengthM'], equation: 'Lef = L − Lexcl' });
  simple('GEO-WEIR-LENGTH-POSITIVE', 3, weirEff > 0 ? 'PASS' : 'FAIL', 'Longitud efectiva de vertedero positiva', weirEff > 0 ? 'Cumple.' : 'Las exclusiones superan la longitud disponible.', { value: weirEff, limit: '> 0', unit: 'm', componentIds: ['HYD-004'] });
  const wlAvg = t.record('loading.weir.avg', qAvgD / weirEff, { label: 'Carga lineal de vertedero a caudal medio', unit: 'm3/(m.d)', inputs: ['flow.avg.m3d', 'weir.length.effective'], equation: 'CLV = Qdiario / Lef' });
  const wlPeak = t.record('loading.weir.peak', qPeakD / weirEff, { label: 'Carga lineal de vertedero a caudal punta', unit: 'm3/(m.d)', inputs: ['flow.peak.m3d', 'weir.length.effective'], equation: 'CLV = Qmax,diario / Lef' });
  void wlAvg;
  if (crit.weirLoadingMaxM3_md !== undefined) {
    const ev = evaluateRange(wlPeak, { max: crit.weirLoadingMaxM3_md });
    simple('HYD-WEIR-LOADING-ADMISSIBLE', 2, ev.status, 'CLV punta ≤ admisible de diseño', ev.status === 'PASS' ? 'Cumple.' : 'La carga de vertedero supera el máximo adoptado: valorar canal de doble vertedero o mayor diámetro.', { value: wlPeak, limit: ev.limit, unit: 'm³/(m·d)', componentIds: ['HYD-004'] });
  } else {
    simple('HYD-WEIR-LOADING-ADMISSIBLE', 2, 'NOT_EVALUATED', 'CLV punta ≤ admisible de diseño', 'No se ha definido carga lineal máxima de vertedero.', { value: wlPeak, unit: 'm³/(m·d)' });
  }
  criterionCheck('HYD-WEIR-LOADING-CRITERION', 2, 'weirLoadingPeak', wlPeak, ['HYD-004']);

  const notchDecision = decide('notchCount', () => Math.max(1, Math.floor(weirEff / hy.notchSpacingM)));
  const notchCount = t.record('weir.notchCount', notchDecision.value, { label: 'Número de escotaduras en V', unit: '-', inputs: ['weir.length.effective', 'input.hydraulics.notchSpacingM'], equation: notchDecision.fixed ? 'n fijado' : 'n = ⌊Lef / paso⌋', origin: notchDecision.fixed ? 'FIXED_BY_CONSTRAINT' : 'ADOPTED' });
  const theta = degToRad(hy.vNotchAngleDeg);
  sourcesUsed.add('ISO-1438-2017');
  const hPeak = t.record('weir.head.peak', vNotchHead(qPeakS / notchCount, theta, hy.weirCd), { label: 'Carga sobre escotaduras a caudal punta', unit: 'm', inputs: ['weir.notchCount', 'flow.peak.m3h', 'input.hydraulics.weirCd', 'input.hydraulics.vNotchAngleDeg'], equation: 'h = [q / (Cd·8/15·√(2g)·tan(θ/2))]^(2/5)' });
  const hAvg = t.record('weir.head.avg', vNotchHead(qAvgH / 3600 / notchCount, theta, hy.weirCd), { label: 'Carga sobre escotaduras a caudal medio', unit: 'm', inputs: ['weir.notchCount', 'flow.avg.m3h', 'input.hydraulics.weirCd', 'input.hydraulics.vNotchAngleDeg'], equation: 'h = [q / (Cd·8/15·√(2g)·tan(θ/2))]^(2/5)' });
  {
    const ev = evaluateRange(hPeak, { max: hy.notchDepthM });
    simple('HYD-NOTCH-NOT-DROWNED', 2, ev.status, 'Lámina dentro de la escotadura a caudal punta', ev.status === 'PASS' ? 'Cumple.' : 'La carga supera la profundidad de la escotadura: el vertedero trabajaría ahogado o desbordaría la chapa.', { value: hPeak, limit: ev.limit, unit: 'm', componentIds: ['HYD-004'] });
  }
  const yWaterAvg = t.record('level.water.avg', H + hAvg, { label: 'Cota de lámina a caudal medio', unit: 'm', inputs: ['tank.depth', 'weir.head.avg'], equation: 'y = H + hmed' });
  const yWaterPeak = t.record('level.water.peak', H + hPeak, { label: 'Cota de lámina a caudal punta', unit: 'm', inputs: ['tank.depth', 'weir.head.peak'], equation: 'y = H + hmax' });

  // ───────────────────────── 7. Canal perimetral y efluente ─────────────────────────
  sourcesUsed.add('CHOW-1959');
  const yUp = t.record('launder.upstreamDepth', lateralSpillChannelUpstreamDepth(qPeakS / 2, civ.launderWidthM), {
    label: 'Calado aguas arriba en el canal (cada rama, Qmax/2)',
    unit: 'm',
    inputs: ['flow.peak.m3h', 'input.civil.launderWidthM'],
    equation: 'y₀ = √3 · (Q² / (g·b²))^(1/3), Q = Qmax/2',
  });
  const freeFall = t.record('launder.freeFall', civ.launderDepthM - yUp, { label: 'Resguardo de caída libre bajo la cresta', unit: 'm', inputs: ['launder.upstreamDepth', 'input.civil.launderDepthM'], equation: 'Δ = hcanal − y₀' });
  {
    const ev = evaluateRange(freeFall, { min: hy.launderFreeFallMinM });
    simple('HYD-LAUNDER-FREE-FALL', 2, ev.status, 'Vertido libre al canal perimetral', ev.status === 'PASS' ? 'El canal no remansa el vertedero.' : 'El canal remansa el vertedero: aumentar anchura o profundidad del canal.', { value: freeFall, limit: ev.limit, unit: 'm', componentIds: ['CIV-005', 'HYD-004'] });
  }
  const effSel = selectDn(qPeakS, hy.effluentMaxVelocityM_s);
  const effDecision = decide('effluentDn', () => effSel.dn);
  const effluentDn = t.record('effluent.dn', effDecision.value, { label: 'DN del colector de efluente', unit: 'mm', inputs: ['flow.peak.m3h', 'input.hydraulics.effluentMaxVelocityM_s'], equation: effDecision.fixed ? 'DN fijado' : 'menor DN con v(Qmax) ≤ vmax', origin: effDecision.fixed ? 'FIXED_BY_CONSTRAINT' : 'ADOPTED' });
  const vEff = t.record('effluent.velocity.peak', qPeakS / circleArea(effluentDn / 1000), { label: 'Velocidad en el colector de efluente a caudal punta', unit: 'm/s', inputs: ['effluent.dn', 'flow.peak.m3h'], equation: 'v = Qmax / (π·DN²/4)' });
  {
    const ev = evaluateRange(vEff, { max: hy.effluentMaxVelocityM_s });
    simple('HYD-EFFLUENT-VMAX', 2, effSel.exhausted && !effDecision.fixed ? 'FAIL' : ev.status, 'Velocidad en el colector de efluente', ev.status === 'PASS' ? 'Cumple.' : 'Supera la velocidad máxima adoptada.', { value: vEff, limit: ev.limit, unit: 'm/s', componentIds: ['HYD-005'] });
    const od = effluentDn / 1000 + 2 * hy.pipeWallThicknessM;
    simple('GEO-EFFLUENT-FITS-LAUNDER', 3, od <= civ.launderWidthM ? 'PASS' : 'FAIL', 'Colector de efluente cabe en el canal', od <= civ.launderWidthM ? 'El diámetro exterior cabe en la anchura del canal.' : 'El colector es más ancho que el canal perimetral.', { value: od, limit: `≤ ${civ.launderWidthM}`, unit: 'm', componentIds: ['HYD-005', 'CIV-005'] });
  }

  // ───────────────────────── 8. Lodos ─────────────────────────
  const qSludge = t.record('sludge.flow', qAvgH * hy.sludgeFlowFraction, { label: 'Caudal de purga para dimensionar la conducción', unit: 'm3/h', inputs: ['flow.avg.m3h', 'input.hydraulics.sludgeFlowFraction'], equation: 'Qlodo = f · Qmed (hipótesis de prediseño)' });
  const sludgeSel = selectDn(qSludge / 3600, hy.sludgeDesignVelocityM_s, hy.sludgePipeMinDn);
  const sludgeDecision = decide('sludgeDn', () => sludgeSel.dn);
  const sludgeDn = t.record('sludge.dn', sludgeDecision.value, { label: 'DN de la conducción de lodos', unit: 'mm', inputs: ['sludge.flow', 'input.hydraulics.sludgePipeMinDn', 'input.hydraulics.sludgeDesignVelocityM_s'], equation: sludgeDecision.fixed ? 'DN fijado' : 'max(DNmín, menor DN con v ≤ v diseño)', origin: sludgeDecision.fixed ? 'FIXED_BY_CONSTRAINT' : 'ADOPTED' });
  {
    simple('HYD-SLUDGE-MIN-DN', 2, sludgeDn >= hy.sludgePipeMinDn ? 'PASS' : 'FAIL', 'DN mínimo de la conducción de lodos', sludgeDn >= hy.sludgePipeMinDn ? 'Cumple.' : 'Inferior al DN mínimo adoptado.', { value: sludgeDn, limit: `≥ ${hy.sludgePipeMinDn}`, unit: 'mm', componentIds: ['HYD-006'] });
    const od = sludgeDn / 1000 + 2 * hy.pipeWallThicknessM;
    simple('GEO-SLUDGE-FITS-SUMP', 3, od < g.sumpDepthM ? 'PASS' : 'FAIL', 'Conducción de lodos cabe en la altura de la poceta', od < g.sumpDepthM ? 'Cumple.' : 'El tubo no cabe en la altura de la poceta.', { value: od, limit: `< ${g.sumpDepthM}`, unit: 'm', componentIds: ['HYD-006', 'CIV-004'] });
    simple('HYD-SLUDGE-HYDRAULICS', 2, 'NOT_EVALUATED', 'Hidráulica de purga de lodos', 'Pérdidas, carga disponible, bombeo o purga telescópica no evaluados en V1. El caudal de purga es una hipótesis de prediseño.', { componentIds: ['HYD-006'] });
  }

  // ───────────────────────── 9. Volumen y retención ─────────────────────────
  const vCyl = t.record('volume.cylinder', cylinderVolume(R, H), { label: 'Volumen cilíndrico sobre el fondo en pared', unit: 'm3', inputs: ['tank.diameter', 'tank.depth'], equation: 'V = π·R²·H' });
  const vCone = t.record('volume.floorCone', conicalFloorVolume(s, rs, rp), { label: 'Volumen del fondo en pendiente (sin poceta)', unit: 'm3', inputs: ['input.geometry.floorSlope', 'floor.slopeStartRadius', 'input.geometry.sumpDiameterM'], equation: 'V = 2π·s·[rs·r²/2 − r³/3]rp→rs + π·rp²·s·(rs − rp)' });
  const vGross = t.record('volume.gross', vCyl + vCone, { label: 'Volumen hidráulico bruto', unit: 'm3', inputs: ['volume.cylinder', 'volume.floorCone'], equation: 'Vbruto = Vcil + Vfondo' });
  const vColumn = t.record('volume.deduction.column', Math.PI * rColumnOuter ** 2 * (H + sumpDrop), { label: 'Deducción: columna central', unit: 'm3', inputs: ['column.outerRadius', 'tank.depth', 'floor.dropAtSump'], equation: 'V = π·rc²·(H + Δy)' });
  const vFeedwell = t.record(
    'volume.deduction.feedwell',
    g.excludeFeedwellFromEffectiveVolume ? Math.PI * (rFwInner ** 2 - rColumnOuter ** 2) * hy.feedwellDepthM : 0,
    { label: 'Deducción: interior del pozo de alimentación', unit: 'm3', inputs: ['feedwell.diameter', 'column.outerRadius', 'input.hydraulics.feedwellDepthM'], equation: g.excludeFeedwellFromEffectiveVolume ? 'V = π·(rpa,int² − rc²)·hpa' : 'No se deduce (opción de entrada)' },
  );
  const vEffective = t.record('volume.effective', vGross - vColumn - vFeedwell, { label: 'Volumen efectivo de sedimentación', unit: 'm3', inputs: ['volume.gross', 'volume.deduction.column', 'volume.deduction.feedwell'], equation: 'Vef = Vbruto − Vcolumna − Vpozo (se desprecian chapas y mecanismos)' });
  t.record('volume.sump', Math.PI * rp * rp * g.sumpDepthM - Math.PI * rColumnOuter ** 2 * g.sumpDepthM, { label: 'Volumen de la poceta (almacenamiento de lodo, no efectivo)', unit: 'm3', inputs: ['input.geometry.sumpDiameterM', 'input.geometry.sumpDepthM', 'column.outerRadius'], equation: 'V = π·(rp² − rc²)·hp' });
  const hrtAvg = t.record('hrt.avg', vEffective / qAvgH, { label: 'TRH a caudal medio', unit: 'h', inputs: ['volume.effective', 'flow.avg.m3h'], equation: 'TRH = Vef / Qmed' });
  t.record('hrt.peak', vEffective / qPeakH, { label: 'TRH a caudal punta', unit: 'h', inputs: ['volume.effective', 'flow.peak.m3h'], equation: 'TRH = Vef / Qmax' });
  if (crit.hrtTargetMinH !== undefined) {
    const ev = evaluateRange(hrtAvg, { min: crit.hrtTargetMinH });
    simple('HYD-HRT-TARGET', 2, ev.status, 'TRH ≥ objetivo de diseño', ev.status === 'PASS' ? 'Cumple.' : 'El TRH es inferior al objetivo: no se profundiza automáticamente; revisar H.', { value: hrtAvg, limit: ev.limit, unit: 'h', componentIds: ['CIV-002'] });
  } else {
    simple('HYD-HRT-TARGET', 2, 'NOT_EVALUATED', 'TRH ≥ objetivo de diseño', 'No se ha definido TRH objetivo.', { value: hrtAvg, unit: 'h' });
  }
  criterionCheck('HYD-HRT-CRITERION', 2, 'hrtAvg', hrtAvg, ['CIV-002']);
  simple('HYD-REMOVAL-EFFICIENCY', 2, 'NOT_EVALUATED', 'Eficiencia de eliminación de SST y DBO₅', 'V1 conserva la calidad del agua como dato técnico pero no calcula rendimientos (spec §4.1).', {});

  // ───────────────────────── 10. Obra civil (cotas y radios) ─────────────────────────
  const ySlabTop = t.record('level.slabTop', -sumpDrop - civ.minFillThicknessM, { label: 'Cota superior de la losa', unit: 'm', inputs: ['floor.dropAtSump', 'input.civil.minFillThicknessM'], equation: 'y = −Δy − efill,mín' });
  const ySlabBottom = t.record('level.slabBottom', ySlabTop - civ.baseSlabThicknessM, { label: 'Cota inferior de la losa', unit: 'm', inputs: ['level.slabTop', 'input.civil.baseSlabThicknessM'], equation: 'y = ylosa − elosa' });
  const yPitBottom = t.record('level.pitBottom', Math.min(ySumpBottom - civ.sumpWallThicknessM, ySlabBottom), { label: 'Cota inferior del bloque de la poceta', unit: 'm', inputs: ['level.sumpBottom', 'level.slabBottom', 'input.civil.sumpWallThicknessM'], equation: 'y = min(yp − ep, ylosa,inf)' });
  const rSumpOuter = rp + civ.sumpWallThicknessM;
  const rWallOuter = t.record('civil.wallOuterRadius', R + civ.wallThicknessM, { label: 'Radio exterior del muro', unit: 'm', inputs: ['tank.diameter', 'input.civil.wallThicknessM'], equation: 'r = R + em' });
  t.record('civil.structuralOuterDiameter', 2 * rWallOuter, { label: 'Diámetro exterior estructural', unit: 'm', inputs: ['civil.wallOuterRadius'], equation: 'Dext = D + 2·em' });
  const rLaunderOuter = rWallOuter + civ.launderWidthM;
  const rChannelOuter = t.record('civil.channelOuterRadius', rLaunderOuter + civ.channelWallThicknessM, { label: 'Radio exterior del canal perimetral', unit: 'm', inputs: ['civil.wallOuterRadius', 'input.civil.launderWidthM', 'input.civil.channelWallThicknessM'], equation: 'r = Rext + b + ec' });
  t.record('civil.channelOuterDiameter', 2 * rChannelOuter, { label: 'Diámetro exterior del canal de recogida', unit: 'm', inputs: ['civil.channelOuterRadius'], equation: 'Dcanal = 2·r' });
  const rSlab = t.record('civil.slabRadius', rWallOuter + civ.slabProjectionM, { label: 'Radio de la losa', unit: 'm', inputs: ['civil.wallOuterRadius', 'input.civil.slabProjectionM'], equation: 'r = Rext + vuelo' });
  const yLaunderFloor = H - civ.launderDepthM;
  const yChannelTop = t.record('level.channelTop', H + g.freeboardM, { label: 'Coronación del canal perimetral', unit: 'm', inputs: ['tank.depth', 'input.geometry.freeboardM'], equation: 'y = H + resguardo' });
  simple('HYD-FREEBOARD-OVER-PEAK', 2, yChannelTop > yWaterPeak ? 'PASS' : 'FAIL', 'Coronación sobre la lámina en punta', yChannelTop > yWaterPeak ? 'Cumple.' : 'La lámina en punta supera la coronación.', { value: yChannelTop - yWaterPeak, limit: '> 0', unit: 'm', componentIds: ['CIV-005'] });

  const pipeWall = hy.pipeWallThicknessM;
  const yInletAxis = t.record('level.inletAxis', Math.min(ySlabBottom, yPitBottom) - MODELLING_RULES.buriedPipeCoverM - (dIn / 2 + pipeWall), { label: 'Cota del eje de la tubería de entrada', unit: 'm', inputs: ['level.slabBottom', 'level.pitBottom', 'inlet.dn'], equation: 'y = min(ylosa,inf, ypoceta,inf) − recubrimiento − rext' });
  const ySludgeAxis = ySumpBottom + sludgeDn / 2000 + pipeWall;
  const yEffluentAxis = yLaunderFloor - civ.channelFloorThicknessM - MODELLING_RULES.effluentDropM;

  // ───────────────────────── 11. Puente y mecanismo ─────────────────────────
  const rBearing = rLaunderOuter + civ.channelWallThicknessM / 2;
  const span = t.record('bridge.span', me.bridgeType === 'full-span' ? 2 * rBearing : rBearing, { label: `Luz del puente (${me.bridgeType === 'full-span' ? 'vano completo' : 'radial'})`, unit: 'm', inputs: ['civil.channelOuterRadius', 'input.mechanical.bridgeType'], equation: me.bridgeType === 'full-span' ? 'L = 2·rapoyo' : 'L = rapoyo (desde la columna central)' });
  const yBridgeBearing = yChannelTop;
  const yGirderBottom = yBridgeBearing + me.bridgeBearingHeightM;
  const yDeck = t.record('level.bridgeDeck', yGirderBottom + me.bridgeGirderDepthM, { label: 'Cota del tablero del puente', unit: 'm', inputs: ['level.channelTop', 'input.mechanical.bridgeBearingHeightM', 'input.mechanical.bridgeGirderDepthM'], equation: 'y = ycoronación + apoyo + canto' });
  {
    const clr = yGirderBottom - yWaterPeak;
    const ev = evaluateRange(clr, { min: me.bridgeClearanceAboveWaterMinM });
    simple('GEO-BRIDGE-CLEARANCE', 3, ev.status, 'Gálibo del puente sobre la lámina en punta', ev.status === 'PASS' ? 'Cumple.' : 'Gálibo insuficiente.', { value: clr, limit: ev.limit, unit: 'm', componentIds: ['MEC-001'] });
  }
  criterionCheck('GEO-WALKWAY-WIDTH', 4, 'walkwayClearWidth', me.bridgeWidthM, ['MEC-001']);

  const cageMember = MODELLING_RULES.cageMemberM;
  {
    const clr = me.cageHalfWidthM - cageMember / 2 - rColumnOuter;
    const ev = evaluateRange(clr, { min: me.cageColumnClearanceM });
    simple('GEO-CAGE-COLUMN', 3, ev.status, 'Holgura jaula giratoria – columna', ev.status === 'PASS' ? 'Cumple.' : 'La jaula interfiere con la columna central.', { value: clr, limit: ev.limit, unit: 'm', componentIds: ['MEC-003', 'HYD-001'] });
    const corner = Math.SQRT2 * me.cageHalfWidthM + cageMember / 2;
    const clr2 = rFwInner - corner;
    const ev2 = evaluateRange(clr2, { min: me.cageColumnClearanceM });
    simple('GEO-CAGE-FEEDWELL', 3, ev2.status, 'Holgura jaula giratoria – pozo de alimentación', ev2.status === 'PASS' ? 'Cumple.' : 'La jaula interfiere con el pozo de alimentación.', { value: clr2, limit: ev2.limit, unit: 'm', componentIds: ['MEC-003', 'HYD-002'] });
  }

  const rArmRoot = me.cageHalfWidthM;
  const rArmTip = t.record('arm.tipRadius', R - me.armWallClearanceM, { label: 'Radio de punta de los brazos', unit: 'm', inputs: ['tank.diameter', 'input.mechanical.armWallClearanceM'], equation: 'r = R − holgura' });
  t.record('arm.length', rArmTip - rArmRoot, { label: 'Longitud de brazo portarrasquetas (en planta)', unit: 'm', inputs: ['arm.tipRadius', 'input.mechanical.cageHalfWidthM'], equation: 'L = rpunta − rjaula' });
  {
    const yArmTopAtFw = floorElevation({ floorSlope: s, rSlopeStart: rs, rSump: rp }, rFwOuter) + me.bladeFloorClearanceM + me.bladeHeightM + me.armTrussDepthM;
    const clr = yFwBottom - yArmTopAtFw;
    const ev = evaluateRange(clr, { min: me.feedwellArmClearanceMinM });
    simple('GEO-FEEDWELL-ARMS', 3, ev.status, 'Holgura pozo de alimentación – brazos', ev.status === 'PASS' ? 'Cumple.' : 'El pozo de alimentación interfiere con los brazos.', { value: clr, limit: ev.limit, unit: 'm', componentIds: ['HYD-002', 'MEC-004'] });
  }

  const rBaffleInner = R - me.scumBaffleOffsetM - hy.weirPlateThicknessM;
  const rSkimmerStart = rFwOuter + me.skimmerClearanceM;
  const rSkimmerTip = rBaffleInner - me.skimmerClearanceM;
  simple('GEO-SKIMMER-LENGTH', 3, rSkimmerTip > rSkimmerStart ? 'PASS' : 'FAIL', 'Espacio para el barredor de flotantes', rSkimmerTip > rSkimmerStart ? 'Cumple.' : 'No queda corona libre entre el pozo de alimentación y el deflector de flotantes.', { value: rSkimmerTip - rSkimmerStart, limit: '> 0', unit: 'm', componentIds: ['MEC-006', 'HYD-002'] });
  simple('GEO-SKIMMER-REACHES-BOX', 3, rSkimmerTip >= rBaffleInner - me.scumBoxLengthM ? 'PASS' : 'FAIL', 'El barredor alcanza la caja de flotantes', rSkimmerTip >= rBaffleInner - me.scumBoxLengthM ? 'Cumple.' : 'El barredor no llega a la playa de la caja de flotantes.', { componentIds: ['MEC-006'] });

  const decisions: SizingDecisions = {
    diameterM: D,
    sideWaterDepthM: H,
    inletDn,
    portHeightM: portHeight,
    feedwellDiameterM: dFw,
    notchCount,
    effluentDn,
    sludgeDn,
  };

  const model: ResolvedModel = {
    D,
    R,
    H,
    floorSlope: s,
    rSlopeStart: rs,
    rSump: rp,
    rSumpOuter,
    sumpDrop,
    ySumpBottom,
    ySlabTop,
    ySlabBottom,
    yPitBottom,
    rSlab,
    rWallOuter,
    rLaunderOuter,
    rChannelOuter,
    yLaunderFloor,
    yChannelTop,
    channelFloorThickness: civ.channelFloorThicknessM,
    yWaterAvg,
    yWaterPeak,
    weirPlateThickness: hy.weirPlateThicknessM,
    notchDepth: hy.notchDepthM,
    notchCount,
    notchAngle: theta,
    rColumnInner,
    rColumnOuter,
    yInletAxis,
    yColumnTop: me.bridgeType === 'radial' ? yGirderBottom : yChannelTop,
    portCount: hy.columnPortCount,
    portWidth,
    portHeight,
    yPortCenter,
    rFeedwellOuter: rFwOuter,
    rFeedwellInner: rFwInner,
    yFeedwellBottom: yFwBottom,
    yFeedwellTop: yWaterPeak + MODELLING_RULES.feedwellTopAboveWaterM,
    inletDnM: dIn,
    effluentDnM: effluentDn / 1000,
    sludgeDnM: sludgeDn / 1000,
    pipeWall,
    ySludgeAxis,
    yEffluentAxis,
    bridgeType: me.bridgeType,
    rBearing,
    bridgeSpan: span,
    bridgeWidth: me.bridgeWidthM,
    yBridgeBearing,
    yGirderBottom,
    yDeck,
    driveFootprint: me.driveFootprintM,
    driveHeight: me.driveHeightM,
    cageHalfWidth: me.cageHalfWidthM,
    cageMember,
    armCount: me.armCount,
    rArmRoot,
    rArmTip,
    armTrussDepth: me.armTrussDepthM,
    bladeHeight: me.bladeHeightM,
    bladeClearance: me.bladeFloorClearanceM,
    bladeLength: me.bladeLengthM,
    bladeAngle: degToRad(me.bladeAngleDeg),
    bladeThickness: MODELLING_RULES.bladeThicknessM,
    rBaffleInner,
    baffleThickness: hy.weirPlateThicknessM,
    yBaffleBottom: H - me.scumBaffleDepthM,
    yBaffleTop: yWaterPeak + MODELLING_RULES.baffleTopAboveWaterM,
    rSkimmerStart,
    rSkimmerTip,
    scumBoxLength: me.scumBoxLengthM,
    scumBoxWidth: me.scumBoxWidthM,
    segments: input.meshResolution.circularSegments,
  };

  return { trace: t, decisions, model, sourcesUsed };
}
