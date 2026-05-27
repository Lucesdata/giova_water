import React from 'react';
import { useInView, AnimatedNumber, SectionIndex, Tag, Copyable } from './primitives.jsx';
import { useT } from '../i18n.jsx';

function interpolate(template, replacements) {
  if (typeof template !== 'string') return template;
  const parts = template.split(/(\{\w+\})/);
  return parts.map((part, i) => {
    const m = part.match(/^\{(\w+)\}$/);
    if (m && replacements[m[1]] !== undefined) {
      return <React.Fragment key={i}>{replacements[m[1]]}</React.Fragment>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function SkillBar({ name, level, code }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{code}</span>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--ink)' }}>{name}</span>
        </div>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--accent)' }}>
          <AnimatedNumber value={level} trigger={inView} format={v => `${v.toFixed(0)}%`} />
        </span>
      </div>
      <div role="progressbar" aria-valuenow={level} aria-valuemin={0} aria-valuemax={100}
           aria-label={name}
           style={{ height: 3, background: 'var(--line)', position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: inView ? `${level}%` : 0,
          background: 'var(--accent)',
          transition: 'width 1.2s cubic-bezier(.2,.7,.2,1)',
        }}/>
        <div aria-hidden="true" style={{
          position: 'absolute', left: 0, top: -1, bottom: -1, pointerEvents: 'none',
          width: '100%',
          backgroundImage: 'repeating-linear-gradient(to right, transparent 0, transparent 9%, var(--bg) 9%, var(--bg) 10%)',
        }}/>
      </div>
    </div>
  );
}

function TimelineRow({ year, role, org, body, location, tags }) {
  const [ref, inView] = useInView({ threshold: 0.2 });
  return (
    <div ref={ref} style={{
      display: 'grid', gridTemplateColumns: '140px 1fr',
      gap: 32, padding: '28px 0',
      borderTop: '1px solid var(--line)',
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(12px)',
      transition: 'all 700ms var(--ease)',
    }}>
      <div>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--accent)', letterSpacing: '0.04em' }}>{year}</div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 6 }}>{location}</div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 500, letterSpacing: '-0.01em' }}>{role}</h3>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>/ {org}</span>
        </div>
        <p style={{ margin: '0 0 14px', color: 'var(--ink-1)', fontSize: 13.5, lineHeight: 1.65, maxWidth: 680 }}>{body}</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
        </div>
      </div>
    </div>
  );
}

const TIMELINE_TAGS = [
  ['PTAR 60k PE','€6M','EPA-SWMM','P&IDs','CVC'],
  ['UASB','Fisicoquímico','SCADA','Industrial'],
  ['37 PTAPs','EPANET','Python','Power BI','SCADA'],
  ['EPA-SWMM','PSMV','Manning','Res.330/2017'],
  ['UPEC','Beca','Procesos','CPQCOL'],
];

