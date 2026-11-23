import { useEffect, useMemo, useState } from 'react';
import type { ResizeGroup, VariantMode } from '@eo/equipment-library';
import type { FieldGroup, LabVariant } from '../equipment';

const get = (o: unknown, path: string): unknown => path.split('.').reduce<unknown>((a, k) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[k] : undefined), o);

function setDeep(o: Record<string, unknown>, path: string, v: unknown) {
  const ks = path.split('.');
  let cur = o;
  ks.slice(0, -1).forEach((k) => {
    cur[k] = (cur[k] as Record<string, unknown>) ?? {};
    cur = cur[k] as Record<string, unknown>;
  });
  cur[ks[ks.length - 1]!] = v;
}

const valuesOf = (input: unknown, groups: FieldGroup[]): Record<string, string> => {
  const out: Record<string, string> = { tag: '' };
  for (const g of groups) for (const f of g.fields) {
    const v = get(input, f.path);
    out[f.path] = v === undefined ? '' : String(v);
  }
  return out;
};

const RESIZE_LABELS: Record<ResizeGroup, string> = {
  tank: 'Tanque (D, H)',
  inlet: 'Entrada y ventanas',
  feedwell: 'Zona central (pozo o cámara)',
  weir: 'Vertedero',
  effluent: 'Colector de efluente',
  sludge: 'Conducción de lodos',
  mechanical: 'Mecánica (puente, brazos, barredor)',
  flocculator: 'Agitador de floculación',
};

export interface ParametersPanelProps {
  variant: LabVariant;
  design: { components: readonly { id: string; name: string }[] };
  groups: FieldGroup[];
  resizeGroups: readonly ResizeGroup[];
  quick: readonly { lps: number; tag: string }[];
  onDerive: (changes: Record<string, unknown>, mode: Exclude<VariantMode, 'BASE'>, allowed: ResizeGroup[]) => void;
  /** Caso de prueba del spec: variante en modo A a partir de la configuración base. */
  onQuick: (lps: number, tag: string) => void;
  baseTag: string;
  selectedComponent: string | null;
  onSelectComponent: (id: string | null) => void;
  isolated: string[] | null;
  onIsolate: (ids: string[] | null) => void;
}

