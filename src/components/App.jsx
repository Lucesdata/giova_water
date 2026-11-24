import React, { useState, useEffect, useCallback } from 'react';
import { useActiveSection } from './primitives.jsx';
import { SECTION_IDS } from '../data/sections.js';
import { projectFromHash, projectHash } from '../data/projects.js';
import { useInitialHashScroll } from '../hooks/useNavigation.js';
import { useT } from '../i18n.jsx';
import Nav from './Nav.jsx';
import Hero from './Hero.jsx';
import About from './About.jsx';
import Projects from './Projects.jsx';
import ProjectModal from './ProjectModal.jsx';
import Digital from './Digital.jsx';
import { Contact, Footer } from './Contact.jsx';

export default function App() {
  const active = useActiveSection(SECTION_IDS);
  useInitialHashScroll();
  // The open project is part of the address (#proyecto/<slug>), so a project can
  // be opened directly, shared, and closed with the browser's Back button.
  const [openProject, setOpenProject] = useState(() => projectFromHash(window.location.hash) || null);
  const t = useT();

  const openProjectFromUi = useCallback((p) => {
    window.history.pushState({ modal: true }, '', projectHash(p));
    setOpenProject(p);
  }, []);

  // `nextHash`: where to go after closing (e.g. #contacto). Without it the page
  // returns to where it was, or to the projects section if it was opened directly.
  const closeProject = useCallback((nextHash) => {
    const target = typeof nextHash === 'string' ? nextHash : null;
    if (!target && window.history.state?.modal) { window.history.back(); return; }
    window.history.replaceState(null, '', target || '#proyectos');
    setOpenProject(null);
    requestAnimationFrame(() => {
      document.getElementById((target || '#proyectos').slice(1))?.scrollIntoView({ block: 'start' });
    });
  }, []);

  useEffect(() => {
    const sync = () => setOpenProject(projectFromHash(window.location.hash) || null);
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => { window.removeEventListener('popstate', sync); window.removeEventListener('hashchange', sync); };
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">{t('nav.aria.skip')}</a>
      <Nav active={active} />
      <main id="main" tabIndex={-1} className="page">
        <section id="inicio" aria-label={t('nav.items.inicio')}>
          <Hero />
        </section>
        <Projects onOpen={openProjectFromUi} />
        <About />
        <Digital />
        <Contact />
      </main>
      <Footer />
      <ProjectModal project={openProject} onClose={closeProject} />
    </>
  );
}
