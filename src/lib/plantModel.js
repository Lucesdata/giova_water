/* Illustrative treatment-train model behind the WaterTracking section.
   Each stage has a typical design range for its loading parameter and a base
   turbidity-remaining fraction. Outside the range the stage degrades. These are
   textbook orders of magnitude, NOT a design calculation: not for sizing. */

export const STAGE_IDS = ['screening', 'coagulation', 'sedimentation', 'filtration', 'disinfection'];

// metric: what is computed from the size input; range: [min, max] typical band.
export const STAGE_SPEC = {
  screening:     { size: null, metric: null, range: null, base: 0.95 },
  coagulation:   { size: { key: 'volume', unit: 'm³', def: 60, min: 1, max: 5000 }, metric: 'hrt', unit: 'min', range: [20, 40], base: 1 },
  sedimentation: { size: { key: 'area', unit: 'm²', def: 80, min: 1, max: 20000 }, metric: 'sor', unit: 'm/h', range: [0.8, 2.5], base: 0.2 },
  filtration:    { size: { key: 'area', unit: 'm²', def: 40, min: 1, max: 20000 }, metric: 'rate', unit: 'm/h', range: [5, 12], base: 0.08 },
  disinfection:  { size: { key: 'volume', unit: 'm³', def: 40, min: 1, max: 5000 }, metric: 'ct', unit: 'mg·min/L', range: [15, Infinity], base: 1, dose: { def: 1.5, min: 0.1, max: 10 } },
};

export const LIMITS = { q: { min: 1, max: 500, def: 40 }, turb: { min: 1, max: 500, def: 25 } };
export const TURB_TARGET = 1;   // NTU, illustrative outlet target
export const CT_MIN = 15;       // mg·min/L, illustrative

export function defaultPlant() {
  const stages = {};
  for (const id of STAGE_IDS) {
    const s = STAGE_SPEC[id];
    stages[id] = { enabled: true, ...(s.size ? { [s.size.key]: s.size.def } : {}), ...(s.dose ? { dose: s.dose.def } : {}) };
  }
  return { q: LIMITS.q.def, turb: LIMITS.turb.def, stages };
}

const num = (v, lo, hi, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};

/** Clamp anything coming from inputs or storage into a valid plant. */
export function sanitizePlant(p) {
  const d = defaultPlant();
  if (!p || typeof p !== 'object') return d;
  const out = { q: num(p.q, LIMITS.q.min, LIMITS.q.max, d.q), turb: num(p.turb, LIMITS.turb.min, LIMITS.turb.max, d.turb), stages: {} };
  for (const id of STAGE_IDS) {
    const s = STAGE_SPEC[id], src = p.stages?.[id] || {}, def = d.stages[id];
    out.stages[id] = { enabled: typeof src.enabled === 'boolean' ? src.enabled : true };
    if (s.size) out.stages[id][s.size.key] = num(src[s.size.key], s.size.min, s.size.max, def[s.size.key]);
    if (s.dose) out.stages[id].dose = num(src.dose, s.dose.min, s.dose.max, def.dose);
  }
  return out;
}

/** status: 'off' | 'ok' | 'warn'. `side` tells which edge of the range was crossed. */
function rangeStatus(value, [lo, hi], bad) {
  if (bad === 'low' && value < lo) return { status: 'warn', side: 'low' };
  if (bad === 'high' && value > hi) return { status: 'warn', side: 'high' };
  return { status: 'ok', side: null };
}

export function evaluatePlant(input) {
  const plant = sanitizePlant(input);
  const qh = plant.q * 3.6;                       // m³/h
  let turb = plant.turb;
  const stages = [];
  let floc = false;                               // is there effective coagulation upstream?
  let ct = null;

  for (const id of STAGE_IDS) {
    const spec = STAGE_SPEC[id], cfg = plant.stages[id];
    const row = { id, enabled: cfg.enabled, metric: null, status: 'off', side: null, turbIn: turb, turbOut: turb };
    if (!cfg.enabled) { stages.push(row); continue; }

    if (id === 'coagulation') {
      row.metric = (cfg.volume / qh) * 60;        // retention time, min
      Object.assign(row, rangeStatus(row.metric, spec.range, 'low'));   // too short a mix/floc time is the risk
      floc = row.status === 'ok';
    } else if (id === 'sedimentation' || id === 'filtration') {
      row.metric = qh / cfg.area;                 // surface loading / filtration rate, m/h
      Object.assign(row, rangeStatus(row.metric, spec.range, 'high'));  // overloading is the risk; oversizing is only costly
      // Without effective coagulation the particles do not settle or filter well.
      let f = spec.base * (floc ? 1 : 3);
      if (row.side === 'high') f *= (row.metric / spec.range[1]) ** 2;
      turb *= Math.min(1, f);
    } else if (id === 'screening') {
      row.status = 'ok';
      turb *= spec.base;
    } else if (id === 'disinfection') {
      const minutes = (cfg.volume / qh) * 60;
      ct = cfg.dose * minutes;
      row.metric = ct;
      row.minutes = minutes;
      row.status = ct >= CT_MIN ? 'ok' : 'warn';
      row.side = ct >= CT_MIN ? null : 'low';
    }
    row.turbOut = turb;
    stages.push(row);
  }

  const has = (id) => plant.stages[id].enabled;
  const checks = [
    { id: 'turbidity', ok: turb <= TURB_TARGET },
    { id: 'filtration', ok: has('filtration') },
    { id: 'disinfection', ok: has('disinfection') && ct != null && ct >= CT_MIN },
    { id: 'loading', ok: stages.every((s) => s.status !== 'warn') },
  ];
  const verdict = checks.every((c) => c.ok) ? 'ok' : (!checks[1].ok || !checks[2].ok || !checks[0].ok) ? 'fail' : 'warn';
  return { plant, stages, turbOut: turb, ct, checks, verdict };
}
