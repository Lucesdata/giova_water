import { describe, it, expect } from 'vitest';
import { CONTACT, buildMailto, validateContact, whatsappUrl, telUrl } from '../../src/lib/contact.js';

const labels = { name: 'Nombre', email: 'Email', org: 'Organización', type: 'Tipo', msg: 'Mensaje' };

describe('validateContact', () => {
  it('requires name, a valid email and a message', () => {
    expect(validateContact({})).toEqual({ name: true, email: true, msg: true });
    expect(validateContact({ name: 'Ana', email: 'ana@', msg: 'hola' })).toEqual({ email: true });
    expect(validateContact({ name: '  ', email: 'ana@empresa.com', msg: 'hola' })).toEqual({ name: true });
    expect(validateContact({ name: 'Ana', email: 'ana@empresa.com', msg: ' ' })).toEqual({ msg: true });
  });
  it('accepts a complete required set; org and type stay optional', () => {
    expect(validateContact({ name: 'Ana', email: 'ana@empresa.com', msg: 'Necesito un presupuesto' })).toEqual({});
  });
});

describe('buildMailto', () => {
  const form = { name: ' Ana Pérez ', email: 'ana@empresa.com', org: '', type: 'presupuestos', msg: 'Presupuesto de 3 PTAP & red.' };
  const href = buildMailto(form, { subject: 'Consulta', labels, typeLabel: 'Estructuración y presupuestos' });
  const url = new URL(href);

  it('goes to the direct email and carries subject and body', () => {
    expect(url.protocol).toBe('mailto:');
    expect(decodeURIComponent(url.pathname)).toBe(CONTACT.email);
    expect(url.searchParams.get('subject')).toBe('Consulta');
  });
  it('writes the visible category label and the message, trimmed, and skips empty optional fields', () => {
    const body = url.searchParams.get('body');
    expect(body).toContain('Nombre: Ana Pérez');
    expect(body).toContain('Tipo: Estructuración y presupuestos');
    expect(body).toContain('Presupuesto de 3 PTAP & red.');
    expect(body).not.toContain('Organización');
  });
});

describe('direct channels', () => {
  it('builds wa.me and tel links from the same number', () => {
    expect(whatsappUrl()).toBe('https://wa.me/34673506760');
    expect(whatsappUrl('Hola')).toBe('https://wa.me/34673506760?text=Hola');
    expect(telUrl()).toBe('tel:+34673506760');
  });
});