export default function About() {
  const t = useT();
  const rows = t('about.timeline.rows');
  const skills = t('about.skills');
  const idcard = t('about.idcard');
  const bold = (txt) => <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{txt}</strong>;

  return (
    <section id="sobre" className="section" aria-labelledby="about-title">
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 32, marginBottom: 48 }}>
        <SectionIndex n="01" kicker={t('about.kicker')} title={t('about.title')} />
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <h2 id="about-title" style={{
            margin: 0, fontFamily: 'var(--f-mono)',
            fontSize: 'clamp(34px, 4.2vw, 56px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.05,
          }}>
            {t('about.h2a')} <span style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', color: 'var(--ink-1)' }}>{t('about.h2b')}</span> {t('about.h2c')}
          </h2>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{t('about.lastUpdated')}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 48 }}>
        <div>
          <div style={{ border: '1px solid var(--line-hi)', background: 'var(--bg-1)' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>{idcard.id}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--accent)' }}>{idcard.verified}</span>
            </div>
            <div style={{ aspectRatio: '3/4', position: 'relative', borderBottom: '1px solid var(--line)', overflow: 'hidden', background: 'var(--bg-2)' }}>
              <img src="/assets/giovanni-portrait.jpg" alt="Retrato de Giovanni X. Guevara Duque"
                loading="lazy"
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  objectPosition: 'center 22%',
                  filter: 'saturate(0.85) contrast(1.05)',
                }}/>
              <svg aria-hidden="true" width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.35 }}>
                <defs>
                  <pattern id="id-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="var(--ink)" strokeWidth="0.4" opacity="0.25"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#id-grid)"/>
              </svg>
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none' }}/>
              {[[8,8],[null,8],[8,null],[null,null]].map(([l,top],i) => (
                <div key={i} aria-hidden="true" style={{
                  position: 'absolute', width: 12, height: 12,
                  left: l !== null ? l : undefined, right: l === null ? 8 : undefined,
                  top: top !== null ? top : undefined, bottom: top === null ? 8 : undefined,
                  borderColor: 'var(--accent)', borderStyle: 'solid',
                  borderWidth: `${top !== null ? 1.5 : 0}px ${l === null ? 1.5 : 0}px ${top === null ? 1.5 : 0}px ${l !== null ? 1.5 : 0}px`,
                  mixBlendMode: 'screen',
                }}/>
              ))}
              <div style={{
                position: 'absolute', left: 10, right: 10, bottom: 10,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontFamily: 'var(--f-mono)', fontSize: 9.5, letterSpacing: '0.1em',
                color: '#fff', mixBlendMode: 'difference', opacity: 0.8,
              }}>
                <span>{idcard.subject}</span>
                <span>{idcard.capture}</span>
              </div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 15, fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>
                Giovanni X. Guevara Duque
              </div>
              <div className="label-accent" style={{ marginBottom: 16 }}>{idcard.role}</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '14px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', marginBottom: 16 }}>
                <div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{idcard.exp}</div>
                  <div className="mono" style={{ fontSize: 16, color: 'var(--ink)' }}>11 <span style={{ fontSize: 10, color: 'var(--ink-2)' }}>{idcard.years}</span></div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{idcard.proj}</div>
                  <div className="mono" style={{ fontSize: 16, color: 'var(--ink)' }}>42<span style={{ fontSize: 10, color: 'var(--ink-2)' }}> {idcard.plants}</span></div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{idcard.pe}</div>
                  <div className="mono" style={{ fontSize: 16, color: 'var(--ink)' }}>212k<span style={{ fontSize: 10, color: 'var(--ink-2)' }}> {idcard.people}</span></div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>€</div>
                  <div className="mono" style={{ fontSize: 16, color: 'var(--ink)' }}>6M<span style={{ fontSize: 10, color: 'var(--ink-2)' }}> {idcard.work}</span></div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-1)' }}>
                  <span aria-hidden="true">📍</span> Sant Feliu de Llobregat, Barcelona
                </div>
                <Copyable value="+34 673 506 760" ariaLabel="Copiar teléfono">
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-1)' }}><span aria-hidden="true">☎</span> +34 673 506 760</span>
                </Copyable>
                <Copyable value="lucesproject@gmail.com" ariaLabel="Copiar email">
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-1)' }}><span aria-hidden="true">✉</span> lucesproject@gmail.com</span>
                </Copyable>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                {['EPA-SWMM','EPANET','Python','Power BI','ArcGIS','SCADA/IoT','Django','React','Three.js'].map(tag => <Tag key={tag}>{tag}</Tag>)}
              </div>
            </div>
            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
              <span className="mono" style={{ fontSize: 9.5, color: 'var(--ink-3)' }}>{idcard.issued}</span>
              <span className="mono" style={{ fontSize: 9.5, color: 'var(--accent)' }}>{idcard.active}</span>
            </div>
          </div>
        </div>

        <div>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--ink)', margin: '0 0 20px', maxWidth: 680 }}>
            <span aria-hidden="true" style={{ fontFamily: 'var(--f-serif)', fontSize: 48, float: 'left', lineHeight: 0.8, marginRight: 10, marginTop: 6, color: 'var(--accent)' }}>{t('about.bio1Lead')}</span>
            {interpolate(t('about.bio1'), { years: bold(t('about.bio1Years')) })}
          </p>
          <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--ink-1)', margin: '0 0 18px', maxWidth: 680 }}>
            {interpolate(t('about.bio2'), {
              ptar: bold(t('about.bio2Ptar')),
              uaesp: bold(t('about.bio2Uaesp')),
            })}
          </p>
          <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--ink-1)', margin: '0 0 40px', maxWidth: 680 }}>
            {interpolate(t('about.bio3'), { iotio: bold(t('about.bio3Iotio')) })}
          </p>

          <div className="label-accent" style={{ marginBottom: 20 }}>{t('about.skillsLabel')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
            <div>
              <SkillBar code="SK.01" name={skills.epanet} level={92} />
              <SkillBar code="SK.02" name={skills.python} level={82} />
              <SkillBar code="SK.03" name={skills.gis} level={80} />
              <SkillBar code="SK.04" name={skills.three} level={76} />
            </div>
            <div>
              <SkillBar code="SK.05" name={skills.ar} level={90} />
              <SkillBar code="SK.06" name={skills.scada} level={85} />
              <SkillBar code="SK.07" name={skills.obra} level={85} />
              <SkillBar code="SK.08" name={skills.hidraulico} level={94} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 80 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 24 }}>
          <div className="label-accent">{t('about.timeline.label')}</div>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{t('about.timeline.summary')}</span>
        </div>
        {(Array.isArray(rows) ? rows : []).map((r, i) => (
          <TimelineRow key={i} {...r} tags={TIMELINE_TAGS[i] || []} />
        ))}
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14, textAlign: 'right' }}>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{t('about.timeline.end')}</span>
        </div>
      </div>
    </section>
  );
}
