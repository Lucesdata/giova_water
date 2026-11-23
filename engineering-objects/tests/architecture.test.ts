import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(__dirname, '..');
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f: string) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
}

/** Capas que deben funcionar sin Three.js ni React (spec §2.3 y §14). */
const PURE_LAYERS = ['engineering-core', 'material-library', 'geometry-engine', 'equipment-library'];

describe('separación de capas', () => {
  it.each(PURE_LAYERS)('%s no importa Three.js, React ni R3F', (pkg) => {
    for (const f of files(join(root, 'packages', pkg, 'src'))) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/from ['"](three|react|react-dom|@react-three\/[^'"]+)['"]/);
    }
  });
  it('engineering-core no depende de ningún otro paquete del monorepo', () => {
    for (const f of files(join(root, 'packages', 'engineering-core', 'src'))) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/from ['"]@eo\//);
    }
  });
  it('los package.json de las capas puras no declaran dependencias de render', () => {
    for (const pkg of PURE_LAYERS) {
      const deps = Object.keys(JSON.parse(readFileSync(join(root, 'packages', pkg, 'package.json'), 'utf8')).dependencies ?? {});
      expect(deps.filter((d) => /three|react/.test(d)), pkg).toEqual([]);
    }
  });
});
