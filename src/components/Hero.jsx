import React, { useState, useEffect } from 'react';
import { useTick, jitter, StatusDot } from './primitives.jsx';
import { useT } from '../i18n.jsx';

function HydraulicSchematic() {
  const t = useTick(120);
  const tr = useT();
  const [flow, setFlow] = useState(0);
  useEffect(() => {
    let raf;
    const loop = () => {
      setFlow(f => (f + 0.6) % 40);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const caudal = (42.3 + jitter(0, 1.2, t)).toFixed(1);
  const presion = (3.24 + jitter(0, 0.04, t + 3)).toFixed(2);
  const turbidez = (0.8 + jitter(0, 0.12, t + 7)).toFixed(2);
  const ph = (7.21 + jitter(0, 0.05, t + 11)).toFixed(2);
  const L = tr('hero.schematicLabels');

  return (
    <div role="img" aria-label="Esquema hidráulico de PTAP con sensores en vivo" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg viewBox="0 0 800 440" width="100%" height="100%" style={{ display: 'block' }}
           preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <pattern id="dotpat" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.6" fill="var(--line-2)"/>
          </pattern>
          <linearGradient id="tankfill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.05"/>
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.25"/>
          </linearGradient>
        </defs>

        <rect x="0.5" y="0.5" width="799" height="439" fill="none" stroke="var(--line)"/>
        {[[0,0],[800,0],[0,440],[800,440]].map(([x,y],i) => (
          <g key={i} stroke="var(--line-hi)" strokeWidth="1">
            <line x1={x-6} y1={y} x2={x+6} y2={y}/>
            <line x1={x} y1={y-6} x2={x} y2={y+6}/>
          </g>
        ))}

        <g fontFamily="var(--f-mono)" fontSize="8" fill="var(--ink-3)">
          {[0,1,2,3,4,5,6,7,8].map(i => (
            <text key={'x'+i} x={i*100+4} y="12">{String(i*100).padStart(3,'0')}</text>
          ))}
          {[0,1,2,3,4].map(i => (
            <text key={'y'+i} x="4" y={i*100+20} transform={`rotate(-90 4 ${i*100+20})`}>{String(i*100).padStart(3,'0')}</text>
          ))}
        </g>

        <g transform="translate(80, 200)">
          <rect x="0" y="0" width="60" height="80" fill="none" stroke="var(--line-hi)" strokeWidth="1"/>
          <rect x="2" y="2" width="56" height="76" fill="url(#dotpat)"/>
          <rect x="2" y="36" width="56" height="42" fill="url(#tankfill)"/>
          <line x1="2" y1="36" x2="58" y2="36" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="2 2">
            <animate attributeName="y1" values="36;34;36" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="y2" values="36;34;36" dur="3s" repeatCount="indefinite"/>
          </line>
          <text x="30" y="-8" fontFamily="var(--f-mono)" fontSize="9" fill="var(--ink-1)" textAnchor="middle">{L.captacion}</text>
          <text x="30" y="95" fontFamily="var(--f-mono)" fontSize="8" fill="var(--ink-3)" textAnchor="middle">T-101</text>
        </g>

        <g transform="translate(180, 232)">
          <circle cx="16" cy="16" r="15" fill="var(--bg-2)" stroke="var(--line-hi)"/>
          <g transform={`rotate(${t * 6} 16 16)`}>
            <line x1="16" y1="4" x2="16" y2="28" stroke="var(--accent)" strokeWidth="1.5"/>
            <line x1="4" y1="16" x2="28" y2="16" stroke="var(--accent)" strokeWidth="1.5"/>
          </g>
          <text x="16" y="-6" fontFamily="var(--f-mono)" fontSize="9" fill="var(--ink-1)" textAnchor="middle">P-201</text>
        </g>

        <g transform="translate(260, 200)">
          <path d="M0,0 L70,0 L60,80 L10,80 Z" fill="var(--bg-2)" stroke="var(--line-hi)"/>
          <path d="M0,0 L70,0 L62,40 L8,40 Z" fill="var(--accent-soft)" stroke="none"/>
          <text x="35" y="-8" fontFamily="var(--f-mono)" fontSize="9" fill="var(--ink-1)" textAnchor="middle">{L.coagFloc}</text>
          <text x="35" y="95" fontFamily="var(--f-mono)" fontSize="8" fill="var(--ink-3)" textAnchor="middle">M-301</text>
        </g>

        <g transform="translate(370, 180)">
          <rect x="0" y="0" width="120" height="120" fill="var(--bg-2)" stroke="var(--line-hi)"/>
          <rect x="3" y="40" width="114" height="77" fill="var(--accent-soft)"/>
          {[0,1,2,3,4,5].map(i => (
            <line key={i} x1={10 + i*18} y1="50" x2={20 + i*18} y2="110" stroke="var(--accent-line)" strokeWidth="0.7"/>
          ))}
          <text x="60" y="-8" fontFamily="var(--f-mono)" fontSize="9" fill="var(--ink-1)" textAnchor="middle">{L.sedimentacion}</text>
          <text x="60" y="135" fontFamily="var(--f-mono)" fontSize="8" fill="var(--ink-3)" textAnchor="middle">{L.lamelar}</text>
        </g>

        <g transform="translate(520, 200)">
          <rect x="0" y="0" width="70" height="80" fill="var(--bg-2)" stroke="var(--line-hi)"/>
          <rect x="3" y="6" width="64" height="14" fill="var(--line-2)" opacity="0.6"/>
          <rect x="3" y="22" width="64" height="24" fill="var(--line-2)" opacity="0.4"/>
          <rect x="3" y="48" width="64" height="28" fill="var(--line-2)" opacity="0.25"/>
          <text x="35" y="-8" fontFamily="var(--f-mono)" fontSize="9" fill="var(--ink-1)" textAnchor="middle">{L.filtracion}</text>
          <text x="35" y="95" fontFamily="var(--f-mono)" fontSize="8" fill="var(--ink-3)" textAnchor="middle">F-501</text>
        </g>

        <g transform="translate(630, 200)">
          <circle cx="30" cy="40" r="28" fill="var(--bg-2)" stroke="var(--line-hi)"/>
          <circle cx="30" cy="40" r="20" fill="none" stroke="var(--accent-line)" strokeDasharray="2 3"/>
          <text x="30" y="44" fontFamily="var(--f-mono)" fontSize="10" fill="var(--accent)" textAnchor="middle">Cl₂</text>
          <text x="30" y="-8" fontFamily="var(--f-mono)" fontSize="9" fill="var(--ink-1)" textAnchor="middle">{L.desinfeccion}</text>
        </g>

        <g transform="translate(720, 210)">
          <rect x="0" y="0" width="40" height="60" fill="none" stroke="var(--line-hi)"/>
          <rect x="2" y="18" width="36" height="40" fill="url(#tankfill)"/>
          <text x="20" y="-8" fontFamily="var(--f-mono)" fontSize="9" fill="var(--ink-1)" textAnchor="middle">{L.reserva}</text>
          <text x="20" y="75" fontFamily="var(--f-mono)" fontSize="8" fill="var(--ink-3)" textAnchor="middle">R-601</text>
        </g>

        <g fill="none" stroke="var(--accent)" strokeWidth="1.3" opacity="0.7">
          <line x1="140" y1="240" x2="180" y2="248"/>
          <line x1="212" y1="248" x2="260" y2="240"/>
          <line x1="320" y1="240" x2="370" y2="240"/>
          <line x1="490" y1="240" x2="520" y2="240"/>
          <line x1="590" y1="240" x2="630" y2="240"/>
          <line x1="660" y1="240" x2="720" y2="240"/>
        </g>
        <g fill="var(--accent)">
          {[0,1,2,3,4,5,6,7,8,9].map(i => {
            const x = 140 + ((flow + i * 60) % 600);
            return <circle key={i} cx={x} cy="240" r="1.6" opacity="0.9"/>;
          })}
        </g>

        <g fontFamily="var(--f-mono)" fontSize="9">
          <g>
            <line x1="210" y1="248" x2="210" y2="330" stroke="var(--accent-line)" strokeDasharray="2 2"/>
            <rect x="168" y="332" width="84" height="38" fill="var(--bg-1)" stroke="var(--accent-line)"/>
            <text x="174" y="344" fill="var(--accent)" fontSize="8">FIT-01 · {L.sensors.caudal}</text>
            <text x="174" y="362" fill="var(--ink)" fontSize="13">{caudal} <tspan fill="var(--ink-3)" fontSize="8">L/s</tspan></text>
          </g>
          <g>
            <line x1="435" y1="180" x2="435" y2="110" stroke="var(--accent-line)" strokeDasharray="2 2"/>
            <rect x="393" y="72" width="84" height="38" fill="var(--bg-1)" stroke="var(--accent-line)"/>
            <text x="399" y="84" fill="var(--accent)" fontSize="8">PIT-02 · {L.sensors.presion}</text>
            <text x="399" y="102" fill="var(--ink)" fontSize="13">{presion} <tspan fill="var(--ink-3)" fontSize="8">bar</tspan></text>
          </g>
          <g>
            <line x1="555" y1="280" x2="555" y2="350" stroke="var(--accent-line)" strokeDasharray="2 2"/>
            <rect x="513" y="352" width="84" height="38" fill="var(--bg-1)" stroke="var(--accent-line)"/>
            <text x="519" y="364" fill="var(--accent)" fontSize="8">TIT-03 · {L.sensors.turb}</text>
            <text x="519" y="382" fill="var(--ink)" fontSize="13">{turbidez} <tspan fill="var(--ink-3)" fontSize="8">NTU</tspan></text>
          </g>
          <g>
            <line x1="660" y1="220" x2="660" y2="110" stroke="var(--accent-line)" strokeDasharray="2 2"/>
            <rect x="618" y="72" width="84" height="38" fill="var(--bg-1)" stroke="var(--accent-line)"/>
            <text x="624" y="84" fill="var(--accent)" fontSize="8">AIT-04 · {L.sensors.ph}</text>
            <text x="624" y="102" fill="var(--ink)" fontSize="13">{ph} <tspan fill="var(--ink-3)" fontSize="8">—</tspan></text>
          </g>
        </g>

        <g transform="translate(20, 415)" stroke="var(--ink-3)" fontFamily="var(--f-mono)" fontSize="8" fill="var(--ink-3)">
          <line x1="0" y1="0" x2="80" y2="0"/>
          <line x1="0" y1="-3" x2="0" y2="3"/>
          <line x1="40" y1="-2" x2="40" y2="2"/>
          <line x1="80" y1="-3" x2="80" y2="3"/>
          <text x="0" y="14">0m</text>
          <text x="70" y="14">20m</text>
        </g>

        <g transform="translate(610, 20)">
          <rect x="0" y="0" width="170" height="24" fill="var(--bg-1)" stroke="var(--line-hi)"/>
          <circle cx="10" cy="12" r="3" fill="var(--accent)">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite"/>
          </circle>
          <text x="20" y="16" fontFamily="var(--f-mono)" fontSize="9" fill="var(--ink-1)">{L.liveBadge}</text>
        </g>
      </svg>
    </div>
  );
}

function HeroSchematic() {
  const t = useT();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)', gap: 48, alignItems: 'center', minHeight: 'calc(100vh - 76px)', padding: '64px 0 48px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <span className="label-accent">{t('hero.kicker')}</span>
          <div style={{ flex: 1, height: 1, background: 'var(--accent-line)' }}/>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{t('hero.rev')}</span>
        </div>
        <div className="label" style={{ marginBottom: 24 }}>{t('hero.subtitle')}</div>
        <h1 style={{
          fontFamily: 'var(--f-mono)',
          fontSize: 'clamp(40px, 5.2vw, 74px)',
          lineHeight: 1.02,
          letterSpacing: '-0.03em',
          fontWeight: 500,
          margin: '0 0 28px',
        }}>
          Giovanni X.<br/>
          <span style={{ color: 'var(--accent)' }}>Guevara Duque</span><br/>
          <span style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontWeight: 400 }}>{t('hero.role')}</span>
        </h1>
        <p style={{ maxWidth: 520, color: 'var(--ink-1)', fontSize: 15, lineHeight: 1.6, marginBottom: 36 }}>
          {t('hero.intro')}
        </p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 48 }}>
          <a href="#proyectos" className="btn primary">{t('hero.ctaProjects')}</a>
          <a href="#contacto" className="btn">{t('hero.ctaContact')}</a>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
          padding: '18px 0',
        }}>
          {[
            { v: '42+', l: t('hero.statsPlants') },
            { v: '150k', l: t('hero.statsPeople') },
            { v: '€6M', l: t('hero.statsWork') },
            { v: 'C1 / C1', l: t('hero.statsLangs') },
          ].map((s, i) => (
            <div key={i} style={{ borderLeft: i > 0 ? '1px solid var(--line)' : 'none', paddingLeft: i > 0 ? 20 : 0 }}>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{s.v}</div>
              <div className="label" style={{ marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', minHeight: 500, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: 'var(--f-mono)', fontSize: 10.5, color: 'var(--ink-3)',
          letterSpacing: '0.08em',
        }}>
          <span>{t('hero.fig')}</span>
          <StatusDot label={t('hero.streaming')} />
        </div>
        <div style={{
          border: '1px solid var(--line-hi)',
          background: 'linear-gradient(180deg, var(--bg-1) 0%, var(--bg-2) 100%)',
          padding: 14,
          aspectRatio: '800/440',
          width: '100%',
        }}>
          <HydraulicSchematic />
        </div>
        <div style={{ position: 'relative', border: '1px solid var(--line-hi)', overflow: 'hidden', aspectRatio: '3/1.4' }}>
          <img src="/assets/giovanni-field.jpg" alt="Giovanni Guevara Duque en obra de saneamiento del Sistema MP/PER1"
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(0.9) contrast(1.05)' }}/>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 40%, rgba(6,9,12,0.55) 100%)', pointerEvents: 'none' }}/>
          {[[6,6],[null,6],[6,null],[null,null]].map(([l,top],i) => (
            <div key={i} aria-hidden="true" style={{
              position: 'absolute', width: 10, height: 10,
              left: l !== null ? l : undefined, right: l === null ? 6 : undefined,
              top: top !== null ? top : undefined, bottom: top === null ? 6 : undefined,
              borderColor: 'var(--accent)', borderStyle: 'solid',
              borderWidth: `${top !== null ? 1.5 : 0}px ${l === null ? 1.5 : 0}px ${top === null ? 1.5 : 0}px ${l !== null ? 1.5 : 0}px`,
            }}/>
          ))}
          <div style={{
            position: 'absolute', left: 12, right: 12, bottom: 10,
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.1em',
            color: '#fff',
          }}>
            <span>{t('hero.fieldCaption')}</span>
            <span style={{ color: 'var(--accent)' }}>{t('hero.liveSite')}</span>
          </div>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: 'var(--f-mono)', fontSize: 10.5, color: 'var(--ink-3)',
        }}>
          <span>{t('hero.coords')}</span>
          <span>{t('hero.scale')}</span>
        </div>
      </div>
    </div>
  );
}

