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
    const b = JSON.stringify(dictionary[lang].projects.data['P-007']);
    expect(b).not.toMatch(/€|\bEUR\b|US\$|USD|\$ ?\d/);
  });
  it.each(LANGS)('%s: lenguaje de participación, no de gestión directa', (lang) => {
    expect(dictionary[lang].about.note).toBeTruthy();
    expect(dictionary[lang].projects.data['P-007'].budgets.label).toBeTruthy();
    expect(dictionary[lang].projects.data['P-007'].budgets.participation).toBeTruthy();
  });
  it.each(LANGS)('%s: los cinco importes están solo en la ficha de monitoreo y automatización, sin sumar', (lang) => {
    const d = dictionary[lang];
    expect(d.about.budgets).toBeUndefined();
    expect(d.projects.data['P-007'].budgets.items).toHaveLength(5);
    // The card (result + metrics) never uses an amount as a headline figure.
    const card = JSON.stringify([d.projects.data['P-007'].result, d.projects.data['P-007'].metrics]);
    expect(card).not.toMatch(/COP\s?\d|\d\.\d{3}\.\d{3}|\d{1,3}(,\d{3}){2,}|\d{1,3}( \d{3}){2,}/);
    expect(d.projects.data['P-007'].budgets.note).toMatch(/\S/);
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
    expect(d.metrics.find(m => m.v === '10')).toBeDefined();
    expect(d.resultFull).toMatch(/no es el alcance técnico de 11/);
  });
});

