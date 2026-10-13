import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LangProvider } from '../../src/i18n.jsx';
import ProjectModal from '../../src/components/ProjectModal.jsx';
import { projectById } from '../../src/data/projects.js';

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem('giova_water:lang', 'es');
});

function Harness({ onCloseSpy }) {
  const [open, setOpen] = React.useState(null);
  const [, force] = React.useState(0);
  return (
    <LangProvider>
      <button onClick={() => setOpen(projectById('P-007'))}>abrir</button>
      <button onClick={() => force(n => n + 1)}>re-render</button>
      {/* new onClose identity on every render, like App used to do */}
      <ProjectModal project={open} onClose={() => { onCloseSpy?.(); setOpen(null); }} />
    </LangProvider>
  );
}

describe('ProjectModal — teclado y foco', () => {
  it('moves focus to the close button, closes with Escape and restores focus to the opener', () => {
    render(<Harness />);
    const opener = screen.getByText('abrir');
    opener.focus();
    fireEvent.click(opener);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Cerrar/ }));

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('does not steal focus when the parent re-renders with a new onClose', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('abrir'));
    const close = screen.getByRole('button', { name: /Cerrar/ });
    const link = screen.getAllByRole('link')[0];
    link.focus();
    fireEvent.click(screen.getByText('re-render'));
    expect(document.activeElement).toBe(link);
    expect(close).toBeTruthy();
  });

  it('shows challenge, responsibility, solution, result and evidence in order', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('abrir'));
    const heads = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    const order = ['Reto', 'Responsabilidad', 'Solución', 'Resultado', 'Evidencia'].map(w => heads.findIndex(h => h.includes(w)));
    expect(order.every(i => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('keeps Tab inside the dialog', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('abrir'));
    const panelLinks = screen.getByRole('dialog').querySelectorAll('a[href], button');
    const last = panelLinks[panelLinks.length - 1];
    last.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
  });
});
