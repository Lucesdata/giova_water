import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// WCAG AA contrast for text tokens in every palette, read from the real CSS.
const css = fs.readFileSync(path.resolve(__dirname, '../../src/styles/tokens.css'), 'utf8');

function parsePalettes() {
  const out = {};
  const re = /(:root|\[data-palette="(\w+)"\])\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const name = m[2] || 'instrument';
    out[name] = { ...(out[name] || {}) };
    for (const [, k, v] of m[3].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) out[name][k] = v;
  }
  const base = out.instrument;
  return Object.fromEntries(Object.entries(out).map(([n, t]) => [n, n === 'instrument' ? t : { ...base, ...t }]));
}

const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

describe('contraste WCAG AA de los tokens de texto', () => {
  const palettes = parsePalettes();
  const TEXT = ['ink', 'ink-1', 'ink-2', 'ink-3', 'accent', 'accent-2', 'warn', 'alert'];
  const SURFACES = ['bg', 'bg-1', 'bg-2', 'bg-3'];
  for (const [name, tokens] of Object.entries(palettes)) {
    for (const fg of TEXT) {
      for (const bg of SURFACES) {
        it(`${name}: --${fg} sobre --${bg} ≥ 4.5:1`, () => {
          expect(ratio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(4.5);
        });
      }
    }
  }
});

describe('contraste de controles (WCAG 1.4.11, 3:1)', () => {
  const palettes = parsePalettes();
  for (const [name, tokens] of Object.entries(palettes)) {
    for (const bg of ['bg', 'bg-1', 'bg-2']) {
      it(`${name}: --ctl (borde de botones y campos) sobre --${bg} ≥ 3:1`, () => {
        expect(ratio(tokens.ctl, tokens[bg])).toBeGreaterThanOrEqual(3);
      });
    }
    it(`${name}: texto del botón principal (--bg sobre --accent) ≥ 4.5:1`, () => {
      expect(ratio(tokens.bg, tokens.accent)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${name}: anillo de foco (--accent) sobre --bg ≥ 3:1`, () => {
      expect(ratio(tokens.accent, tokens.bg)).toBeGreaterThanOrEqual(3);
    });
  }
});
