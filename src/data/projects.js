// Project metadata that's language-agnostic. Translated text (title, role,
// result, metrics, challenge… and the location label) lives in i18n.jsx under
// projects.data.<id>. `scheme` picks the conceptual diagram in ProjectScheme.jsx.
// `slug` is the stable address of the project (#proyecto/<slug>); never rename it.
// `featured` projects are the ones shown first. `files` lists real evidence
// documents or captures that exist: { href, kind } with the text of each one in
// i18n under projects.data.<id>.files[i]. It stays empty until real files exist.
export const projectsData = [
  { id: 'P-007', slug: 'monitoreo-automatizacion-uaesp', featured: true, year: '2020–27', scheme: 'automation',
    tags: ['SCADA', 'IoT', 'Front end'], filters: ['agua', 'digital'], files: [],
    // Real photographs (project presentation, UAESP, Sept 2024). Texts in i18n:
    // projects.data.P-007.photos[i] = { alt, caption }. `cover` is photos[0].
    // `milestonesDone` = how many leading timeline items are delivered.
    cover: '/assets/uaesp/ptap-vista-aerea.jpg', milestonesDone: 2,
    photos: [
      { src: '/assets/uaesp/ptap-vista-aerea.jpg', w: 922, h: 518 },
      { src: '/assets/uaesp/scada-hmi-ptap-soledad.jpg', w: 552, h: 414 },
      { src: '/assets/uaesp/macromedidores-camara.jpg', w: 870, h: 1149 },
      { src: '/assets/uaesp/torre-comunicacion.jpg', w: 330, h: 669 },
      { src: '/assets/uaesp/sensores-calidad-gabinete.jpg', w: 874, h: 1144 },
      { src: '/assets/uaesp/app-movil-monitoreo.jpg', w: 600, h: 1067 },
    ] },
  { id: 'P-001', slug: 'montebello-ptar-alcantarillado', featured: true, year: '2022–25', scheme: 'ptar',
    tags: ['EPA-SWMM', 'P&IDs', 'CVC', 'Res.330/2017'], filters: ['agua'], files: [],
    cover: '/assets/proyectos/montebello-ptar-portada.jpg',
    photos: [{ src: '/assets/proyectos/montebello-ptar.jpg', w: 800, h: 637 }] },
  { id: 'P-002', slug: 'ptaps-rurales-uaesp', featured: false, year: '2018–24', scheme: 'rural',
    tags: ['EPANET', 'Python', 'Power BI', 'SCADA'], filters: ['agua'], files: [],
    // Detail of a communication piece, cropped to the photograph (no text, no logos).
    cover: '/assets/proyectos/plantas-rurales-portada.jpg',
    photos: [{ src: '/assets/proyectos/plantas-rurales.jpg', w: 326, h: 632 }] },
  { id: 'P-003', slug: 'gemelo-digital-la-voragine', featured: true, year: '2024', scheme: 'twin',
    tags: ['Three.js', 'Chart.js', 'Motor HID'], filters: ['digital'], files: [],
    // Platform capture cropped to the 3D scene and legend (no readings, no contract line).
    coverKind: 'capture',
    cover: '/assets/proyectos/gemelo-3d-portada.jpg',
    photos: [
      { src: '/assets/proyectos/gemelo-3d.jpg', w: 1000, h: 408 },
      { src: '/assets/proyectos/ptap-rural.jpg', w: 800, h: 1067 },
    ] },
  { id: 'P-004', slug: 'iotio-telemetria', featured: false, year: '2023', scheme: 'iot',
    tags: ['Django', 'React', 'InfluxDB'], filters: ['digital'], files: [] },
  { id: 'P-005', slug: 'plantas-lixiviados-bma', featured: false, year: '2018–25', scheme: 'industrial',
    tags: [{ k: 'fisicoquimico' }, { k: 'biologico' }, 'SCADA', 'P&IDs'], filters: ['agua'], files: [],
    // Own photograph, Buenaventura, 2021. `cover` is a tight crop of it for the card
    // (the full photo, with the author in it, goes in the gallery).
    cover: '/assets/proyectos/lixiviados-bma-portada.jpg',
    photos: [{ src: '/assets/proyectos/lixiviados-bma-planta.jpg', w: 800, h: 1066 }] },
  { id: 'P-006', slug: 'psmv-rural-inalter', featured: false, year: '2019', scheme: 'network',
    tags: ['EPA-SWMM', 'Manning', 'MAGNA-SIRGAS', 'PSMV'], filters: ['agua'], files: [],
    // Gallery only: the adult, cropped so that no minors appear. The card keeps the scheme.
    photos: [{ src: '/assets/proyectos/jornada-comunidad.jpg', w: 210, h: 475 }] },
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

// Small drawing of each figure in the hero's "scale" tiles, by position:
// one dot per plant / discharge, or a segmented line for the sewer network.
export const SCOPE_MARKS = [
  { kind: 'dots', n: 37 },
  { kind: 'line', n: 0 },
  { kind: 'dots', n: 10 },
  { kind: 'dots', n: 16 },
];
