// Project metadata that's language-agnostic. Translated text (title, role,
// result, metrics, challenge… and the location label) lives in i18n.jsx under
// projects.data.<id>. `scheme` picks the conceptual diagram in ProjectScheme.jsx.
// `slug` is the stable address of the project (#proyecto/<slug>); never rename it.
// `featured` projects are the ones shown first. `files` lists real evidence
// documents or captures that exist: { href, kind } with the text of each one in
// i18n under projects.data.<id>.files[i]. It stays empty until real files exist.
export const projectsData = [
  { id: 'P-001', slug: 'montebello-ptar-alcantarillado', featured: true, year: '2022–25', scheme: 'ptar',
    tags: ['EPA-SWMM', 'P&IDs', 'CVC', 'Res.330/2017'], filters: ['agua'], files: [] },
  { id: 'P-002', slug: 'ptaps-rurales-uaesp', featured: true, year: '2018–24', scheme: 'rural',
    tags: ['EPANET', 'Python', 'Power BI', 'SCADA'], filters: ['agua'], files: [] },
  { id: 'P-003', slug: 'gemelo-digital-la-voragine', featured: true, year: '2024', scheme: 'twin',
    tags: ['Three.js', 'Chart.js', 'Motor HID'], filters: ['digital'], files: [] },
  { id: 'P-007', slug: 'monitoreo-automatizacion-uaesp', featured: false, year: '2020–23', scheme: 'automation',
    tags: ['SCADA', 'IoT', 'Front end'], filters: ['agua', 'digital'], files: [] },
  { id: 'P-004', slug: 'iotio-telemetria', featured: false, year: '2023', scheme: 'iot',
    tags: ['Django', 'React', 'InfluxDB'], filters: ['digital'], files: [] },
  { id: 'P-005', slug: 'plantas-lixiviados-bma', featured: false, year: '2018–25', scheme: 'industrial',
    tags: [{ k: 'fisicoquimico' }, { k: 'biologico' }, 'SCADA', 'P&IDs'], filters: ['agua'], files: [] },
  { id: 'P-006', slug: 'psmv-rural-inalter', featured: false, year: '2019', scheme: 'network',
    tags: ['EPA-SWMM', 'Manning', 'MAGNA-SIRGAS', 'PSMV'], filters: ['agua'], files: [] },
];

export const projectById = (id) => projectsData.find((p) => p.id === id);
export const projectBySlug = (slug) => projectsData.find((p) => p.slug === slug);

// Stable address of a project: /#proyecto/<slug>. A hash route keeps the site a
// static single page (no server rewrite needed) and works when opened directly.
export const PROJECT_HASH_PREFIX = '#proyecto/';
export const projectHash = (p) => `${PROJECT_HASH_PREFIX}${p.slug}`;
export const projectFromHash = (hash) =>
  hash && hash.startsWith(PROJECT_HASH_PREFIX)
    ? projectBySlug(decodeURIComponent(hash.slice(PROJECT_HASH_PREFIX.length)))
    : undefined;
export const projectUrl = (p, loc = window.location) => `${loc.origin}${loc.pathname}${projectHash(p)}`;
