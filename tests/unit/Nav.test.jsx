import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Nav from '../../src/components/Nav.jsx';

vi.mock('../../src/i18n.jsx', () => ({
  useT: () => (key) => key,
  useLang: () => ['es', vi.fn(), ['es', 'en']],
}));

vi.mock('../../src/hooks/useBreakpoint.js', () => ({
  useBreakpoint: vi.fn(),
}));

import { useBreakpoint } from '../../src/hooks/useBreakpoint.js';

describe('Nav — mobile', () => {
  beforeEach(() => {
    useBreakpoint.mockReturnValue({ isMobile: true });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  it('renders hamburger button in mobile', () => {
    render(<Nav active="inicio" />);
    expect(screen.getByLabelText('Abrir menú')).toBeTruthy();
  });

  it('opens overlay when hamburger is clicked', () => {
    render(<Nav active="inicio" />);
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    expect(screen.getByLabelText('Cerrar menú')).toBeTruthy();
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
  });

  it('closes overlay on Escape key', () => {
    render(<Nav active="inicio" />);
    fireEvent.click(screen.getByLabelText('Abrir menú'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByLabelText('Cerrar menú')).toBeNull();
  });
});