function HeroTypographic() {
  const t = useT();
  const tick = useTick(1000);
  return (
    <div style={{ minHeight: 'calc(100vh - 76px)', padding: '64px 0 48px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 32 }}>
        <span className="label-accent">{t('hero.typo.kicker')}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
          PAYLOAD: {String(42 + (tick % 3)).padStart(3, '0')} KB · LATENCY 18ms
        </span>
      </div>

      <h1 style={{
        fontFamily: 'var(--f-mono)',
        fontSize: 'clamp(52px, 9vw, 140px)',
        lineHeight: 0.92,
        letterSpacing: '-0.045em',
        fontWeight: 500,
        margin: '24px 0 40px',
      }}>
        <span style={{ display: 'block' }}>
          <span className="mono" style={{ fontSize: '0.22em', color: 'var(--ink-3)', verticalAlign: 'super', marginRight: 12 }}>01</span>
          {t('hero.typo.line1')}
        </span>
        <span style={{ display: 'block', color: 'var(--ink-2)' }}>
          <span className="mono" style={{ fontSize: '0.22em', color: 'var(--ink-3)', verticalAlign: 'super', marginRight: 12 }}>02</span>
          {t('hero.typo.line2')}
        </span>
        <span style={{ display: 'block' }}>
          <span className="mono" style={{ fontSize: '0.22em', color: 'var(--ink-3)', verticalAlign: 'super', marginRight: 12 }}>03</span>
          <span style={{ color: 'var(--accent)' }}>{t('hero.typo.line3a')}</span>
          <span style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic' }}>{t('hero.typo.line3b')}</span>
        </span>
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 48, marginTop: 56, borderTop: '1px solid var(--line)', paddingTop: 32 }}>
        <p style={{ color: 'var(--ink-1)', fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{t('hero.typo.bio')}</p>
        <div>
          <div className="label">{t('hero.typo.specialties')}</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--ink-1)', lineHeight: 1.8 }}>
            <li>→ EPA-SWMM · EPANET · WaterGEMS</li>
            <li>→ IoT · SCADA · Django · React</li>
            <li>→ Three.js · 3D Twins</li>
          </ul>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
          <a href="#proyectos" className="btn primary">{t('hero.typo.ctaExplore')}</a>
          <a href="#contacto" className="btn">{t('hero.ctaContact')}</a>
        </div>
      </div>
    </div>
  );
}

function HeroTerminal() {
  const t = useT();
  const tick = useTick(200);
  const lines = [
    { c: 'var(--ink-3)', s: '$ giova_water --profile giovanni --fetch resume' },
    { c: 'var(--accent)', s: '✓ authenticated · session 0x4f a8 e1 c3' },
    { c: 'var(--ink-1)', s: 'loading identity......................... [OK]' },
    { c: 'var(--ink-1)', s: 'loading projects [42].................... [OK]' },
    { c: 'var(--ink-1)', s: 'loading digital_twins [3 ONLINE]......... [OK]' },
    { c: 'var(--ink-3)', s: '' },
    { c: 'var(--ink-3)', s: '# IDENTITY' },
    { c: 'var(--ink)', s: 'name      : Giovanni X. Guevara Duque' },
    { c: 'var(--ink)', s: 'role      : Ingeniero de Procesos · Agua & IoT' },
    { c: 'var(--ink)', s: 'based     : Sant Feliu de Llobregat, ES ⇄ Cali, CO' },
    { c: 'var(--ink)', s: 'stack     : EPANET · Django · React · Three.js' },
    { c: 'var(--ink-3)', s: '' },
    { c: 'var(--ink-3)', s: '# HIGHLIGHT' },
    { c: 'var(--ink-1)', s: '→ PTAR Cali   60 000 PE   €6M obra pública' },
    { c: 'var(--ink-1)', s: '→ UAESP       37 PTAPs    rural deployment' },
    { c: 'var(--ink-1)', s: '→ La Vorágine digital twin · SCADA · Three.js' },
    { c: 'var(--ink-3)', s: '' },
    { c: 'var(--accent)', s: '> ready. type \'proyectos\' to continue _' },
  ];
  return (
    <div style={{ minHeight: 'calc(100vh - 76px)', padding: '48px 0', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)', gap: 48, alignItems: 'center' }}>
      <div>
        <div className="label-accent" style={{ marginBottom: 20 }}>{t('hero.terminal.kicker')}</div>
        <h1 style={{
          fontFamily: 'var(--f-mono)',
          fontSize: 'clamp(44px, 6vw, 84px)',
          lineHeight: 1.0, letterSpacing: '-0.035em', fontWeight: 500,
          margin: '0 0 32px',
        }}>
          {t('hero.terminal.line1')}<br/>
          {t('hero.terminal.line2')}<br/>
          <span style={{ color: 'var(--accent)' }}>{t('hero.terminal.line3a')}</span> <br/>
          <span style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic' }}>{t('hero.terminal.line3b')}</span>
        </h1>
        <p style={{ color: 'var(--ink-1)', fontSize: 15, lineHeight: 1.6, maxWidth: 480, marginBottom: 36 }}>{t('hero.terminal.bio')}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <a href="#proyectos" className="btn primary">{t('hero.ctaProjects')}</a>
          <a href="#contacto" className="btn">{t('hero.ctaContact')}</a>
        </div>
      </div>
      <div role="img" aria-label="Vista de terminal con perfil técnico de Giovanni" style={{
        border: '1px solid var(--line-hi)',
        background: 'var(--bg-1)',
        padding: 0,
        fontFamily: 'var(--f-mono)',
        fontSize: 12,
        lineHeight: 1.7,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--line)', color: 'var(--ink-3)', fontSize: 10.5 }}>
          <span>● ● ●  guevara@giova_water ~ % whoami</span>
          <span>tmux:0</span>
        </div>
        <div style={{ padding: '20px 22px', minHeight: 420 }}>
          {lines.map((l, i) => (
            <div key={i} style={{ color: l.c, whiteSpace: 'pre', minHeight: 20 }}>
              {l.s}{i === lines.length - 1 && tick % 2 ? '█' : ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Hero({ variant }) {
  if (variant === 'typographic') return <HeroTypographic />;
  if (variant === 'terminal') return <HeroTerminal />;
  return <HeroSchematic />;
}
