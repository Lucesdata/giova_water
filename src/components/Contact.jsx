import React, { useState, useRef } from 'react';
import { SectionIndex, StatusDot, Logo, Copyable, Reveal } from './primitives.jsx';
import { useT } from '../i18n.jsx';
import { useBreakpoint } from '../hooks/useBreakpoint.js';
import { CONTACT, whatsappUrl, telUrl, validateContact, buildMailto } from '../lib/contact.js';
import { SECTIONS, sectionNumber } from '../data/sections.js';

const GITHUB_URL = 'https://github.com/Lucesdata';

function Field({ id, label, optionalLabel, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} className="label" style={{ display: 'block', marginBottom: 6 }}>
        {label}{optionalLabel && <span style={{ textTransform: 'none', letterSpacing: 0 }}> · {optionalLabel}</span>}
      </label>
      {children}
      {error && <p id={`${id}-err`} className="field-error">{error}</p>}
    </div>
  );
}

export function Contact() {
  const { isMobile } = useBreakpoint();
  const t = useT();
  const [form, setForm] = useState({ name: '', email: '', org: '', type: '', msg: '' });
  const [errors, setErrors] = useState({});
  const [attempted, setAttempted] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const formRef = useRef(null);
  const card = t('contact.card');
  const F = t('contact.form');
  const types = Array.isArray(F.types) ? F.types : [];

  const onChange = (k) => (e) => {
    const next = { ...form, [k]: e.target.value };
    setForm(next);
    setPrepared(false);
    if (attempted) setErrors(validateContact(next));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setAttempted(true);
    const errs = validateContact(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = ['name', 'email', 'msg'].find(k => errs[k]);
      formRef.current?.querySelector(`#f-${first}`)?.focus();
      return;
    }
    const typeLabel = types.find(tp => tp.v === form.type && tp.v)?.l || '';
    const href = buildMailto(form, { subject: F.mail.subject, labels: F.mail, typeLabel });
    setPrepared(true);
    // Opens the visitor's own mail app; nothing is sent from this page.
    window.location.href = href;
  };

  const errText = (k) => (errors[k] ? F.errors[k] : undefined);
  const invalidCount = Object.keys(errors).length;
  const area = (name) => ({ gridArea: name, minWidth: 0 });

  return (
    <section id="contacto" className="section" aria-labelledby="contact-title">
      <Reveal style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: 32, marginBottom: 48 }}>
        <SectionIndex n={sectionNumber('contacto')} kicker={t('contact.kicker')} title={t('contact.title')} />
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <h2 id="contact-title" className="h2">
            {t('contact.h2a')} <span style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', color: 'var(--accent)' }}>{t('contact.h2b')}</span>
          </h2>
          <StatusDot label={card.availableLong} />
        </div>
      </Reveal>

      <div style={{
        display: 'grid', gap: isMobile ? 32 : 48,
        gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : '340px minmax(0, 1fr)',
        gridTemplateAreas: isMobile ? '"card" "form" "map"' : '"card form" "map form"',
        alignItems: 'start',
      }}>
        <Reveal style={{ ...area('card'), border: '1px solid var(--line-hi)', background: 'var(--bg-1)' }}>
          <div className="mono" style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)', fontSize: 12, color: 'var(--ink-2)' }}>{card.header}</div>
          <dl style={{ margin: 0, padding: 16, display: 'grid', gap: 16 }}>
            <div>
              <dt className="label-accent" style={{ marginBottom: 4 }}>{card.email}</dt>
              <dd style={{ margin: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0 12px' }}>
                <a href={`mailto:${CONTACT.email}`} className="mono text-link" style={{ fontSize: 14 }}>{CONTACT.email}</a>
                <Copyable value={CONTACT.email} ariaLabel={t('common.copyEmail')}><span className="mono" style={{ fontSize: 12 }}>{t('common.copy')}</span></Copyable>
              </dd>
            </div>
            <div>
              <dt className="label-accent" style={{ marginBottom: 4 }}>{card.tel}</dt>
              <dd style={{ margin: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0 12px' }}>
                <a href={telUrl()} className="mono text-link" style={{ fontSize: 14 }}>{CONTACT.phone}</a>
                <Copyable value={CONTACT.phone} ariaLabel={t('common.copyPhone')}><span className="mono" style={{ fontSize: 12 }}>{t('common.copy')}</span></Copyable>
              </dd>
            </div>
            <div>
              <dt className="label-accent" style={{ marginBottom: 4 }}>{card.whatsapp}</dt>
              <dd style={{ margin: 0 }}>
                <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="btn" style={{ width: '100%', justifyContent: 'center' }}>
                  {card.whatsappCta} <span aria-hidden="true">↗</span>
                </a>
              </dd>
            </div>
            <div>
              <dt className="label-accent" style={{ marginBottom: 4 }}>{card.location}</dt>
              <dd className="mono" style={{ margin: 0, fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{card.locationValue}</dd>
            </div>
            <div>
              <dt className="label-accent" style={{ marginBottom: 4 }}>{card.hours}</dt>
              <dd className="mono" style={{ margin: 0, fontSize: 13, color: 'var(--ink-1)' }}>{card.hoursValue}</dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={120} style={area('form')}>
        <form ref={formRef} onSubmit={onSubmit} noValidate style={{ border: '1px solid var(--line-hi)', background: 'var(--bg-1)' }}>
          <div className="mono" style={{ padding: '10px 20px', borderBottom: '1px solid var(--line)', fontSize: 12, color: 'var(--ink-2)' }}>
            {F.header}
          </div>
          <div style={{ padding: isMobile ? 16 : 24 }}>
            {attempted && invalidCount > 0 && (
              <p role="alert" className="form-summary">{F.errors.summary}</p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))', gap: isMobile ? 0 : 16 }}>
              <Field id="f-name" label={`${F.name} *`} error={errText('name')}>
                <input id="f-name" name="name" autoComplete="name" value={form.name} onChange={onChange('name')} placeholder={F.namePh}
                  aria-required="true" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'f-name-err' : undefined}/>
              </Field>
              <Field id="f-email" label={`${F.email} *`} error={errText('email')}>
                <input id="f-email" name="email" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={onChange('email')} placeholder={F.emailPh}
                  aria-required="true" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'f-email-err' : undefined}/>
              </Field>
            </div>
            <Field id="f-org" label={F.org} optionalLabel={F.optional}>
              <input id="f-org" name="organization" autoComplete="organization" value={form.org} onChange={onChange('org')} placeholder={F.orgPh}/>
            </Field>
            <Field id="f-type" label={F.type} optionalLabel={F.optional}>
              <select id="f-type" name="type" value={form.type} onChange={onChange('type')}>
                {types.map(tp => <option key={tp.v} value={tp.v} style={{ background: 'var(--bg-1)', color: 'var(--ink)' }}>{tp.l}</option>)}
              </select>
            </Field>
            <Field id="f-msg" label={`${F.msg} *`} error={errText('msg')}>
              <textarea id="f-msg" name="message" rows={5} value={form.msg} onChange={onChange('msg')} maxLength={1000} placeholder={F.msgPh}
                aria-required="true" aria-invalid={!!errors.msg} aria-describedby={errors.msg ? 'f-msg-err' : undefined}/>
              <div className="mono" style={{ textAlign: 'right', fontSize: 12, color: 'var(--ink-2)', marginTop: 4 }}>{form.msg.length}/1000</div>
            </Field>

            <p className="prose" style={{ margin: '0 0 16px' }}>{F.explain}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid var(--line)' }}>
              <button type="submit" className="btn primary">{F.prepare}</button>
              <span style={{ color: 'var(--ink-1)', fontSize: 14 }}>
                {F.fallback.replace('{email}', CONTACT.email)}
              </span>
            </div>
            <div role="status" aria-live="polite" style={{ marginTop: prepared ? 16 : 0 }}>
              {prepared && <p className="form-note">{F.prepared}</p>}
            </div>
          </div>
        </form>
        </Reveal>

        <Reveal delay={200} style={{ ...area('map'), border: '1px solid var(--line)', padding: 16, background: 'var(--bg-1)' }}>
          <div className="mono" style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 8 }}>{card.geo}</div>
          <svg viewBox="0 0 240 100" width="100%" height="90" role="img" aria-label={card.mapAlt} style={{ display: 'block' }}>
            <defs>
              <pattern id="geodot" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.5" fill="var(--line-2)"/>
              </pattern>
            </defs>
            <rect width="240" height="100" fill="url(#geodot)"/>
            <path d="M 0 50 Q 60 40 120 55 T 240 50" stroke="var(--line-hi)" strokeWidth="0.6" fill="none"/>
            <circle cx="165" cy="52" r="4" fill="var(--accent)"/>
            <text x="155" y="42" fontFamily="JetBrains Mono" fontSize="9" fill="var(--ink-1)">BCN</text>
            <circle cx="56" cy="68" r="2.5" fill="var(--accent-2)" opacity="0.8"/>
            <text x="38" y="84" fontFamily="JetBrains Mono" fontSize="9" fill="var(--ink-1)">CALI</text>
            <line x1="56" y1="68" x2="165" y2="52" stroke="var(--accent-line)" strokeDasharray="2 2" strokeWidth="0.6"/>
          </svg>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  const { isMobile } = useBreakpoint();
  const t = useT();
  return (
    <footer style={{ borderTop: '1px solid var(--line)', padding: '40px 0 24px', marginTop: 40 }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : '2fr 1fr 1fr 1fr', gap: isMobile ? 24 : 32, marginBottom: 32 }}>
        <div style={isMobile ? { gridColumn: '1 / -1' } : undefined}>
          <Logo label={t('nav.aria.home')} />
          <p style={{ margin: '16px 0 0', color: 'var(--ink-1)', fontSize: 13, lineHeight: 1.6, maxWidth: 340 }}>
            {t('footer.about')}
          </p>
        </div>
        <nav aria-label={t('footer.sections')}>
          <div className="label-accent" style={{ marginBottom: 8 }}>{t('footer.sections')}</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', fontFamily: 'var(--f-mono)', fontSize: 13 }}>
            {SECTIONS.map(({ id }) => (
              <li key={id}><a href={`#${id}`} className="footer-link">{t(`nav.items.${id}`)}</a></li>
            ))}
          </ul>
        </nav>
        <div>
          <div className="label-accent" style={{ marginBottom: 8 }}>{t('footer.direct')}</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', fontFamily: 'var(--f-mono)', fontSize: 13 }}>
            <li><a href={`mailto:${CONTACT.email}`} className="footer-link">{CONTACT.email}</a></li>
            <li><a href={telUrl()} className="footer-link">{CONTACT.phone}</a></li>
            <li><a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="footer-link">WhatsApp</a></li>
            <li><a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="footer-link">{t('footer.github')}</a></li>
          </ul>
        </div>
        <div>
          <div className="label-accent" style={{ marginBottom: 8 }}>{t('footer.meta')}</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--f-mono)', fontSize: 13, color: 'var(--ink-1)' }}>
            <li>{t('footer.langs')}</li>
            <li style={{ lineHeight: 1.5 }}>{t('footer.note')}</li>
          </ul>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14, fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--ink-2)' }}>
        {t('footer.copy')}
      </div>
    </footer>
  );
}
