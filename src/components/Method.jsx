import React from 'react';

/* Work method in four stages. Each stage has a one-line summary; the detail of
   what it includes opens in a native <details> (keyboard and screen-reader
   friendly, no scripting). Contracting and award decisions are not part of the
   method: the note says so. */
export default function Method({ method }) {
  const stages = Array.isArray(method.stages) ? method.stages : [];
  return (
    <div>
      <h3 className="label-accent" style={{ margin: '0 0 8px', fontWeight: 400 }}>{method.label}</h3>
      <p style={{ margin: '0 0 20px', fontFamily: 'var(--f-mono)', fontSize: 'clamp(20px, 2.2vw, 28px)', color: 'var(--ink)', maxWidth: 680, letterSpacing: '-0.02em', textWrap: 'balance' }}>{method.title}</p>
      <ol className="method-grid" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {stages.map((s, i) => (
          <li key={i} className="method-stage">
            <div className="mono" style={{ fontSize: 13, color: 'var(--accent)' }}>{String(i + 1).padStart(2, '0')} / {String(stages.length).padStart(2, '0')}</div>
            <h4 style={{ margin: 0, fontFamily: 'var(--f-mono)', fontSize: 17, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.3 }}>{s.t}</h4>
            <p className="prose" style={{ margin: 0, flex: 1 }}>{s.d}</p>
            <details>
              <summary>{method.more}</summary>
              <ul>
                {(Array.isArray(s.steps) ? s.steps : []).map((step, k) => <li key={k} style={{ margin: '0 0 6px', fontSize: 15, lineHeight: 1.55 }}><strong style={{ fontWeight: 500, color: 'var(--ink)' }}>{step.t}.</strong> {step.d}</li>)}
              </ul>
            </details>
          </li>
        ))}
      </ol>
      <p className="prose" style={{ margin: '16px 0 0', maxWidth: 680, fontSize: 15, color: 'var(--ink-2)' }}>{method.note}</p>
    </div>
  );
}
