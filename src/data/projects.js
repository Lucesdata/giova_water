// Project metadata that's language-agnostic. Translated text (title, role,
// result, metrics, challenge… and the location label) lives in i18n.jsx under
// projects.data.<id>. `scheme` picks the conceptual diagram in ProjectScheme.jsx.
export const projectsData = [
  { id: 'P-001', year: '2022–25', scheme: 'ptar',
    tags: ['EPA-SWMM', 'P&IDs', 'CVC', 'Res.330/2017'], filters: ['agua'] },
  { id: 'P-002', year: '2018–24', scheme: 'rural',
    tags: ['EPANET', 'Python', 'Power BI', 'SCADA'], filters: ['agua'] },
  { id: 'P-007', year: '2020–23', scheme: 'automation',
    tags: ['SCADA', 'IoT', 'Front end'], filters: ['agua', 'digital'] },
  { id: 'P-003', year: '2024', scheme: 'twin',
    tags: ['Three.js', 'Chart.js', 'Motor HID'], filters: ['digital'] },
  { id: 'P-004', year: '2023', scheme: 'iot',
    tags: ['Django', 'React', 'InfluxDB'], filters: ['digital'] },
  { id: 'P-005', year: '2018–25', scheme: 'industrial',
    tags: [{ k: 'fisicoquimico' }, { k: 'biologico' }, 'SCADA', 'P&IDs'], filters: ['agua'] },
  { id: 'P-006', year: '2019', scheme: 'network',
    tags: ['EPA-SWMM', 'Manning', 'MAGNA-SIRGAS', 'PSMV'], filters: ['agua'] },
];

export const projectById = (id) => projectsData.find((p) => p.id === id);
