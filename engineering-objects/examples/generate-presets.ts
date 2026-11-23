/**
 * Genera las configuraciones del caso de prueba (spec §6.2) y sus memorias de cálculo:
 *   npm run examples:presets
 * Salida en examples/output/. Es determinista: misma fecha fija, mismos hashes.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CLF_010_WATER,
  FLOC_RULES,
  compareClfVariants,
  createClfBaseVariant,
  createClfVariant,
  exportClfVariant,
  regenerateClf,
  DEC_005_CONCEPTUAL,
  DEC_005_DIDACTIC,
  compareVariants,
  createBaseVariant,
  createVariant,
  exportVariant,
  regenerate,
  renderReport,
} from '@eo/equipment-library';

const out = join(__dirname, 'output');
mkdirSync(out, { recursive: true });
const createdAt = '2026-11-22T00:00:00.000Z';

const dec005 = createBaseVariant(DEC_005_DIDACTIC, { createdAt });
const dec010 = createVariant(dec005, { tag: 'DEC-010', flow: { averageLps: 10 } }, { createdAt });
const dec003 = createVariant(dec005, { tag: 'DEC-003', flow: { averageLps: 3 } }, { createdAt });
const eval10 = createVariant(dec005, { tag: 'DEC-005-EVAL-10', flow: { averageLps: 10 } }, { mode: 'B', createdAt });
const restricted10 = createVariant(dec005, { tag: 'DEC-005-C-10', flow: { averageLps: 10 } }, { mode: 'C', allowedResize: ['inlet', 'effluent', 'weir'], createdAt });
const conceptual = createBaseVariant(DEC_005_CONCEPTUAL, { createdAt });

for (const v of [dec005, dec010, dec003, eval10, restricted10, conceptual]) {
  writeFileSync(join(out, `${v.tag}.variant.json`), exportVariant(v) + '\n');
  writeFileSync(join(out, `${v.tag}.memoria.md`), renderReport(regenerate(v), v));
  console.log(`${v.tag.padEnd(18)} ${v.mode.padEnd(4)} ${v.validationStatus.padEnd(12)} ${v.variantId}`);
}

const rows = compareVariants([dec003, dec005, dec010, eval10, restricted10]);
const md = [
  '# Comparación de variantes — caso de prueba §6.2',
  '',
  '| Magnitud | Unidad | DEC-003 | DEC-005 | DEC-010 | DEC-005 eval. 10 L/s (B) | DEC-005 restringido 10 L/s (C) |',
  '|---|---|---:|---:|---:|---:|---:|',
  ...rows.map((r) => `| ${r.label} | ${r.unit} | ${r.values.map((x) => (x === null ? '—' : Number(x.toFixed(3)))).join(' | ')} |`),
  `| Estado | | ${[dec003, dec005, dec010, eval10, restricted10].map((v) => v.validationStatus).join(' | ')} |`,
  '',
];
writeFileSync(join(out, 'comparison.md'), md.join('\n'));

// ── Clarifloculador ──
const clf010 = createClfBaseVariant(CLF_010_WATER, { createdAt });
// A 20 L/s la columna crece y sus deflectores ya no caben en la jaula de 0,22 m: se agranda la jaula.
const clf020 = createClfVariant(clf010, { tag: 'CLF-020', flow: { averageLps: 20 }, mechanical: { cageHalfWidthM: 0.3 } }, { createdAt });
const clfEval15 = createClfVariant(clf010, { tag: 'CLF-010-EVAL-15', flow: { averageLps: 15 } }, { mode: 'B', createdAt });
for (const v of [clf010, clf020, clfEval15]) {
  writeFileSync(join(out, `${v.tag}.variant.json`), exportClfVariant(v) + '\n');
  writeFileSync(join(out, `${v.tag}.memoria.md`), renderReport(regenerateClf(v), v, FLOC_RULES));
  console.log(`${v.tag.padEnd(18)} ${v.mode.padEnd(4)} ${v.validationStatus.padEnd(12)} ${v.variantId}`);
}
const clfRows = compareClfVariants([clf010, clf020, clfEval15]);
writeFileSync(
  join(out, 'comparison-clariflocculator.md'),
  [
    '# Comparación de variantes — clarifloculador',
    '',
    '| Magnitud | Unidad | CLF-010 | CLF-020 (A) | CLF-010 eval. 15 L/s (B) |',
    '|---|---|---:|---:|---:|',
    ...clfRows.map((r) => `| ${r.label} | ${r.unit} | ${r.values.map((x) => (x === null ? '—' : Number(x.toFixed(3)))).join(' | ')} |`),
    `| Estado | | ${[clf010, clf020, clfEval15].map((v) => v.validationStatus).join(' | ')} |`,
    '',
  ].join('\n'),
);
