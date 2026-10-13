import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { LangProvider } from '../../src/i18n.jsx';
import { Contact } from '../../src/components/Contact.jsx';

let hrefSet;
const realLocation = window.location;

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem('giova_water:lang', 'es');
  hrefSet = vi.fn();
  delete window.location;
  window.location = { ...realLocation, set href(v) { hrefSet(v); }, get href() { return ''; } };
  Object.defineProperty(window, 'matchMedia', {
    writable: true, configurable: true,
    value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  });
});
afterEach(() => { window.location = realLocation; });

const setup = () => render(<LangProvider><Contact /></LangProvider>);
const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('Contact — flujo mailto', () => {
  it('does not open the mail app and shows errors when required fields are empty', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Preparar email' }));
    expect(hrefSet).not.toHaveBeenCalled();
    expect(screen.getByText('Escribe tu nombre.')).toBeTruthy();
    expect(screen.getByText(/email válido/)).toBeTruthy();
    expect(screen.getByText('Escribe un mensaje.')).toBeTruthy();
    expect(document.activeElement.id).toBe('f-name');
  });

  it('rejects a malformed email', () => {
    setup();
    fill(/^Nombre/, 'Ana'); fill(/^Email/, 'ana@'); fill(/^Mensaje/, 'Hola');
    fireEvent.click(screen.getByRole('button', { name: 'Preparar email' }));
    expect(hrefSet).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^Email/).getAttribute('aria-invalid')).toBe('true');
  });

  it('opens a mailto: link and says the message has NOT been sent', () => {
    setup();
    fill(/^Nombre/, 'Ana Pérez'); fill(/^Email/, 'ana@empresa.com'); fill(/^Mensaje/, 'Necesito un presupuesto');
    fireEvent.change(screen.getByLabelText(/^Tipo de proyecto/), { target: { value: 'presupuestos' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preparar email' }));

    expect(hrefSet).toHaveBeenCalledTimes(1);
    const url = new URL(hrefSet.mock.calls[0][0]);
    expect(url.protocol).toBe('mailto:');
    expect(url.searchParams.get('body')).toContain('Estructuración y presupuestos');

    const status = screen.getByRole('status');
    expect(within(status).getByText(/Todavía no se ha enviado/)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/mensaje recibido|enviado con éxito|✓ MENSAJE/i);
  });

  it('offers email, phone and WhatsApp and the budgets category', () => {
    setup();
    expect(document.querySelector('a[href^="mailto:lucesproject@gmail.com"]')).not.toBeNull();
    expect(document.querySelector('a[href="tel:+34673506760"]')).not.toBeNull();
    expect(document.querySelector('a[href^="https://wa.me/34673506760"]')).not.toBeNull();
    expect(screen.getByRole('option', { name: 'Estructuración y presupuestos' })).toBeTruthy();
  });

  it('marks organisation and category as optional', () => {
    setup();
    expect(screen.getByLabelText(/^Organización o empresa/).required).toBe(false);
    expect(screen.getByLabelText(/^Tipo de proyecto/).required).toBe(false);
  });
});
