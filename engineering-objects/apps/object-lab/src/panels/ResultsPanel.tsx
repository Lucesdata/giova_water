import { useMemo, useState } from 'react';
import { LEVEL_NAMES, type CheckStatus, type ValidationLevel } from '@eo/engineering-core';
import { compareVariantValues, exportVariantOf, renderReport } from '@eo/equipment-library';
import type { AnyDesign, LabEquipment, LabVariant } from '../equipment';
import { download, fmt, unit } from '../format';

type Tab = 'dims' | 'hyd' | 'meas' | 'val' | 'cmp';

const STATUS_CLASS: Record<CheckStatus, string> = { PASS: 'ok', WARNING: 'warn', FAIL: 'fail', NOT_EVALUATED: 'ne' };

type LabDesign = AnyDesign;

export function ResultsPanel({
  equipment,
  variant,
  design,
  variants,
  compareIds,
  onToggleCompare,
  onSelectComponent,
  onImport,
}: {
  equipment: LabEquipment;
  variant: LabVariant;
  design: LabDesign;
  variants: LabVariant[];
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  onSelectComponent: (id: string) => void;
  onImport: (json: string) => void;
}) {
  const [tab, setTab] = useState<Tab>('dims');
  const [statusFilter, setStatusFilter] = useState<CheckStatus | 'ALL'>('ALL');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const s = design.summary;

  const cmpVariants = useMemo(() => variants.filter((v) => compareIds.includes(v.variantId)), [variants, compareIds]);
  const rows = useMemo(() => compareVariantValues(cmpVariants, equipment.comparisonKeys), [cmpVariants, equipment]);

  const valueTable = (keys: string[]) => (
    <table className="vals">
      <tbody>
        {keys.map((k) => {
          const v = design.values[k];
          if (!v) return null;
          return [
            <tr key={k} className={openKey === k ? 'open' : ''} onClick={() => setOpenKey(openKey === k ? null : k)}>
              <td>{v.label}</td>
              <td className="num">{fmt(v.value)}</td>
              <td className="u">{unit(v.unit)}</td>
              <td className={`origin o-${v.origin}`}>{v.origin === 'CALCULATED' ? 'calc' : v.origin === 'ADOPTED' ? 'adopt' : v.origin === 'INPUT' ? 'dato' : 'fijo'}</td>
            </tr>,
            openKey === k && (
              <tr key={`${k}-trace`} className="trace">
                <td colSpan={4}>
                  <code>{v.equation}</code>
                  <div className="muted small">
                    depende de: {v.inputs.join(', ') || '—'} · {v.methodVersion}
                  </div>
                  {v.warnings.map((w) => (
                    <div key={w} className="warn small">
                      ⚠ {w}
                    </div>
                  ))}
                </td>
              </tr>
            ),
          ];
        })}
      </tbody>
    </table>
  );

  return (
    <div className="panel-scroll">
      <section className={`status-banner st-${s.status}`}>
        <div>
          <b>{variant.tag}</b> <span className="muted">· modo {variant.mode}</span>
        </div>
        <div className="status">{s.status}</div>
        <div className="counts">
          <span className="ok">{s.counts.PASS} PASS</span>
          <span className="warn">{s.counts.WARNING} WARNING</span>
          <span className="fail">{s.counts.FAIL} FAIL</span>
          <span className="ne">{s.counts.NOT_EVALUATED} N/E</span>
        </div>
        {s.status === 'INCOMPLETE' && <p className="small">Sin incumplimientos, pero hay {s.pendingCritical.length} verificaciones críticas sin evaluar (estructura y mecánica).</p>}
        {s.failures.length > 0 && <p className="small">Incumple: {s.failures.join(', ')}</p>}
      </section>

      <nav className="tabs">
        {(
          [
            ['dims', 'Dimensiones'],
            ['hyd', 'Hidráulica'],
            ['meas', 'Mediciones'],
            ['val', 'Validación'],
            ['cmp', 'Comparar'],
          ] as const
        ).map(([t, l]) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {l}
          </button>
        ))}
      </nav>

      {tab === 'dims' && (
        <section className="card">
          {valueTable(equipment.dimsKeys as string[])}
          <p className="muted small">Pulse una fila para ver su ecuación y dependencias.</p>
        </section>
      )}
      {tab === 'hyd' && <section className="card">{valueTable(equipment.hydKeys as string[])}</section>}
      {tab === 'meas' && (
        <section className="card">
          <table className="vals">
            <tbody>
              {Object.entries(design.measurements.concreteByElementM3).map(([k, v]) => (
                <tr key={k}>
                  <td>Hormigón {k}</td>
                  <td className="num">{fmt(v)}</td>
                  <td className="u">m³</td>
                </tr>
              ))}
              <tr className="total">
                <td>Hormigón estructural total</td>
                <td className="num">{fmt(design.measurements.concreteTotalM3)}</td>
                <td className="u">m³</td>
              </tr>
              <tr>
                <td>Formación de pendiente</td>
                <td className="num">{fmt(design.measurements.fillTotalM3)}</td>
                <td className="u">m³</td>
              </tr>
              <tr>
                <td>Revestimiento mojado</td>
                <td className="num">{fmt(design.measurements.wettedLiningTotalM2)}</td>
                <td className="u">m²</td>
              </tr>
              <tr>
                <td>Excavación</td>
                <td className="num">{design.measurements.excavationM3 === null ? 'N/E' : fmt(design.measurements.excavationM3)}</td>
                <td className="u">m³</td>
              </tr>
              <tr>
                <td>Protección anticorrosiva</td>
                <td className="num">{fmt(design.measurements.corrosionProtectionM2)}</td>
                <td className="u">m²</td>
              </tr>
              <tr>
                <td>Armaduras</td>
                <td className="num">N/E</td>
                <td className="u" />
              </tr>
            </tbody>
          </table>
          <h4>Masas por componente</h4>
          <table className="vals">
            <tbody>
              {design.components.map((c) => (
                <tr key={c.id} onClick={() => onSelectComponent(c.id)}>
                  <td>
                    <code>{c.id}</code> {c.name}
                  </td>
                  <td className="num">{c.massKg === null ? c.massStatus === 'PARTIAL' ? 'parcial' : 'N/E' : fmt(c.massKg)}</td>
                  <td className="u">{c.massKg === null ? '' : 'kg'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="notes">
            {design.measurements.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      )}
      {tab === 'val' && (
        <section className="card">
          <div className="filters">
            {(['ALL', 'FAIL', 'WARNING', 'NOT_EVALUATED', 'PASS'] as const).map((f) => (
              <button key={f} className={statusFilter === f ? 'on' : ''} onClick={() => setStatusFilter(f)}>
                {f === 'ALL' ? 'Todas' : f === 'NOT_EVALUATED' ? 'N/E' : f}
              </button>
            ))}
          </div>
          {([1, 2, 3, 4] as ValidationLevel[]).map((lvl) => {
            const list = design.checks.filter((c) => c.level === lvl && (statusFilter === 'ALL' || c.status === statusFilter));
            if (list.length === 0) return null;
            return (
              <div key={lvl}>
                <h4>
                  Nivel {lvl} · {LEVEL_NAMES[lvl]}
                </h4>
                <ul className="checks">
                  {list.map((c) => (
                    <li key={c.id} className={STATUS_CLASS[c.status]} onClick={() => c.componentIds?.[0] && onSelectComponent(c.componentIds[0])}>
                      <span className="pill">{c.status === 'NOT_EVALUATED' ? 'N/E' : c.status}</span>
                      <div>
                        <b>{c.title}</b>
                        {c.critical && <span className="crit"> crítica</span>}
                        {c.value !== undefined && (
                          <span className="mono small">
                            {' '}
                            {fmt(c.value)} {c.unit} {c.limit ? `(${c.limit})` : ''}
                          </span>
                        )}
                        <div className="muted small">{c.message}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      )}
      {tab === 'cmp' && (
        <section className="card">
          <div className="cmp-pick">
            {variants.map((v) => (
              <label key={v.variantId} className="check">
                <input type="checkbox" checked={compareIds.includes(v.variantId)} onChange={() => onToggleCompare(v.variantId)} /> {v.tag}
              </label>
            ))}
          </div>
          {cmpVariants.length > 0 && (
            <div className="cmp-wrap">
              <table className="cmp">
                <thead>
                  <tr>
                    <th />
                    {cmpVariants.map((v) => (
                      <th key={v.variantId}>{v.tag}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key}>
                      <td>
                        {r.label} <span className="muted">[{unit(r.unit)}]</span>
                      </td>
                      {r.values.map((x, i) => (
                        <td key={i} className="num">
                          {fmt(x)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td>Estado</td>
                    {cmpVariants.map((v) => (
                      <td key={v.variantId} className={`num st-${v.validationStatus}`}>
                        {v.validationStatus}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section className="card actions">
        <button onClick={() => download(`${variant.tag}.variant.json`, exportVariantOf(equipment.definition, variant))}>Exportar JSON</button>
        <label className="file-btn">
          Importar JSON
          <input
            type="file"
            accept="application/json,.json"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) onImport(await f.text());
              e.target.value = '';
            }}
          />
        </label>
        <button onClick={() => download(`${variant.tag}-memoria.md`, renderReport(design, variant, equipment.reportRules), 'text/markdown')}>Memoria de cálculo (.md)</button>
        <p className="muted small mono">
          {variant.variantId}
          <br />
          padre: {variant.parentVariantId ?? '—'} · hash {variant.outputsHash}
        </p>
      </section>
    </div>
  );
}
