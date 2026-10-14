import React from 'react';
import { ANCHORS, TAGS, UNITS, N, cueAt, progress } from '../lib/scadaCues.js';
import { projectById, projectHash } from '../data/projects.js';

const pad = (n) => String(n).padStart(2, '0');

/* Callouts over the SCADA clip, one per supervised variable, and a closing card
   that links to the UAESP project. It shows no readings: names, what each one
   is for and a generic instrument tag. `t` is the clip's own current time. */
export default function ScadaOverlay({ t, playing, labels, announce = false }) {
  const cue = cueAt(t);
  const fills = progress(t);
  // Paused or not started: the current callout stays fully visible and still.
  const fade = playing ? cue.fade : 1;
  const names = Array.isArray(labels.vars) ? labels.vars : [];
  const descs = Array.isArray(labels.desc) ? labels.desc : [];
  const closing = cue.index === -1;
  const i = closing ? 0 : cue.index;
  const [ax, ay] = ANCHORS[i];
  const unit = UNITS[i];
  const motion = { opacity: fade, transform: `translateY(${(1 - fade) * 12}px)` };
  const slug = projectById('P-007');

  return (
    <div className="scada-overlay">
      <span className="scada-veil" aria-hidden="true" />
      <span className="scada-progress" aria-hidden="true">
        {fills.map((f, k) => <i key={k}><b style={{ transform: `scaleX(${f})` }} /></i>)}
      </span>
      <span className="chip accent scada-rec">
        <span className="blink" aria-hidden="true">●</span> {labels.rec}
      </span>

      {!closing && (
        <>
          <span className="scada-anchor" aria-hidden="true" style={{ left: `${ax}%`, top: `${ay}%`, opacity: fade }}>
            <i />
          </span>
          <svg className="scada-guide" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={{ opacity: fade }}>
            <polyline points={`${ax},${ay} ${ax},44 10,44 10,48`} fill="none" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="scada-callout" style={motion}
               {...(announce ? { role: 'status', 'aria-live': 'polite' } : {})}>
            <span className="scada-callout-head">
              <span className="scada-tag">{TAGS[i]}</span>
              <span className="scada-count">{pad(i + 1)} / {pad(N)}</span>
            </span>
            <strong className="scada-name">{names[i]}</strong>
            <span className="scada-desc">{descs[i]}</span>
            <span className="scada-foot">
              <span><span aria-hidden="true">● </span>{labels.online}</span>
              {unit && <span>{labels.unit}: {unit}</span>}
            </span>
          </div>
        </>
      )}

      {closing && (
        <div className="scada-end" style={{ opacity: fade }}>
          <p className="scada-end-kicker">{labels.end.kicker}</p>
          <p className="scada-end-title">{labels.end.title}</p>
          <p className="scada-end-sub">{labels.end.sub}</p>
          <ul className="scada-end-vars">{names.map((n) => <li key={n}>{n}</li>)}</ul>
          <a className="btn primary" href={projectHash(slug)}>{labels.end.cta}</a>
        </div>
      )}

      <span className="chip scada-note">{labels.labelsNote}</span>
    </div>
  );
}
