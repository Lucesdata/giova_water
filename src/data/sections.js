// Page sections in reading order. They drive the nav, the active-section
// indicator and the footer. `sobre` and `gemelos` keep their old ids so existing
// links still work; the old `#objetos` and `#faq` links land on blocks inside
// the Digital and Contact sections.
export const SECTIONS = [
  { id: 'inicio' },
  { id: 'proyectos' },
  { id: 'sobre' },
  { id: 'gemelos' },
  { id: 'contacto' },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);
// The nav leaves out Inicio: the logo already goes there.
export const NAV_SECTIONS = SECTIONS.filter((s) => s.id !== 'inicio');
