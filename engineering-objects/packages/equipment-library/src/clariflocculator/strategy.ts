import {
  ceilTo,
  circleArea,
  circleDiameterFromArea,
  evaluateRange,
  getReference,
  requiredSurfaceArea,
  unitLabel,
  waterDensity,
  waterDynamicViscosity,
  type ValidationLevel,
} from '@eo/engineering-core';
import { MODELLING_RULES, type CentralZoneStrategy, type ChamberResult, type EngineContext, type SurfaceResult } from '../primary-clarifier/definition/engine.js';
import type { Criterion } from '../primary-clarifier/definition/profiles.js';
import { CLF_CRITERION_META, type ClfCriterionKey } from './profiles.js';
import type { ClfInput } from './schema.js';

export const CLF_MODEL_VERSION = 'CF-ENG-1.1.0';

/** Reglas de modelado del agitador (no son criterios de diseño). */
export const FLOC_RULES = {
  /** Paso radial entre anillos de paletas = 2 · anchura de paleta. */
  ringPitchToBladeWidth: 2,
} as const;

/** Resultado del agitador que necesitan la geometría y las comprobaciones. */
export interface PaddleLayout {
  readonly available: boolean;
  readonly rChamberInner: number;
  readonly rSleeveInner: number;
  readonly rSleeveOuter: number;
  /** Radios de los ejes de las paletas de cada anillo (de fuera hacia dentro). */
  readonly ringRadii: readonly number[];
  readonly armCount: number;
  readonly bladeWidth: number;
  readonly bladeHeight: number;
  readonly bladeThickness: number;
  /** Cota del centro de las paletas. */
  readonly yCenter: number;
  readonly angularSpeedRadS: number;
}

export interface ClfStrategyState {
  readonly strategy: CentralZoneStrategy;
  /** Disponible tras ejecutar el motor. */
  layout(): PaddleLayout;
  decisions(): { paddleRings: number };
  sourcesUsed(): Set<string>;
  /** Potencia útil entregada por las paletas, W (undefined si no se pudo calcular). */
  powerDelivered(): number | undefined;
}

/**
 * Estrategia del clarifloculador. La cámara central se dimensiona por tiempo de floculación
 * (V = Q·t) y el diámetro del tanque por la superficie ANULAR de sedimentación:
 *   D = √(4·(As + π·Dcámara²/4)/π)
 * La potencia de floculación es P = G²·μ·V y las paletas se dimensionan con P = ½·CD·ρ·A·vr³.
 */
