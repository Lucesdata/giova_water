// Project metadata that's language-agnostic. Translated text lives in i18n.jsx
// under projects.data.<id>.
export const projectsData = [
  {
    id: 'P-001', year: '2022–25', loc: 'Cali, CO',
    tags: ['EPA-SWMM', 'P&IDs', 'CVC', 'Res.330/2017'],
    metricKeys: ['PE diseño', 'Red', 'Pozos'],
    filters: ['agua'],
    color: '#1e3a5f',
    image: '/assets/giovanni-field.jpg',
    video: '/assets/cards/p001.mp4',
  },
  {
    id: 'P-002', year: '2018–24', loc: 'Cali, CO',
    tags: ['EPANET', 'Python', 'Power BI', 'SCADA'],
    metricKeys: ['Plantas', 'Hab. servidos', 'Red PSMV'],
    filters: ['agua'],
    color: '#1c4a3a',
    video: '/assets/cards/p002.mp4',
  },
  {
    id: 'P-003', year: '2024', loc: 'Cali, CO',
    tags: ['Three.js', 'Chart.js', 'Motor HID'],
    metricKeys: ['Sensores', 'Refresh', 'Nodos'],
    filters: ['digital'],
    color: '#3a2660',
    featured: true,
    video: '/assets/cards/p003.mp4',
  },
  {
    id: 'P-004', year: '2023', loc: 'Remoto',
    tags: ['Django', 'React', 'InfluxDB'],
    metricKeys: ['Clientes', 'Puntos', 'Uptime'],
    filters: ['digital'],
    color: '#2c2a10',
    video: '/assets/cards/p004.mp4',
  },
  {
    id: 'P-005', year: '2018–25', loc: 'Buenaventura, CO',
    tags: ['Fisicoquímico', 'Biológico', 'SCADA', 'P&IDs'],
    metricKeys: ['Capacidad', 'Volumen', 'Permisos'],
    filters: ['agua'],
    color: '#1c3628',
    video: '/assets/cards/p005.mp4',
  },
  {
    id: 'P-006', year: '2019', loc: 'Cali, CO',
    tags: ['EPA-SWMM', 'Manning', 'MAGNA-SIRGAS', 'PSMV'],
    metricKeys: ['Pozos', 'Red modelada', 'PSMV'],
    filters: ['agua'],
    color: '#2a1f38',
    video: '/assets/cards/p006.mp4',
  },
];
