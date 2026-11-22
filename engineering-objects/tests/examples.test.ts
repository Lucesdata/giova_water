import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importVariant } from '@eo/equipment-library';

/** Las configuraciones exportadas en examples/output deben reimportarse y reproducirse bit a bit. */
const dir = join(__dirname, '..', 'examples', 'output');
const files = readdirSync(dir).filter((f) => f.endsWith('.variant.json'));

describe('configuraciones de ejemplo', () => {
  it('existen las tres variantes del caso de prueba', () => {
    expect(files).toEqual(expect.arrayContaining(['DEC-003.variant.json', 'DEC-005.variant.json', 'DEC-010.variant.json']));
  });
  it.each(files)('%s se importa y se reproduce exactamente', (f) => {
    const r = importVariant(readFileSync(join(dir, f), 'utf8'));
    expect(r.verified).toBe(true);
  });
});