describe('estructura de la página', () => {
  it('secciones en el orden pedido y con numeración consecutiva', async () => {
    const { SECTIONS } = await import('../../src/data/sections.js');
    expect(SECTIONS.map((x) => x.id)).toEqual(['inicio', 'proyectos', 'sobre', 'gemelos', 'faq', 'contacto']);
    expect(SECTIONS.map((x) => x.n)).toEqual(['00', '01', '02', '03', '04', '05']);
    for (const lang of LANGS) for (const { id } of SECTIONS) {
      expect(dictionary[lang].nav.items[id], `${lang} nav.items.${id}`).toBeTruthy();
    }
  });
  it('cada proyecto tiene una URL estable única y los destacados son monitoreo y automatización UAESP, Montebello y La Vorágine', () => {
    const slugs = projectsData.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(projectsData.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(projectsData.filter((p) => p.featured).map((p) => p.id)).toEqual(['P-007', 'P-001', 'P-003']);
    expect(projectsData).toHaveLength(7);
  });
  it.each(LANGS)('%s: horario en hora de Madrid, sin CET ni React · Vite en el pie', (lang) => {
    expect(dictionary[lang].contact.card.hoursValue).not.toMatch(/CET/);
    expect(dictionary[lang].contact.card.hoursValue).toMatch(/Madrid/);
    expect(JSON.stringify(dictionary[lang].footer)).not.toMatch(/React|Vite/);
  });
  it.each(LANGS)('%s: el hero conserva el titular y sus dos acciones, con descripción de dos frases', (lang) => {
    const h = dictionary[lang].hero;
    expect(h.ctaProjects).toBeTruthy();
    expect(h.ctaContact).toBeTruthy();
    expect(h.intro.split(/[.!?]\s/).length).toBe(2);
    expect(h.focus).toBeUndefined();
  });
  it.each(LANGS)('%s: los cargos de la trayectoria no mezclan idiomas', (lang) => {
    const roles = dictionary[lang].about.timeline.rows.map((r) => r.role).join(' ');
    if (lang !== 'en') expect(roles).not.toMatch(/Project Lead|Technical Director|Water & Sanitation|\bSpecialist\b/);
  });
  it.each(LANGS)('%s: la demo conserva la etiqueta persistente y tres escenarios completos', (lang) => {
    const t = dictionary[lang].twins;
    expect(t.disclaimer.length).toBeGreaterThan(20);
    for (const id of ['normal', 'alta', 'reducido']) {
      const s = t.scenarios.items[id];
      expect(s.name && s.changed && s.check, `${lang} ${id}`).toBeTruthy();
    }
    expect(t.scenarios.pause && t.scenarios.reset).toBeTruthy();
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

describe('P-007: proyecto destacado con fotografías reales', () => {
  const p7 = projectsData.find((p) => p.id === 'P-007');
  it('es el primero de la lista y su portada es la primera fotografía', () => {
    expect(projectsData[0].id).toBe('P-007');
    expect(p7.cover).toBe(p7.photos[0].src);
  });
  it('cada fotografía existe en disco y pesa menos de 300 KB', () => {
    for (const ph of p7.photos) {
      const f = path.join(ROOT, 'public', ph.src);
      expect(fs.existsSync(f), ph.src).toBe(true);
      expect(fs.statSync(f).size, ph.src).toBeLessThan(300 * 1024);
    }
  });
  it.each(LANGS)('%s: cada fotografía tiene texto alternativo y pie, y las fases tienen estado', (lang) => {
    const d = dictionary[lang].projects.data['P-007'];
    expect(d.photos).toHaveLength(p7.photos.length);
    for (const ph of d.photos) { expect(ph.alt.length).toBeGreaterThan(10); expect(ph.caption.length).toBeGreaterThan(10); }
    expect(d.timeline.items).toHaveLength(6);
    expect(p7.milestonesDone).toBe(2);
    for (const it of d.timeline.items) expect(it.status).toMatch(/\S/);
  });
  it.each(LANGS)('%s: las fases futuras no se presentan como entregadas y no hay cifras en disputa', (lang) => {
    const d = dictionary[lang].projects.data['P-007'];
    const planned = d.timeline.items.slice(p7.milestonesDone).map((i) => i.status);
    expect(new Set(planned).size).toBe(1);
    expect(planned[0]).not.toBe(d.timeline.items[0].status);
    expect(JSON.stringify(d)).not.toMatch(/60[\s., ]?000|\b20 (plantas|plants|stations)\b/);
  });
  it('las fotografías publicadas no llevan coordenadas: no hay texto de coordenadas en los pies', () => {
    expect(JSON.stringify(dictionary.es.projects.data['P-007'].photos)).not.toMatch(/\d°/);
  });
});

describe('perfil: credenciales, trayectoria y competencias', () => {
  it.each(LANGS)('%s: la tarjeta lleva formación con el año de título, licencia y nota de imagen ilustrativa', (lang) => {
    const c = dictionary[lang].about.card;
    expect(c.formationValue).toMatch(/UPEC/);
    expect(c.formationValue).toMatch(/2012/);
    expect(c.licenseValue).toBe('CPQCOL PQ-6061');
    expect(c.imageNote).toMatch(/\S/);
    // lo que ya dice el hero no se repite en la tarjeta
    expect(c.years).toBeUndefined();
    expect(c.langsValue).toBeUndefined();
  });
  it.each(LANGS)('%s: la aclaración sobre contratación se conserva y enlaza al recorrido del hero', (lang) => {
    const a = dictionary[lang].about;
    expect(a.note).toMatch(/\S/);
    expect(a.methodLink).toMatch(/\S/);
    expect(a.method).toBeUndefined();
    expect(a.bio3).not.toMatch(/PQ-6061/);
  });
  it.each(LANGS)('%s: cada proyecto tiene un nombre corto y legible para los chips', (lang) => {
    for (const p of projectsData) {
      const short = dictionary[lang].projects.data[p.id].short;
      expect(short, `${lang} ${p.id}`).toMatch(/\S/);
      expect(short, `${lang} ${p.id}`).not.toMatch(/^P-\d{3}$/);
      expect(short.length, `${lang} ${p.id}`).toBeLessThanOrEqual(28);
    }
  });
});

describe('proyectos con fotografías propias', () => {
  const withPhotos = projectsData.filter((p) => p.photos && p.photos.length);
  it('los proyectos con fotografías son los esperados; IOTIO (P-004) sigue con su esquema', () => {
    expect(withPhotos.map((p) => p.id).sort()).toEqual(['P-001', 'P-002', 'P-003', 'P-005', 'P-006', 'P-007']);
    expect(projectsData.find((p) => p.id === 'P-004').photos).toBeUndefined();
  });
  it('P-006 solo lleva galería (sin portada) y su foto es un recorte de una sola persona', () => {
    const p6 = projectsData.find((p) => p.id === 'P-006');
    expect(p6.cover).toBeUndefined();
    expect(p6.photos).toHaveLength(1);
    expect(p6.photos[0].w).toBeLessThan(p6.photos[0].h);   // recorte vertical, sin el grupo
  });
  it('cada portada y cada fotografía existen en disco y pesan menos de 300 KB', () => {
    for (const p of withPhotos) {
      for (const src of [p.cover, ...p.photos.map((ph) => ph.src)].filter(Boolean)) {
        const f = path.join(ROOT, 'public', src);
        expect(fs.existsSync(f), `${p.id} ${src}`).toBe(true);
        expect(fs.statSync(f).size, `${p.id} ${src}`).toBeLessThan(300 * 1024);
      }
    }
  });
  it.each(LANGS)('%s: cada fotografía tiene texto alternativo y pie, y no hay coordenadas en los pies', (lang) => {
    for (const p of withPhotos) {
      const texts = dictionary[lang].projects.data[p.id].photos;
      expect(texts, `${lang} ${p.id}`).toHaveLength(p.photos.length);
      for (const t of texts) { expect(t.alt.length).toBeGreaterThan(10); expect(t.caption.length).toBeGreaterThan(10); expect(t.alt + t.caption).not.toMatch(/\d°/); }
    }
  });
  it.each(LANGS)('%s: P-005 dice que la fotografía es de Buenaventura y de 2021', (lang) => {
    const c = dictionary[lang].projects.data['P-005'].photos[0].caption;
    expect(c).toMatch(/Buenaventura/);
    expect(c).toMatch(/2021/);
  });
});

describe('insignia de portada: fotografía o captura', () => {
  it.each(LANGS)('%s: hay textos para las dos insignias', (lang) => {
    const m = dictionary[lang].projects.modal;
    expect(m.photoBadge).toMatch(/\S/);
    expect(m.captureBadge).toMatch(/\S/);
    expect(m.captureBadge).not.toBe(m.photoBadge);
  });
  it('solo el gemelo digital usa la insignia de captura', () => {
    expect(projectsData.filter((p) => p.coverKind === 'capture').map((p) => p.id)).toEqual(['P-003']);
  });
});
