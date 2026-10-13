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
    expect(screen.getByLabelText('nav.aria.openMenu')).toBeTruthy();
  });

  it('opens overlay when hamburger is clicked', () => {
    render(<Nav active="inicio" />);
    fireEvent.click(screen.getByLabelText('nav.aria.openMenu'));
    expect(screen.getByLabelText('nav.aria.closeMenu')).toBeTruthy();
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
  });

  it('closes overlay on Escape key', () => {
    render(<Nav active="inicio" />);
    fireEvent.click(screen.getByLabelText('nav.aria.openMenu'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByLabelText('nav.aria.closeMenu')).toBeNull();
  });

  it('returns focus to the menu button after closing', () => {
    render(<Nav active="inicio" />);
    const toggle = screen.getByLabelText('nav.aria.openMenu');
    fireEvent.click(toggle);
    fireEvent.click(screen.getByLabelText('nav.aria.closeMenu'));
    expect(document.activeElement).toBe(toggle);
  });

  it('shows no clock or coordinates in the banner', () => {
    const { container } = render(<Nav active="inicio" />);
    expect(container.textContent).not.toMatch(/UTC|°N|°E/);
  });
});
