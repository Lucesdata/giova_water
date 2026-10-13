import { describe, it, expect } from 'vitest';
import { projectsData, projectHash, projectFromHash, projectUrl, PROJECT_HASH_PREFIX } from '../../src/data/projects.js';

describe('URL estable por proyecto', () => {
  it.each(projectsData.map((p) => [p.id, p]))('%s: su fragmento devuelve el mismo proyecto', (_, p) => {
    expect(projectHash(p)).toBe(`${PROJECT_HASH_PREFIX}${p.slug}`);
    expect(projectFromHash(projectHash(p))).toBe(p);
  });
  it('un fragmento de sección o desconocido no abre ningún proyecto', () => {
    expect(projectFromHash('#proyectos')).toBeUndefined();
    expect(projectFromHash('#proyecto/no-existe')).toBeUndefined();
    expect(projectFromHash('')).toBeUndefined();
    expect(projectFromHash(undefined)).toBeUndefined();
  });
  it('la URL para compartir es la del proyecto, no #proyectos', () => {
    const p = projectsData[0];
    const url = projectUrl(p, { origin: 'https://giovawater.vercel.app', pathname: '/' });
    expect(url).toBe(`https://giovawater.vercel.app/#proyecto/${p.slug}`);
    expect(url).not.toMatch(/#proyectos$/);
  });
});
