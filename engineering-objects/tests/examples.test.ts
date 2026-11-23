import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importClfVariant, importVariant } from '@eo/equipment-library';

/** Las configuraciones exportadas en examples/output deben reimportarse y reproducirse bit a bit. */
const dir = join(__dirname, '..', 'examples', 'output');
const files = readdirSync(dir).filter((f) => f.endsWith('.variant.json'));

describe('configuraciones de ejemplo', () => {
  it('existen las tres variantes del caso de prueba', () => {
    expect(files).toEqual(expect.arrayContaining(['DEC-003.variant.json', 'DEC-005.variant.json', 'DEC-010.variant.json']));
  });
  it.each(files)('%s se importa y se reproduce exactamente', (f) => {
    const json = readFileSync(join(dir, f), 'utf8');
    const format = (JSON.parse(json) as { format: string }).format;
    const r = format === 'engineering-objects/clariflocculator-variant' ? importClfVariant(json) : importVariant(json);
    expect(r.verified).toBe(true);
  });
  it('incluye el clarifloculador', () => {
    expect(files).toEqual(expect.arrayContaining(['CLF-010.variant.json', 'CLF-020.variant.json', 'CLF-010-EVAL-15.variant.json']));
  });
  it('un archivo de un modelo anterior se recalcula con el actual y lo indica', () => {
    const r = importVariant(readFileSync(join(__dirname, 'fixtures', 'DEC-005.model-PC-ENG-1.0.0.variant.json'), 'utf8'));
    expect(r.verified).toBe(false);
    expect(r.notes.join(' ')).toMatch(/PC-ENG-1\.0\.0/);
    expect(r.variant.engineeringModelVersion).not.toBe('PC-ENG-1.0.0');
  });
});
