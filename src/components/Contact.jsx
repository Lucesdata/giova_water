import React, { useState } from 'react';
import { SectionIndex, StatusDot, Logo, Copyable } from './primitives.jsx';
import { useT } from '../i18n.jsx';
import { useBreakpoint } from '../hooks/useBreakpoint.js';

export function Contact() {
  const { isMobile } = useBreakpoint();
  const t = useT();
  const [form, setForm] = useState({ name: '', email: '', org: '', type: '', msg: '' });
  const [sent, setSent] = useState(false);
  const onChange = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };
  const card = t('contact.card');
  const F = t('contact.form');
  const types = F.types || [];
  const sentId = Date.now().toString(36).toUpperCase();

  return (
    <section id="contacto" className="section" aria-labelledby="contact-title">
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr', gap: 32, marginBottom: 48 }}>
        <SectionIndex n="04" kicker={t('contact.kicker')} title={t('contact.title')} />
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <h2 id="contact-title" style={{
            margin: 0, fontFamily: 'var(--f-mono)',
            fontSize: 'clamp(34px, 4.2vw, 56px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.05,
          }}>
            {t('contact.h2a')} <span style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', color: 'var(--accent)' }}>{t('contact.h2b')}</span>
          </h2>
          <StatusDot label={t('nav.banner.available')} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '340px 1fr', gap: isMobile ? 32 : 48 }}>
        <div>
          <div style={{ border: '1px solid var(--line-hi)', background: 'var(--bg-1)' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{card.header}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--accent)' }}>v1</span>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ marginBottom: 20 }}>
                <div className="label-accent" style={{ marginBottom: 6 }}>{card.email}</div>
                <Copyable value="lucesproject@gmail.com" ariaLabel="Copiar email">
                  <span className="mono" style={{ fontSize: 13, color: 'var(--ink)' }}>lucesproject@gmail.com</span>
                </Copyable>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div className="label-accent" style={{ marginBottom: 6 }}>{card.tel}</div>
                <Copyable value="+34 673 506 760" ariaLabel="Copiar teléfono">
                  <span className="mono" style={{ fontSize: 13, color: 'var(--ink)' }}>+34 673 506 760</span>
                </Copyable>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div className="label-accent" style={{ marginBottom: 6 }}>{card.location}</div>
                <div className="mono" style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                  {card.locationValue}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div className="label-accent" style={{ marginBottom: 6 }}>{card.hours}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-1)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                  {card.hoursValue}
                </div>
              </div>
              <div style={{ paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                <StatusDot label={card.availableLong} />
              </div>
            </div>
          </div>

          <div style={{ border: '1px solid var(--line)', marginTop: 16, padding: 14, background: 'var(--bg-1)' }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 8 }}>{card.geo}</div>
            <svg viewBox="0 0 240 100" width="100%" height="90" role="img" aria-label="Mapa BCN ↔ Cali" style={{ display: 'block' }}>
              <defs>
                <pattern id="geodot" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.5" fill="var(--line-2)"/>
                </pattern>
              </defs>
              <rect width="240" height="100" fill="url(#geodot)"/>
              <path d="M 0 50 Q 60 40 120 55 T 240 50" stroke="var(--line-hi)" strokeWidth="0.6" fill="none"/>
              <circle cx="165" cy="52" r="4" fill="var(--accent)"/>
              <circle cx="165" cy="52" r="10" stroke="var(--accent-line)" fill="none">
                <animate attributeName="r" values="5;15;5" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite"/>
              </circle>
              <text x="155" y="42" fontFamily="JetBrains Mono" fontSize="8" fill="var(--ink-1)">BCN</text>
              <circle cx="56" cy="68" r="2.5" fill="var(--accent-2)" opacity="0.8"/>
              <text x="38" y="80" fontFamily="JetBrains Mono" fontSize="8" fill="var(--ink-2)">CALI</text>
              <line x1="56" y1="68" x2="165" y2="52" stroke="var(--accent-line)" strokeDasharray="2 2" strokeWidth="0.6"/>
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--f-mono)', fontSize: 9.5, color: 'var(--ink-3)', marginTop: 6 }}>
              <span>41.3879°N · 2.0456°E</span>
              <span>3.4516°N · 76.5320°W</span>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ border: '1px solid var(--line-hi)', background: 'var(--bg-1)' }}>
          <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-2)' }}>
              MSG-{new Date().getFullYear()}-{String(Math.floor(Math.random()*9999)).padStart(4,'0')} · {F.msgId}
            </span>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--accent)' }}>{F.draft}</span>
          </div>
          <div style={{ padding: 24 }}>
            {sent ? (
              <div role="status" aria-live="polite" style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'var(--f-mono)' }}>
                <div style={{ color: 'var(--accent)', fontSize: 14, marginBottom: 10 }}>{F.sentTitle}</div>
                <div style={{ color: 'var(--ink-1)', fontSize: 13 }}>{F.sentBody}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 20 }}>
                  {F.sentStatus.replace('{id}', sentId)}
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label htmlFor="f-name" className="label" style={{ display: 'block', marginBottom: 6 }}>{F.name}</label>
                    <input id="f-name" required value={form.name} onChange={onChange('name')} placeholder={F.namePh}/>
                  </div>
                  <div>
                    <label htmlFor="f-email" className="label" style={{ display: 'block', marginBottom: 6 }}>{F.email}</label>
                    <input id="f-email" required type="email" value={form.email} onChange={onChange('email')} placeholder={F.emailPh}/>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="f-org" className="label" style={{ display: 'block', marginBottom: 6 }}>{F.org}</label>
                  <input id="f-org" value={form.org} onChange={onChange('org')} placeholder={F.orgPh}/>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="f-type" className="label" style={{ display: 'block', marginBottom: 6 }}>{F.type}</label>
                  <select id="f-type" value={form.type} onChange={onChange('type')}>
                    {types.map(tp => <option key={tp.v} value={tp.v} style={{ background: 'var(--bg-1)', color: 'var(--ink)' }}>{tp.l}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label htmlFor="f-msg" className="label" style={{ display: 'block', marginBottom: 6 }}>
                    {F.msg}
                    <span style={{ float: 'right', color: 'var(--ink-3)' }}>{form.msg.length}/1000</span>
                  </label>
                  <textarea id="f-msg" rows={5} value={form.msg} onChange={onChange('msg')} maxLength={1000} placeholder={F.msgPh}/>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{F.encrypted}</span>
                  <button type="submit" className="btn primary">{F.submit}</button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

export function Footer() {
  const { isMobile } = useBreakpoint();
  const t = useT();
  return (
    <footer style={{ borderTop: '1px solid var(--line)', padding: '40px 0 24px', marginTop: 40 }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : '2fr 1fr 1fr 1fr', gap: isMobile ? 24 : 32, marginBottom: 40 }}>
        <div>
          <Logo />
          <p style={{ margin: '16px 0 0', color: 'var(--ink-2)', fontSize: 12.5, lineHeight: 1.6, maxWidth: 340 }}>
            {t('footer.about')}
          </p>
        </div>
        <div>
          <div className="label-accent" style={{ marginBottom: 12 }}>{t('footer.sections')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--f-mono)', fontSize: 12 }}>
            {['inicio','sobre','proyectos','gemelos','contacto'].map(id => (
              <a key={id} href={`#${id}`} style={{ color: 'var(--ink-1)', textDecoration: 'none' }}>→ {t(`nav.items.${id}`)}</a>
            ))}
          </div>
        </div>
        <div>
          <div className="label-accent" style={{ marginBottom: 12 }}>{t('footer.direct')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--ink-1)' }}>
            <span>lucesproject@gmail.com</span>
            <span>+34 673 506 760</span>
            <span>LinkedIn / GitHub</span>
          </div>
        </div>
        <div>
          <div className="label-accent" style={{ marginBottom: 12 }}>{t('footer.meta')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--ink-1)' }}>
            <span>{t('footer.buildLabel')}</span>
            <span>{t('footer.tech')}</span>
            <span>{t('footer.langs')}</span>
          </div>
        </div>
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid var(--line)', paddingTop: 14,
        fontFamily: 'var(--f-mono)', fontSize: 10.5, color: 'var(--ink-3)',
      }}>
        <span>{t('footer.copy')}</span>
        <span>{t('footer.eof')}</span>
        <span>41.3879°N · 2.0456°E</span>
      </div>
    </footer>
  );
}
