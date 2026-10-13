// Page sections in reading order. The numbers drive the nav, the scroll rail and
// the section labels, so they always agree with the order on the page.
// `sobre` and `gemelos` keep their old ids so existing links still work.
export const SECTIONS = [
  { id: 'inicio', n: '00' },
  { id: 'proyectos', n: '01' },
  { id: 'sobre', n: '02' },
  { id: 'gemelos', n: '03' },
  { id: 'faq', n: '04' },
  { id: 'contacto', n: '05' },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);
export const sectionNumber = (id) => SECTIONS.find((s) => s.id === id)?.n ?? '';
