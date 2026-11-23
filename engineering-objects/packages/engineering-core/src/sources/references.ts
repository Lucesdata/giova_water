/**
 * Referencias técnicas. Todo valor numérico de criterio debe citar una (spec §4.3 y §15).
 *
 * verification:
 *  - VERIFIED_BY_USER: el usuario comprobó el valor contra la edición citada.
 *  - TO_VERIFY: transcrito de la bibliografía por el equipo de desarrollo; antes de usarlo en
 *    proyecto hay que contrastarlo con la edición indicada.
 *  - USER_DEFINED: criterio introducido por el proyectista; la fuente es su responsabilidad.
 *  - DIDACTIC: hipótesis de ejercicio, sin valor normativo.
 */
export type SourceVerification = 'VERIFIED_BY_USER' | 'TO_VERIFY' | 'USER_DEFINED' | 'DIDACTIC';

export interface SourceReference {
  readonly id: string;
  readonly title: string;
  readonly edition: string;
  readonly locator?: string;
  readonly scope: string;
  readonly verification: SourceVerification;
}

export const REFERENCES = {
  'SPEC-DEC-002-DIDACTIC': {
    id: 'SPEC-DEC-002-DIDACTIC',
    title: 'MASTER SPEC SPEC-DEC-001/002 — escenario didáctico §6.2',
    edition: 'v1.0',
    locator: '§6.2 (CHS = 1,5 m/h, sin restricciones adicionales)',
    scope: 'Comprobación puramente matemática del motor; no es un criterio de diseño.',
    verification: 'DIDACTIC',
  },
  'METCALF-EDDY-2014': {
    id: 'METCALF-EDDY-2014',
    title: 'Metcalf & Eddy | AECOM — Wastewater Engineering: Treatment and Resource Recovery',
    edition: '5.ª ed., McGraw-Hill, 2014',
    locator: 'Cap. 5, tablas de criterios de diseño de sedimentadores primarios',
    scope: 'Rangos típicos de bibliografía para prediseño; no sustituyen la normativa local.',
    verification: 'TO_VERIFY',
  },
  'TEN-STATES-2014': {
    id: 'TEN-STATES-2014',
    title: 'Recommended Standards for Wastewater Facilities (Ten States Standards)',
    edition: 'Edición 2014, Great Lakes–Upper Mississippi River Board',
    locator: 'Cap. 70 (Settling)',
    scope: 'Norma de referencia en EE. UU.; útil como contraste, no obligatoria en la UE.',
    verification: 'TO_VERIFY',
  },
  'ISO-1438-2017': {
    id: 'ISO-1438-2017',
    title: 'ISO 1438 — Hydrometry: Open channel flow measurement using thin-plate weirs',
    edition: '2017',
    locator: 'Vertedero triangular de pared delgada (fórmula de Kindsvater-Shen)',
    scope: 'Ecuación de descarga de escotaduras en V.',
    verification: 'TO_VERIFY',
  },
  'CHOW-1959': {
    id: 'CHOW-1959',
    title: 'V. T. Chow — Open-Channel Hydraulics',
    edition: 'McGraw-Hill, 1959',
    locator: 'Canal con caída libre: calado aguas arriba ≈ √3·yc para canal horizontal con aporte lateral uniforme',
    scope: 'Prediseño del canal perimetral de recogida.',
    verification: 'TO_VERIFY',
  },
  'EN-1992-1-1-2004': {
    id: 'EN-1992-1-1-2004',
    title: 'EN 1992-1-1 Eurocódigo 2 — Proyecto de estructuras de hormigón. Parte 1-1',
    edition: '2004 (+AC:2010)',
    locator: 'Tabla 3.1 (características de resistencia y deformación del hormigón)',
    scope: 'Propiedades mecánicas nominales del hormigón.',
    verification: 'TO_VERIFY',
  },
  'EN-1991-1-1-2002': {
    id: 'EN-1991-1-1-2002',
    title: 'EN 1991-1-1 Eurocódigo 1 — Acciones. Pesos específicos',
    edition: '2002',
    locator: 'Anexo A (pesos específicos de materiales)',
    scope: 'Densidades nominales de materiales de construcción.',
    verification: 'TO_VERIFY',
  },
  'EN-10025-2-2019': {
    id: 'EN-10025-2-2019',
    title: 'EN 10025-2 — Productos laminados en caliente de aceros estructurales no aleados',
    edition: '2019',
    locator: 'Límite elástico mínimo para espesor nominal ≤ 16 mm',
    scope: 'Acero S275JR / S355J2.',
    verification: 'TO_VERIFY',
  },
  'EN-10088-2-2014': {
    id: 'EN-10088-2-2014',
    title: 'EN 10088-2 — Aceros inoxidables. Chapas y bandas para usos generales',
    edition: '2014',
    locator: 'Rp0,2 mínimo de 1.4301 y 1.4404 (chapa laminada en frío)',
    scope: 'Acero inoxidable austenítico.',
    verification: 'TO_VERIFY',
  },
  'EN-206-2013': {
    id: 'EN-206-2013',
    title: 'EN 206 — Hormigón: especificaciones, prestaciones, producción y conformidad',
    edition: '2013+A2:2021',
    locator: 'Clases de exposición XC, XA',
    scope: 'Designación de exposición y durabilidad.',
    verification: 'TO_VERIFY',
  },
  'ISO-6708-1995': {
    id: 'ISO-6708-1995',
    title: 'ISO 6708 — Componentes de tuberías. Definición y selección de DN',
    edition: '1995',
    scope: 'Serie de diámetros nominales. El DN no es el diámetro interior: se usa como aproximación de prediseño.',
    verification: 'TO_VERIFY',
  },
  'EN-ISO-14122-2-2016': {
    id: 'EN-ISO-14122-2-2016',
    title: 'EN ISO 14122-2 — Seguridad de las máquinas. Medios de acceso permanentes. Plataformas y pasarelas',
    edition: '2016',
    locator: 'Anchura libre mínima de pasarela',
    scope: 'Geometría mínima de pasarelas de mantenimiento.',
    verification: 'TO_VERIFY',
  },
  'UNE-EN-12255-4-2023': {
    id: 'UNE-EN-12255-4-2023',
    title: 'UNE-EN 12255-4 — Plantas depuradoras de aguas residuales. Parte 4: Tratamiento primario',
    edition: '2023',
    scope:
      'Norma de referencia del alcance. NO se ha transcrito ningún valor numérico de ella: sus requisitos deben incorporarse como perfil de "criterios de proyecto" con fuente verificada.',
    verification: 'TO_VERIFY',
  },
  'TEN-STATES-WATER-2018': {
    id: 'TEN-STATES-WATER-2018',
    title: 'Recommended Standards for Water Works (Ten States Standards)',
    edition: 'Edición 2018, Great Lakes–Upper Mississippi River Board',
    locator: '§4.2 (floculación: tiempo de detención y velocidad periférica de las paletas)',
    scope: 'Norma de referencia en EE. UU. para potabilización; útil como contraste, no obligatoria en la UE.',
    verification: 'TO_VERIFY',
  },
  'MWH-2012': {
    id: 'MWH-2012',
    title: 'MWH — Water Treatment: Principles and Design',
    edition: '3.ª ed., Wiley, 2012',
    locator: 'Cap. 9 (floculación: gradiente de velocidad G, producto Gt, potencia de paletas P = ½·CD·ρ·A·v³)',
    scope: 'Rangos típicos y ecuaciones de floculación mecánica.',
    verification: 'TO_VERIFY',
  },
  'ONTARIO-DWS-2008': {
    id: 'ONTARIO-DWS-2008',
    title: 'Design Guidelines for Drinking-Water Systems (Ontario Ministry of the Environment)',
    edition: '2008',
    locator: '§5.5 (sedimentación convencional: carga superficial 1,0–2,4 m/h)',
    scope: 'Agua potable. Rango indicativo citado también en guías técnicas secundarias; no es un límite universal.',
    verification: 'TO_VERIFY',
  },
  'CRC-HANDBOOK': {
    id: 'CRC-HANDBOOK',
    title: 'CRC Handbook of Chemistry and Physics — Viscosity and density of liquid water',
    edition: '97.ª ed., 2016',
    locator: 'Tablas de propiedades del agua de 0 a 40 °C',
    scope: 'Viscosidad dinámica y densidad del agua pura a presión atmosférica.',
    verification: 'TO_VERIFY',
  },
  USER: {
    id: 'USER',
    title: 'Criterio introducido por el proyectista',
    edition: '—',
    scope: 'Responsabilidad del usuario. Debe documentar su origen en el campo note.',
    verification: 'USER_DEFINED',
  },
} as const satisfies Record<string, SourceReference>;

export type ReferenceId = keyof typeof REFERENCES;

export function getReference(id: string): SourceReference | undefined {
  return (REFERENCES as Record<string, SourceReference>)[id];
}
