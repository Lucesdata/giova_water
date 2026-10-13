import { jitter } from './jitter.js';

/* Illustrative simulation behind the digital-twin demo. The scenarios are plain
   target values with small seeded noise: they show how a panel would look, they
   are NOT a hydraulic calculation and must not be used for sizing. */

export const SCENARIO_IDS = ['normal', 'alta', 'reducido'];

// Target value per variable and scenario (L/s, bar, NTU, pH).
export const TARGETS = {
  normal:   { q: 42.3, p: 3.24, tu: 0.82, ph: 7.21 },
  alta:     { q: 52.5, p: 2.35, tu: 1.3,  ph: 7.15 },
  reducido: { q: 24,   p: 3.6,  tu: 0.7,  ph: 7.3 },
};
const AMP = { q: 1.2, p: 0.05, tu: 0.06, ph: 0.05 };
const SEED = { q: 0, p: 3, tu: 7, ph: 11 };
export const KEYS = ['q', 'p', 'tu', 'ph'];

// Thresholds of the panel. `low*` apply below the range, the others above it.
export const LIMITS = {
  q:  { min: 0, max: 60, lowWarn: 30, lowAlert: 15, warn: 50, alert: 55 },
  p:  { min: 0, max: 5, lowWarn: 2.5, lowAlert: 1.5, warn: 4, alert: 4.5 },
  tu: { min: 0, max: 2, warn: 1.2, alert: 1.5 },
  ph: { min: 6, max: 8.5, lowWarn: 6.8, lowAlert: 6.5, warn: 8, alert: 8.3 },
};

/** { status: 'ok' | 'warn' | 'alert', dir: 'low' | 'high' | null } */
export function statusOf(key, value) {
  const l = LIMITS[key];
  if (l.alert != null && value >= l.alert) return { status: 'alert', dir: 'high' };
  if (l.warn != null && value >= l.warn) return { status: 'warn', dir: 'high' };
  if (l.lowAlert != null && value <= l.lowAlert) return { status: 'alert', dir: 'low' };
  if (l.lowWarn != null && value < l.lowWarn) return { status: 'warn', dir: 'low' };
  return { status: 'ok', dir: null };
}

export function readingsFor(scenario, tick) {
  const base = TARGETS[scenario] || TARGETS.normal;
  const out = {};
  for (const k of KEYS) out[k] = base[k] + jitter(0, AMP[k], tick + SEED[k]);
  return out;
}

const SERIES_LEN = 30;
const seedSeries = (base, amp, seed) =>
  Array.from({ length: SERIES_LEN }, (_, i) => base + Math.sin(i / 3) * amp + jitter(0, amp / 3, seed + i));

export function initialState() {
  const base = TARGETS.normal;
  return {
    scenario: 'normal',
    tick: 0,
    readings: readingsFor('normal', 0),
    series: {
      q: seedSeries(base.q - 2, 3, 100),
      p: seedSeries(base.p - 0.04, 0.15, 200),
      tu: seedSeries(base.tu - 0.02, 0.2, 300),
      ph: seedSeries(base.ph, 0.08, 400),
    },
  };
}

const withSample = (state, patch) => {
  const next = { ...state, ...patch };
  next.readings = readingsFor(next.scenario, next.tick);
  next.series = Object.fromEntries(KEYS.map((k) => [k, [...state.series[k].slice(1), next.readings[k]]]));
  return next;
};

/** Actions: { type: 'tick' } · { type: 'scenario', id } · { type: 'reset' } */
export function simReducer(state, action) {
  switch (action.type) {
    case 'tick': return withSample(state, { tick: state.tick + 1 });
    case 'scenario':
      return SCENARIO_IDS.includes(action.id) && action.id !== state.scenario
        ? withSample(state, { scenario: action.id })
        : state;
    case 'reset': return initialState();
    default: return state;
  }
}
