import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { dictionary } from '../../src/i18n.jsx';
import { projectsData } from '../../src/data/projects.js';

const ROOT = path.resolve(__dirname, '../..');
const LANGS = ['es', 'en', 'fr'];
const text = (lang) => JSON.stringify(dictionary[lang]);

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

describe('contenido público: lo que NO debe aparecer', () => {
  it.each(LANGS)('%s: sin NIE ni documento de identidad', (lang) => {
    expect(text(lang)).not.toMatch(/Z3214507D|\bNIE\b/);
  });
  it('index.html y README tampoco publican el NIE', () => {
    for (const f of ['index.html', 'README.md']) {
      expect(fs.readFileSync(path.join(ROOT, f), 'utf8'), f).not.toMatch(/Z3214507D/);
    }
  });
  it.each(LANGS)('%s: cifras en disputa fuera de titulares y métricas', (lang) => {
    const t = text(lang);
    // 60 000 PE vs 35 000, 6 M€, 150 000 vs 212 000 habitantes
    expect(t).not.toMatch(/60[\s., ]?000|35[\s., ]?000|212[\s., ]?000|150[\s., ]?000|€\s?6\s?M|6\s?M€|6M\+/);
  });
  it.each(LANGS)('%s: sin disponibilidad con fecha ni contador de visitas simulado', (lang) => {
    const t = text(lang);
    expect(t).not.toMatch(/abril 2026|april 2026|avril 2026/i);
  });
  it.each(LANGS)('%s: el panel de gemelos no sugiere conexión real', (lang) => {
    const tw = JSON.stringify(dictionary[lang].twins);
    expect(tw).not.toMatch(/LIVE|ONLINE|UPTIME|LATENCY|latencia|ingesta OK|tiempo real|real time|temps réel|en vivo/i);
    expect(dictionary[lang].twins.badge.length).toBeGreaterThan(0);
  });
  it.each(LANGS)('%s: la portada no promete vídeo ni transmisión en directo', (lang) => {
    expect(JSON.stringify(dictionary[lang].hero)).not.toMatch(/LIVE|STREAMING|SCADA streaming/i);
  });
});

describe('presupuestos UAESP (datos del autor, sin sumar)', () => {
  const only = (re) => (lang) => expect(text(lang)).toMatch(re);
  it('es: cifras exactas y la distinción entre referencias', () => {
    const t = text('es');
    for (const n of ['104.338', '9.433.328.555', '9.544.068.544', '1.019.830.000', '10 de 12']) expect(t).toContain(n);
    expect(t).toMatch(/pendientes de cotejar/);
    expect(t).toMatch(/no se suman|No se suman/);
    expect(t).not.toContain('104.339');
  });
  it('en y fr conservan los mismos importes', () => {
    expect(text('en')).toContain('104,338');
    expect(text('en')).toContain('9,433,328,555');
    expect(text('fr')).toContain('104 338');
    expect(text('fr')).toContain('9 433 328 555');
  });
  it.each(LANGS)('%s: sin equivalencias en euros ni dólares', (lang) => {
    const b = JSON.stringify(dictionary[lang].about.budgets) + JSON.stringify(dictionary[lang].projects.data['P-007']);
    expect(b).not.toMatch(/€|\bEUR\b|US\$|USD|\$ ?\d/);
  });
  it.each(LANGS)('%s: lenguaje de participación, no de gestión directa', (lang) => {
    expect(dictionary[lang].about.cycle.note).toBeTruthy();
    expect(dictionary[lang].about.budgets.label).toBeTruthy();
  });
  void only;
});

describe('proyectos', () => {
  it('cada proyecto tiene texto completo en los tres idiomas', () => {
    for (const p of projectsData) {
      for (const lang of LANGS) {
        const d = dictionary[lang].projects.data[p.id];
        expect(d, `${lang} ${p.id}`).toBeDefined();
        for (const k of ['cat', 'loc', 'title', 'role', 'result', 'challenge', 'responsibility', 'solution', 'resultFull']) {
          expect(typeof d[k], `${lang} ${p.id}.${k}`).toBe('string');
        }
        expect(d.metrics.length, `${lang} ${p.id} métricas`).toBeGreaterThan(0);
        expect(d.metrics.length, `${lang} ${p.id} métricas`).toBeLessThanOrEqual(3);
        expect(d.evidence.length, `${lang} ${p.id} evidencia`).toBeGreaterThan(0);
      }
    }
  });
  it('incluye el caso de automatización rural y mantiene los filtros', () => {
    const p7 = projectsData.find(p => p.id === 'P-007');
    expect(p7).toBeDefined();
    expect(projectsData.filter(p => p.filters.includes('agua')).length).toBeGreaterThan(0);
    expect(projectsData.filter(p => p.filters.includes('digital')).length).toBeGreaterThan(0);
  });
  it('el alcance técnico de 11 acueductos no se confunde con la meta de 12', () => {
    const d = dictionary.es.projects.data['P-007'];
    expect(d.metrics.find(m => m.v === '11')).toBeDefined();
    expect(d.resultFull).toMatch(/no es el alcance técnico de 11/);
  });
});

describe('recursos multimedia', () => {
  it('todo /assets/... referenciado por la interfaz existe en public/', () => {
    const files = [...walk(path.join(ROOT, 'src/components')), path.join(ROOT, 'src/data/projects.js'), path.join(ROOT, 'index.html')];
    const missing = [];
    for (const f of files) {
      for (const [, ref] of fs.readFileSync(f, 'utf8').matchAll(/['"`(](\/assets\/[\w./-]+)/g)) {
        if (!fs.existsSync(path.join(ROOT, 'public', ref))) missing.push(`${path.relative(ROOT, f)} → ${ref}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