export function createClfStrategy(clf: ClfInput, criteria: Partial<Record<ClfCriterionKey, Criterion>>, fixedRings?: number): ClfStrategyState {
  const fl = clf.flocculation;
  const pd = fl.paddles;
  const sources = new Set<string>();
  let chamberOuter = NaN;
  let layout: PaddleLayout | undefined;
  let rings = 0;
  let delivered: number | undefined;

  /** Comprobación frente a un criterio del clarifloculador (propio o común). */
  const clfCriterion = (ctx: EngineContext, id: string, level: ValidationLevel, key: ClfCriterionKey, value: number, componentIds: string[]) => {
    const c = criteria[key];
    const meta = CLF_CRITERION_META[key];
    if (!c) {
      ctx.simple(id, level, 'NOT_EVALUATED', meta.label, 'El perfil de diseño no define criterio para esta magnitud.', { value, unit: unitLabel(meta.unit), componentIds });
      return;
    }
    sources.add(c.sourceId);
    for (const s of c.inheritedSourceIds ?? []) sources.add(s);
    const ev = evaluateRange(value, c.constraint);
    const ref = getReference(c.sourceId);
    ctx.checks.add({
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

  const designFlowKey = fl.designFlow === 'average' ? 'flow.avg.m3h' : 'flow.peak.m3h';

  const sizeSurface = (ctx: EngineContext): SurfaceResult => {
    const { t, input, simple, criterionCheck, decide } = ctx;
    const g = input.geometry;
    const crit = input.designCriteria;
    const { avgH: qAvgH, peakH: qPeakH } = ctx.flows;
    const qDesign = fl.designFlow === 'average' ? qAvgH : qPeakH;

    // ── Cámara de floculación ──
    const vReq = t.record('floc.volume.required', (qDesign * fl.detentionTimeMin) / 60, {
      label: 'Volumen de floculación requerido',
      unit: 'm3',
      inputs: [designFlowKey, 'input.flocculation.detentionTimeMin'],
      equation: `Vf = Q${fl.designFlow === 'average' ? 'med' : 'max'} · tf`,
    });
    const { rColumnOuter } = ctx.inlet();
    const aNet = t.record('floc.area.net', vReq / fl.chamberDepthM, { label: 'Superficie neta de la cámara de floculación', unit: 'm2', inputs: ['floc.volume.required', 'input.flocculation.chamberDepthM'], equation: 'Af = Vf / hf' });
    const dInReq = t.record('floc.chamber.innerDiameter.required', circleDiameterFromArea(aNet + Math.PI * rColumnOuter ** 2), {
      label: 'Diámetro interior requerido de la cámara',
      unit: 'm',
      inputs: ['floc.area.net', 'column.outerRadius'],
      equation: 'Df,int = √(4·(Af + π·rc²)/π)',
    });
    const dIn = Math.max(dInReq, fl.chamberMinInnerDiameterM);
    const chamberDecision = decide('feedwellDiameterM', () => dIn + 2 * fl.chamberWallThicknessM);
    chamberOuter = t.record('feedwell.diameter', chamberDecision.value, {
      label: 'Diámetro exterior de la cámara de floculación',
      unit: 'm',
      inputs: ['floc.chamber.innerDiameter.required', 'input.flocculation.chamberMinInnerDiameterM', 'input.flocculation.chamberWallThicknessM'],
      equation: chamberDecision.fixed ? 'Df fijado' : 'Df = max(Df,int, Df,int,mín) + 2·e',
      origin: chamberDecision.fixed ? 'FIXED_BY_CONSTRAINT' : dIn > dInReq ? 'ADOPTED' : 'CALCULATED',
      warnings: !chamberDecision.fixed && dIn > dInReq ? ['Gobierna el diámetro interior mínimo constructivo.'] : [],
    });

    // ── Superficie de sedimentación (corona) ──
    const aAvg = t.record('area.required.avg', requiredSurfaceArea(qAvgH, crit.surfaceLoadingAvgM_h), {
      label: 'Superficie de sedimentación requerida a caudal medio',
      unit: 'm2',
      inputs: ['flow.avg.m3h', 'input.designCriteria.settlingLoadingAvgM_h'],
      equation: 'As = Qmed / CHSmed',
    });
    let aReq = aAvg;
    let governing = 'caudal medio';
    if (crit.surfaceLoadingPeakM_h !== undefined) {
      const aPeak = t.record('area.required.peak', requiredSurfaceArea(qPeakH, crit.surfaceLoadingPeakM_h), {
        label: 'Superficie de sedimentación requerida a caudal punta',
        unit: 'm2',
        inputs: ['flow.peak.m3h', 'input.designCriteria.settlingLoadingPeakM_h'],
        equation: 'As = Qmax / CHSmax',
      });
      if (aPeak > aReq) {
        aReq = aPeak;
        governing = 'caudal punta';
      }
    }
    t.record('area.required', aReq, {
      label: `Superficie de sedimentación requerida (gobierna ${governing})`,
      unit: 'm2',
      inputs: crit.surfaceLoadingPeakM_h !== undefined ? ['area.required.avg', 'area.required.peak'] : ['area.required.avg'],
      equation: 'As = max(As,med, As,max)',
    });
    const dTheory = t.record('tank.diameter.theoretical', circleDiameterFromArea(aReq + circleArea(chamberOuter)), {
      label: 'Diámetro hidráulico teórico (corona + cámara)',
      unit: 'm',
      inputs: ['area.required', 'feedwell.diameter'],
      equation: 'D = √(4·(As + π·Df²/4)/π)',
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
    simple('HYD-DIAMETER-GE-REQUIRED', 2, D + 1e-9 >= dReq ? 'PASS' : 'FAIL', 'Diámetro adoptado ≥ requerido', D + 1e-9 >= dReq ? 'El diámetro cubre la cámara y la superficie de sedimentación requerida.' : `El diámetro ${dDecision.fixed ? 'fijado' : 'impuesto'} (${D.toFixed(2)} m) no proporciona la superficie requerida; no se corrige automáticamente.`, { value: D, limit: `≥ ${dReq.toFixed(3)}`, unit: 'm', componentIds: ['CIV-002'] });
    criterionCheck('HYD-DIAMETER-RANGE', 3, 'diameter', D, ['CIV-002']);

    const gross = t.record('tank.area', circleArea(D), { label: 'Superficie libre total', unit: 'm2', inputs: ['tank.diameter'], equation: 'A = π·D²/4' });
    const annulus = gross - circleArea(chamberOuter);
    const annulusOk = annulus > 0;
    simple('GEO-SETTLING-ANNULUS', 3, annulusOk ? 'PASS' : 'FAIL', 'Corona de sedimentación alrededor de la cámara', annulusOk ? 'Cumple.' : 'La cámara de floculación ocupa todo el tanque.', { value: annulus, limit: '> 0', unit: 'm²', componentIds: ['CIV-002', 'HYD-002'] });
    if (!annulusOk) {
      for (const [id, title] of [
        ['HYD-CHS-AVG-ADMISSIBLE', 'CHS media ≤ admisible de diseño'],
        ['HYD-CHS-PEAK-ADMISSIBLE', 'CHS punta ≤ admisible de diseño'],
        ['HYD-CHS-AVG-CRITERION', CLF_CRITERION_META.surfaceLoadingAvg.label],
        ['HYD-CHS-PEAK-CRITERION', CLF_CRITERION_META.surfaceLoadingPeak.label],
      ] as const) {
        simple(id, 2, 'NOT_EVALUATED', title, 'No calculable: no existe corona de sedimentación (ver GEO-SETTLING-ANNULUS).', { componentIds: ['CIV-002'] });
      }
      // Sin corona, las cargas de sólidos se refieren a la superficie total (se avisa en GEO-SETTLING-ANNULUS).
      return { D, loadingArea: gross, loadingAreaKey: 'tank.area', loadingAreaLabel: 'superficie total (sin corona)' };
    }
    const area = t.record('settling.area', annulus, { label: 'Superficie de sedimentación (corona)', unit: 'm2', inputs: ['tank.area', 'feedwell.diameter'], equation: 'As = π·(D² − Df²)/4' });
    const chsAvg = t.record('loading.surface.avg', qAvgH / area, { label: 'Carga superficial real en la corona a caudal medio', unit: 'm3/(m2.h)', inputs: ['flow.avg.m3h', 'settling.area'], equation: 'CHS = Qmed / As' });
    const chsPeak = t.record('loading.surface.peak', qPeakH / area, { label: 'Carga superficial real en la corona a caudal punta', unit: 'm3/(m2.h)', inputs: ['flow.peak.m3h', 'settling.area'], equation: 'CHS = Qmax / As' });
    {
      const ev = evaluateRange(chsAvg, { max: crit.surfaceLoadingAvgM_h });
      simple('HYD-CHS-AVG-ADMISSIBLE', 2, ev.status, 'CHS media ≤ admisible de diseño', ev.status === 'PASS' ? 'Cumple la carga admisible adoptada en la corona.' : 'La corona de sedimentación no cumple la carga superficial admisible adoptada.', { value: chsAvg, limit: ev.limit, unit: 'm³/(m²·h)', componentIds: ['CIV-002'] });
    }
    if (crit.surfaceLoadingPeakM_h !== undefined) {
      const ev = evaluateRange(chsPeak, { max: crit.surfaceLoadingPeakM_h });
      simple('HYD-CHS-PEAK-ADMISSIBLE', 2, ev.status, 'CHS punta ≤ admisible de diseño', ev.status === 'PASS' ? 'Cumple la carga admisible adoptada en la corona.' : 'La corona de sedimentación no cumple la carga admisible en punta.', { value: chsPeak, limit: ev.limit, unit: 'm³/(m²·h)', componentIds: ['CIV-002'] });
    } else {
      simple('HYD-CHS-PEAK-ADMISSIBLE', 2, 'NOT_EVALUATED', 'CHS punta ≤ admisible de diseño', 'No se ha definido carga superficial admisible a caudal punta.', { value: chsPeak, unit: 'm³/(m²·h)' });
    }
    clfCriterion(ctx, 'HYD-CHS-AVG-CRITERION', 2, 'surfaceLoadingAvg', chsAvg, ['CIV-002']);
    clfCriterion(ctx, 'HYD-CHS-PEAK-CRITERION', 2, 'surfaceLoadingPeak', chsPeak, ['CIV-002']);
    return { D, loadingArea: area, loadingAreaKey: 'settling.area', loadingAreaLabel: 'corona de sedimentación' };
  };

  const sizeChamber = (ctx: EngineContext, _D: number, H: number): ChamberResult => {
    const { t, input, simple } = ctx;
    const me = input.mechanical;
    const hf = fl.chamberDepthM;
    simple('GEO-CHAMBER-DEPTH-LT-H', 3, hf < H ? 'PASS' : 'FAIL', 'Cámara de floculación menos profunda que el tanque', hf < H ? 'Cumple.' : 'La cámara de floculación llega al fondo.', { value: hf, limit: `< ${H}`, unit: 'm', componentIds: ['HYD-002'] });

    const { rColumnOuter } = ctx.inlet();
    const rIn = chamberOuter / 2 - fl.chamberWallThicknessM;
    const rSleeveIn = Math.SQRT2 * me.cageHalfWidthM + MODELLING_RULES.cageMemberM / 2 + pd.sleeveClearanceM;
    const rSleeveOut = rSleeveIn + pd.sleeveWallThicknessM;
    const bladeH = pd.bladeHeightRatio * hf;
    const yCenter = H - hf / 2;
    const unavailable = (why: string) => {
      for (const [id, key] of [
        ['HYD-FLOC-TIME-CRITERION', 'flocculationTime'],
        ['HYD-FLOC-G-CRITERION', 'velocityGradient'],
        ['HYD-FLOC-GT-CRITERION', 'gtProduct'],
        ['HYD-FLOC-TIP-SPEED', 'paddleTipSpeed'],
        ['HYD-FLOC-PADDLE-AREA', 'paddleAreaRatio'],
      ] as const) {
        simple(id, 2, 'NOT_EVALUATED', CLF_CRITERION_META[key].label, why, { componentIds: ['HYD-002', 'MEC-007'] });
      }
      simple('HYD-FLOC-TIME-TARGET', 2, 'NOT_EVALUATED', 'Tiempo de floculación ≥ objetivo de diseño', why, { componentIds: ['HYD-002'] });
      simple('HYD-FLOC-POWER', 2, 'NOT_EVALUATED', 'Potencia de paletas ≥ potencia requerida', why, { componentIds: ['MEC-007'] });
      layout = { available: false, rChamberInner: rIn, rSleeveInner: rSleeveIn, rSleeveOuter: rSleeveOut, ringRadii: [], armCount: pd.armCount, bladeWidth: pd.bladeWidthM, bladeHeight: bladeH, bladeThickness: pd.bladeThicknessM, yCenter, angularSpeedRadS: 0 };
      rings = fixedRings ?? 0;
    };
    if (!(rIn > rColumnOuter)) {
      unavailable('No calculable: no existe volumen de floculación entre la columna y la pared de la cámara.');
      return { dFw: chamberOuter, depth: hf, depthKey: 'input.flocculation.chamberDepthM' };
    }

    // ── Volumen y tiempos ──
    const vf = t.record('floc.volume', Math.PI * (rIn ** 2 - rColumnOuter ** 2) * hf, { label: 'Volumen útil de floculación', unit: 'm3', inputs: ['feedwell.diameter', 'column.outerRadius', 'input.flocculation.chamberDepthM', 'input.flocculation.chamberWallThicknessM'], equation: 'Vf = π·(rf,int² − rc²)·hf' });
    const qDesignS = (fl.designFlow === 'average' ? ctx.flows.avgH : ctx.flows.peakH) / 3600;
    const tDesign = t.record('floc.time.design', vf / qDesignS / 60, { label: 'Tiempo de floculación al caudal de diseño', unit: 'min', inputs: ['floc.volume', designFlowKey], equation: 'tf = Vf / Qdiseño' });
    t.record('floc.time.peak', vf / ctx.flows.peakS / 60, { label: 'Tiempo de floculación a caudal punta', unit: 'min', inputs: ['floc.volume', 'flow.peak.m3h'], equation: 'tf = Vf / Qmax' });
    {
      const ev = evaluateRange(tDesign, { min: fl.detentionTimeMin * (1 - 1e-9) });
      simple('HYD-FLOC-TIME-TARGET', 2, ev.status, 'Tiempo de floculación ≥ objetivo de diseño', ev.status === 'PASS' ? 'Cumple.' : 'La cámara no proporciona el tiempo de floculación adoptado: no se agranda automáticamente.', { value: tDesign, limit: ev.limit, unit: 'min', componentIds: ['HYD-002'] });
    }
    clfCriterion(ctx, 'HYD-FLOC-TIME-CRITERION', 2, 'flocculationTime', tDesign, ['HYD-002']);

    // ── Potencia de floculación ──
    sources.add('CRC-HANDBOOK');
    sources.add('MWH-2012');
    const mu = t.record('water.viscosity', waterDynamicViscosity(fl.designTemperatureC), { label: 'Viscosidad dinámica del agua a la temperatura de diseño', unit: 'Pa.s', inputs: ['input.flocculation.designTemperatureC'], equation: 'μ(T) interpolada en tabla (CRC Handbook)' });
    const rho = t.record('water.density', waterDensity(fl.designTemperatureC), { label: 'Densidad del agua a la temperatura de diseño', unit: 'kg/m3', inputs: ['input.flocculation.designTemperatureC'], equation: 'ρ(T) interpolada en tabla (CRC Handbook)' });
    const pReq = t.record('floc.power.required', fl.velocityGradientS ** 2 * mu * vf, { label: 'Potencia útil requerida para el G de diseño', unit: 'W', inputs: ['input.flocculation.velocityGradientS', 'water.viscosity', 'floc.volume'], equation: 'P = G²·μ·Vf' });

    // ── Paletas ──
    const rTipEdge = rIn - pd.wallClearanceM;
    const omega = t.record('floc.paddle.angularSpeed', pd.tipSpeedM_s / rTipEdge, { label: 'Velocidad angular del agitador', unit: 'rad/s', inputs: ['input.flocculation.paddles.tipSpeedM_s', 'feedwell.diameter', 'input.flocculation.paddles.wallClearanceM'], equation: 'ω = vpunta / rpunta' });
    t.record('floc.paddle.rpm', (omega * 60) / (2 * Math.PI), { label: 'Velocidad de giro del agitador', unit: 'rpm', inputs: ['floc.paddle.angularSpeed'], equation: 'N = 60·ω/(2π)' });
    const bladeArea = pd.bladeWidthM * bladeH;
    const pitch = FLOC_RULES.ringPitchToBladeWidth * pd.bladeWidthM;
    const rMinEdge = rSleeveOut + pd.sleeveClearanceM;
    const ringPower = (r: number) => pd.armCount * 0.5 * pd.dragCoefficient * rho * bladeArea * (pd.relativeVelocityFactor * omega * r) ** 3;
    const feasible: number[] = [];
    // La esquina exterior de la chapa (no su canto medio) es la que debe respetar la holgura a la pared.
    const rOuterEdge = Math.sqrt(Math.max(rTipEdge ** 2 - (pd.bladeThicknessM / 2) ** 2, 0));
    for (let j = 0; j < pd.maxRings; j++) {
      const r = rOuterEdge - pd.bladeWidthM / 2 - j * pitch;
      if (r - pd.bladeWidthM / 2 < rMinEdge) break;
      feasible.push(r);
    }
    let n: number;
    if (fixedRings !== undefined) n = fixedRings;
    else {
      n = 0;
      let acc = 0;
      while (n < feasible.length && acc < pReq) acc += ringPower(feasible[n++]!);
    }
    const radii = feasible.slice(0, n);
    rings = n;
    const fits = radii.length === n && n >= 1;
    simple(
      'GEO-PADDLES-FIT',
      3,
      fits ? 'PASS' : 'FAIL',
      'Las paletas caben entre el tubo de giro y la pared',
      fits
        ? `${n} anillo(s) de ${pd.armCount} paletas.`
        : feasible.length === 0
          ? `No cabe ningún anillo de paletas entre el tubo de giro (r = ${rMinEdge.toFixed(2)} m) y la pared (r = ${rTipEdge.toFixed(2)} m).`
          : `Se ${fixedRings !== undefined ? 'fijaron' : 'requieren'} ${n} anillo(s) pero solo caben ${feasible.length} (máx. ${pd.maxRings}) entre r = ${rMinEdge.toFixed(2)} m y r = ${rTipEdge.toFixed(2)} m; se construyen ${radii.length}.`,
      { value: feasible.length, limit: `≥ ${Math.max(n, 1)}`, componentIds: ['MEC-007'] },
    );
    // La traza refleja los anillos CONSTRUIDOS; la decisión conserva el valor fijado para reproducir la variante.
    t.record('floc.paddle.rings', radii.length, {
      label: 'Anillos de paletas por brazo (construidos)',
      unit: '-',
      inputs: ['floc.power.required', 'floc.paddle.angularSpeed'],
      equation: fixedRings !== undefined ? 'n = min(n fijado, n que cabe)' : 'menor n con Σ ½·CD·ρ·A·(k·ω·rj)³·narm ≥ P',
      origin: fixedRings !== undefined ? 'FIXED_BY_CONSTRAINT' : 'ADOPTED',
      warnings: radii.length < n ? [`Se ${fixedRings !== undefined ? 'fijaron' : 'requieren'} ${n} anillos; solo caben ${radii.length}.`] : [],
    });
    const totalArea = t.record('floc.paddle.area', bladeArea * pd.armCount * radii.length, { label: 'Área total de paletas', unit: 'm2', inputs: ['floc.paddle.rings', 'input.flocculation.paddles.bladeWidthM', 'input.flocculation.paddles.bladeHeightRatio', 'input.flocculation.paddles.armCount'], equation: 'Ap = narm · nanillos · b · hp' });
    const pDel = t.record('floc.power.delivered', radii.reduce((s, r) => s + ringPower(r), 0), { label: 'Potencia útil entregada por las paletas', unit: 'W', inputs: ['floc.paddle.rings', 'floc.paddle.angularSpeed', 'water.density', 'input.flocculation.paddles.dragCoefficient', 'input.flocculation.paddles.relativeVelocityFactor'], equation: 'P = Σ narm · ½·CD·ρ·b·hp·(k·ω·rj)³' });
    {
      const ok = pDel + 1e-9 >= pReq;
      simple('HYD-FLOC-POWER', 2, ok ? 'PASS' : 'FAIL', 'Potencia de paletas ≥ potencia requerida', ok ? 'Las paletas entregan la potencia necesaria para el G de diseño.' : 'Las paletas no entregan la potencia requerida: aumentar velocidad, brazos o altura de paleta.', { value: pDel, limit: `≥ ${pReq.toFixed(1)}`, unit: 'W', componentIds: ['MEC-007'] });
    }
    delivered = pDel;
    const G = t.record('floc.G', Math.sqrt(pDel / (mu * vf)), { label: 'Gradiente de velocidad G suministrado', unit: '1/s', inputs: ['floc.power.delivered', 'water.viscosity', 'floc.volume'], equation: 'G = √(P / (μ·Vf))' });
    const Gt = t.record('floc.Gt', G * tDesign * 60, { label: 'Producto Gt al caudal de diseño', unit: '-', inputs: ['floc.G', 'floc.time.design'], equation: 'Gt = G · tf' });
    const areaRatio = t.record('floc.paddle.areaRatio', totalArea / (2 * rIn * bladeH), { label: 'Área de paletas / sección vertical de la cámara', unit: '-', inputs: ['floc.paddle.area', 'feedwell.diameter'], equation: 'Ap / (2·rf,int · hp)' });
    clfCriterion(ctx, 'HYD-FLOC-G-CRITERION', 2, 'velocityGradient', G, ['MEC-007']);
    clfCriterion(ctx, 'HYD-FLOC-GT-CRITERION', 2, 'gtProduct', Gt, ['MEC-007']);
    clfCriterion(ctx, 'HYD-FLOC-TIP-SPEED', 2, 'paddleTipSpeed', pd.tipSpeedM_s, ['MEC-007']);
    clfCriterion(ctx, 'HYD-FLOC-PADDLE-AREA', 2, 'paddleAreaRatio', areaRatio, ['MEC-007']);

    layout = {
      available: true,
      rChamberInner: rIn,
      rSleeveInner: rSleeveIn,
      rSleeveOuter: rSleeveOut,
      ringRadii: radii,
      armCount: pd.armCount,
      bladeWidth: pd.bladeWidthM,
      bladeHeight: bladeH,
      bladeThickness: pd.bladeThicknessM,
      yCenter,
      angularSpeedRadS: omega,
    };
    return { dFw: chamberOuter, depth: hf, depthKey: 'input.flocculation.chamberDepthM' };
  };

  return {
    strategy: { modelVersion: CLF_MODEL_VERSION, criterionMeta: CLF_CRITERION_META, sizeSurface, sizeChamber },
    layout: () => {
      if (!layout) throw new Error('El agitador aún no se ha dimensionado');
      return layout;
    },
    decisions: () => ({ paddleRings: rings }),
    sourcesUsed: () => sources,
    powerDelivered: () => delivered,
  };
}