export function ParametersPanel({ variant, design, groups, resizeGroups, quick, onDerive, onQuick, baseTag, selectedComponent, onSelectComponent, isolated, onIsolate }: ParametersPanelProps) {
  const GROUPS = groups;
  const RESIZE = resizeGroups.map((id) => ({ id, label: RESIZE_LABELS[id] }));
  const initial = useMemo(() => valuesOf(variant.designInputs, groups), [variant, groups]);
  const [values, setValues] = useState(initial);
  const [mode, setMode] = useState<Exclude<VariantMode, 'BASE'>>('A');
  const [allowed, setAllowed] = useState<ResizeGroup[]>(['inlet', 'effluent']);
  useEffect(() => setValues(initial), [initial]);

  const isFactor = (get(variant.designInputs, 'flow.peak.method') as string | undefined) === 'factor';
  const changes = useMemo(() => {
    const ch: Record<string, unknown> = {};
    for (const g of GROUPS) for (const f of g.fields) {
      if (f.path === 'flow.peak.factor' && !isFactor) continue;
      const raw = values[f.path] ?? '';
      if (raw === initial[f.path]) continue;
      let v: unknown = raw;
      if (f.kind === 'number' || f.kind === 'optional-number') v = raw.trim() === '' ? (f.kind === 'optional-number' ? null : undefined) : Number(raw);
      if (f.path === 'mechanical.armCount') v = Number(raw);
      if (v === undefined) continue;
      if (f.path === 'flow.peak.factor') ch.flow = { ...(ch.flow as object), peak: { method: 'factor', factor: v } };
      else setDeep(ch, f.path, v);
    }
    return ch;
  }, [values, initial, isFactor]);
  const nChanges = JSON.stringify(changes).match(/:/g)?.length ?? 0;

  const submit = () => {
    const ch: Record<string, unknown> = { ...changes };
    ch.tag = values.tag?.trim() || `${variant.tag}-${mode}${variants_suffix()}`;
    onDerive(ch, mode, allowed);
  };

  return (
    <div className="panel-scroll">
      <section className="card">
        <h3>Variante base</h3>
        <p className="muted small">
          Los cambios generan una <b>nueva variante</b> a partir de <code>{variant.tag}</code>. El original no se modifica.
        </p>
        <div className="quick">
          {quick.map((q) => (
            <button key={q.tag} onClick={() => onQuick(q.lps, q.tag)}>
              → {q.lps} L/s
            </button>
          ))}
        </div>
        <p className="muted small">Variantes en modo A a partir de <code>{baseTag}</code> (en el decantador, el caso de prueba §6.2).</p>
      </section>

      {GROUPS.map((g) => (
        <details key={g.title} className="card" open={g.title === 'Caudal' || g.title === 'Criterios hidráulicos'}>
          <summary>{g.title}</summary>
          {g.fields.map((f) => {
            if (f.path === 'flow.peak.factor' && !isFactor) return null;
            const changed = (values[f.path] ?? '') !== initial[f.path];
            return (
              <label key={f.path} className={`field ${changed ? 'changed' : ''}`}>
                <span>{f.label}</span>
                {f.kind === 'select' ? (
                  <select value={values[f.path]} onChange={(e) => setValues({ ...values, [f.path]: e.target.value })}>
                    {f.options!.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    step={f.step}
                    placeholder={f.kind === 'optional-number' ? 'sin criterio' : ''}
                    value={values[f.path]}
                    onChange={(e) => setValues({ ...values, [f.path]: e.target.value })}
                  />
                )}
                <em>{f.unit ?? ''}</em>
              </label>
            );
          })}
        </details>
      ))}

      <section className="card">
        <h3>Redimensionamiento</h3>
        <div className="modes">
          {(
            [
              ['A', 'A · Nuevo diseño'],
              ['B', 'B · Evaluar existente'],
              ['C', 'C · Modificación restringida'],
            ] as const
          ).map(([m, l]) => (
            <label key={m} className="radio">
              <input type="radio" checked={mode === m} onChange={() => setMode(m)} /> {l}
            </label>
          ))}
        </div>
        {mode === 'B' && <p className="muted small">La geometría queda fija; solo cambian caudal, calidad y criterios.</p>}
        {mode === 'C' && (
          <div className="groups">
            <p className="muted small">Grupos que se pueden redimensionar:</p>
            {RESIZE.map((r) => (
              <label key={r.id} className="check">
                <input type="checkbox" checked={allowed.includes(r.id)} onChange={(e) => setAllowed(e.target.checked ? [...allowed, r.id] : allowed.filter((x) => x !== r.id))} /> {r.label}
              </label>
            ))}
          </div>
        )}
        <label className="field">
          <span>Etiqueta</span>
          <input type="text" placeholder="automática" value={values.tag} onChange={(e) => setValues({ ...values, tag: e.target.value })} />
          <em />
        </label>
        <button className="primary" disabled={nChanges === 0} onClick={() => submit()}>
          Generar variante ({nChanges} cambio{nChanges === 1 ? '' : 's'})
        </button>
      </section>

      <section className="card">
        <h3>Componentes</h3>
        <ul className="components">
          {design.components.map((c) => (
            <li key={c.id} className={selectedComponent === c.id ? 'sel' : ''}>
              <button className="link" onClick={() => onSelectComponent(selectedComponent === c.id ? null : c.id)}>
                <code>{c.id}</code> {c.name}
              </button>
              <button className={`iso ${isolated?.length === 1 && isolated[0] === c.id ? 'on' : ''}`} title="Aislar" onClick={() => onIsolate(isolated?.length === 1 && isolated[0] === c.id ? null : [c.id])}>
                ◎
              </button>
            </li>
          ))}
        </ul>
        {isolated && (
          <button className="small-btn" onClick={() => onIsolate(null)}>
            Mostrar todos
          </button>
        )}
      </section>
    </div>
  );
}

let counter = 0;
function variants_suffix() {
  counter += 1;
  return `-${counter}`;
}
