import { useEffect, useMemo, useState } from 'react';
import { MATERIAL_IDS, getMaterial } from '@eo/material-library';
import { PROFILES, type ClarifierDesign, type ClarifierVariant, type DesignInput, type ResizeGroup, type VariantMode } from '@eo/equipment-library';

type FieldKind = 'number' | 'optional-number' | 'select' | 'text';
interface Field {
  path: string;
  label: string;
  unit?: string;
  kind: FieldKind;
  step?: number;
  options?: { value: string; label: string }[];
}

const materialOptions = (family?: string) =>
  MATERIAL_IDS.filter((id) => !family || getMaterial(id).family.includes(family)).map((id) => ({ value: id, label: id }));

const GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: 'Caudal',
    fields: [
      { path: 'flow.averageLps', label: 'Caudal medio Qmed', unit: 'L/s', kind: 'number', step: 0.5 },
      { path: 'flow.peak.factor', label: 'Factor de punta Fp', unit: '—', kind: 'number', step: 0.1 },
    ],
  },
  {
    title: 'Criterios hidráulicos',
    fields: [
      { path: 'profileId', label: 'Perfil de diseño', kind: 'select', options: Object.values(PROFILES).map((p) => ({ value: p.id, label: p.name })) },
      { path: 'designCriteria.surfaceLoadingAvgM_h', label: 'CHS admisible (media)', unit: 'm/h', kind: 'number', step: 0.05 },
      { path: 'designCriteria.surfaceLoadingPeakM_h', label: 'CHS admisible (punta)', unit: 'm/h', kind: 'optional-number', step: 0.1 },
      { path: 'designCriteria.hrtTargetMinH', label: 'TRH mínimo objetivo', unit: 'h', kind: 'optional-number', step: 0.1 },
      { path: 'designCriteria.weirLoadingMaxM3_md', label: 'CLV máxima', unit: 'm³/(m·d)', kind: 'optional-number', step: 10 },
    ],
  },
  {
    title: 'Geometría',
    fields: [
      { path: 'geometry.sideWaterDepthM', label: 'Profundidad útil H', unit: 'm', kind: 'number', step: 0.1 },
      { path: 'geometry.diameterRoundingStepM', label: 'Paso de redondeo de D', unit: 'm', kind: 'number', step: 0.05 },
      { path: 'geometry.floorSlope', label: 'Pendiente del fondo', unit: 'm/m', kind: 'number', step: 0.005 },
      { path: 'geometry.sumpDiameterM', label: 'Diámetro de poceta', unit: 'm', kind: 'number', step: 0.05 },
      { path: 'geometry.sumpDepthM', label: 'Profundidad de poceta', unit: 'm', kind: 'number', step: 0.05 },
      { path: 'geometry.freeboardM', label: 'Resguardo', unit: 'm', kind: 'number', step: 0.05 },
    ],
  },
  {
    title: 'Obra civil (espesores no verificados)',
    fields: [
      { path: 'civil.wallThicknessM', label: 'Espesor de muro', unit: 'm', kind: 'number', step: 0.05 },
      { path: 'civil.baseSlabThicknessM', label: 'Espesor de losa', unit: 'm', kind: 'number', step: 0.05 },
      { path: 'civil.launderWidthM', label: 'Ancho de canal', unit: 'm', kind: 'number', step: 0.05 },
      { path: 'civil.launderDepthM', label: 'Profundidad de canal', unit: 'm', kind: 'number', step: 0.05 },
      { path: 'civil.concrete', label: 'Hormigón', kind: 'select', options: materialOptions('concrete') },
    ],
  },
  {
    title: 'Hidráulica de componentes',
    fields: [
      { path: 'hydraulics.feedwellDiameterRatio', label: 'Dpozo / D', unit: '—', kind: 'number', step: 0.01 },
      { path: 'hydraulics.feedwellDepthM', label: 'Profundidad del pozo', unit: 'm', kind: 'number', step: 0.1 },
      { path: 'hydraulics.notchSpacingM', label: 'Paso de escotaduras', unit: 'm', kind: 'number', step: 0.05 },
      { path: 'hydraulics.sludgePipeMinDn', label: 'DN mínimo de lodos', unit: 'mm', kind: 'number', step: 50 },
    ],
  },
  {
    title: 'Mecánica',
    fields: [
      {
        path: 'mechanical.bridgeType',
        label: 'Tipo de puente',
        kind: 'select',
        options: [
          { value: 'full-span', label: 'Vano completo' },
          { value: 'radial', label: 'Radial' },
        ],
      },
      {
        path: 'mechanical.armCount',
        label: 'Número de brazos',
        kind: 'select',
        options: [
          { value: '2', label: '2' },
          { value: '4', label: '4' },
        ],
      },
      { path: 'mechanical.bladeFloorClearanceM', label: 'Holgura paleta–fondo', unit: 'm', kind: 'number', step: 0.005 },
      { path: 'mechanical.materials.submerged', label: 'Material sumergido', kind: 'select', options: materialOptions('steel') },
    ],
  },
];

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

const valuesOf = (input: DesignInput): Record<string, string> => {
  const out: Record<string, string> = { tag: '' };
  for (const g of GROUPS) for (const f of g.fields) {
    const v = get(input, f.path);
    out[f.path] = v === undefined ? '' : String(v);
  }
  return out;
};

const RESIZE: { id: ResizeGroup; label: string }[] = [
  { id: 'tank', label: 'Tanque (D, H)' },
  { id: 'inlet', label: 'Entrada y ventanas' },
  { id: 'feedwell', label: 'Pozo de alimentación' },
  { id: 'weir', label: 'Vertedero' },
  { id: 'effluent', label: 'Colector de efluente' },
  { id: 'sludge', label: 'Conducción de lodos' },
];

export interface ParametersPanelProps {
  variant: ClarifierVariant;
  design: ClarifierDesign;
  onDerive: (changes: Record<string, unknown>, mode: Exclude<VariantMode, 'BASE'>, allowed: ResizeGroup[]) => void;
  /** Caso de prueba del spec: variante en modo A a partir de la configuración base. */
  onQuick: (lps: number, tag: string) => void;
  baseTag: string;
  selectedComponent: string | null;
  onSelectComponent: (id: string | null) => void;
  isolated: string[] | null;
  onIsolate: (ids: string[] | null) => void;
}

export function ParametersPanel({ variant, design, onDerive, onQuick, baseTag, selectedComponent, onSelectComponent, isolated, onIsolate }: ParametersPanelProps) {
  const initial = useMemo(() => valuesOf(variant.designInputs), [variant]);
  const [values, setValues] = useState(initial);
  const [mode, setMode] = useState<Exclude<VariantMode, 'BASE'>>('A');
  const [allowed, setAllowed] = useState<ResizeGroup[]>(['inlet', 'effluent']);
  useEffect(() => setValues(initial), [initial]);

  const isFactor = variant.designInputs.flow.peak.method === 'factor';
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
          <button onClick={() => onQuick(10, 'DEC-010')}>→ 10 L/s</button>
          <button onClick={() => onQuick(3, 'DEC-003')}>→ 3 L/s</button>
        </div>
        <p className="muted small">Caso de prueba §6.2: variantes en modo A a partir de <code>{baseTag}</code>.</p>
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
