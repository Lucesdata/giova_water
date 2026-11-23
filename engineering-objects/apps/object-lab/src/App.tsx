import { useCallback, useState } from 'react';
import type { ResizeGroup, VariantMode } from '@eo/equipment-library';
import { ParametersPanel } from './panels/ParametersPanel';
import { ResultsPanel } from './panels/ResultsPanel';
import { EQUIPMENT } from './equipment';
import { useVariants } from './useVariants';
import { Viewer, type ViewMode } from './viewer/Viewer';

export function App() {
  // Un almacén de variantes por equipo (los hooks no pueden ser condicionales).
  const stores = [useVariants(EQUIPMENT[0]!), useVariants(EQUIPMENT[1]!)];
  // `?equipo=clariflocculator` abre directamente un equipo (enlaces desde el portafolio).
  const [eqIndex, setEqIndex] = useState(() => {
    const id = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('equipo');
    return Math.max(0, EQUIPMENT.findIndex((e) => e.id === id));
  });
  const equipment = EQUIPMENT[eqIndex]!;
  const vs = stores[eqIndex]!;
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [view, setView] = useState<ViewMode>('iso');
  const [viewNonce, setViewNonce] = useState(0);
  const [section, setSection] = useState(false);
  const [showDims, setShowDims] = useState(true);
  const [showWater, setShowWater] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [isolated, setIsolated] = useState<string[] | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const design = vs.selectDesign;
  const setV = (v: ViewMode) => {
    setView(v);
    setViewNonce((n) => n + 1);
  };

  const onDerive = useCallback(
    (changes: Record<string, unknown>, mode: Exclude<VariantMode, 'BASE'>, allowed: ResizeGroup[]) => {
      vs.derive(vs.selected, changes, { mode, allowedResize: mode === 'C' ? allowed : undefined });
    },
    [vs],
  );

  const toggleCompare = (id: string) => setCompareIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const selectedComp = design.components.find((c) => c.id === selected);

  return (
    <div className={`app ${leftOpen ? '' : 'no-left'} ${rightOpen ? '' : 'no-right'}`}>
      <header className="topbar">
        <div className="brand">
          <span className="logo">◍</span> Object Lab
        </div>
        <div className="equipment">
          {EQUIPMENT.map((e, i) => (
            <button
              key={e.id}
              className={i === eqIndex ? 'on' : ''}
              onClick={() => {
                setEqIndex(i);
                setSelected(null);
                setIsolated(null);
                setCompareIds([]);
              }}
            >
              {e.label}
            </button>
          ))}
        </div>
        <div className="variants">
          {vs.variants.map((v) => (
            <button
              key={v.variantId}
              className={`chip ${v.variantId === vs.selected.variantId ? 'on' : ''} st-${v.validationStatus}`}
              title={`${v.variantId}\npadre: ${v.parentVariantId ?? '—'}\n${v.validationStatus}`}
              onClick={() => {
                vs.setSelectedId(v.variantId);
                setSelected(null);
                setIsolated(null);
              }}
            >
              {v.tag}
              <small>{v.mode}</small>
            </button>
          ))}
        </div>
        <div className="tools">
          {(
            [
              ['iso', 'Isométrica'],
              ['plan', 'Planta'],
              ['elevation', 'Alzado'],
            ] as const
          ).map(([v, l]) => (
            <button key={v} className={view === v ? 'on' : ''} onClick={() => setV(v)}>
              {l}
            </button>
          ))}
          <span className="sep" />
          <button className={section ? 'on' : ''} onClick={() => setSection(!section)}>
            Sección
          </button>
          <button className={showDims ? 'on' : ''} onClick={() => setShowDims(!showDims)}>
            Cotas
          </button>
          <button className={showWater ? 'on' : ''} onClick={() => setShowWater(!showWater)}>
            Lámina
          </button>
        </div>
      </header>

      <aside className="left">
        <button className="collapse" onClick={() => setLeftOpen(!leftOpen)} aria-label="Contraer panel de parámetros">
          {leftOpen ? '‹' : '›'}
        </button>
        {leftOpen && (
          <ParametersPanel
            variant={vs.selected}
            design={design}
            groups={equipment.groups}
            resizeGroups={equipment.resizeGroups}
            quick={equipment.quick}
            onDerive={onDerive}
            onQuick={(lps, tag) => vs.derive(vs.variants[0]!, { tag, flow: { averageLps: lps } }, { mode: 'A' })}
            baseTag={vs.variants[0]!.tag}
            selectedComponent={selected}
            onSelectComponent={setSelected}
            isolated={isolated}
            onIsolate={setIsolated}
          />
        )}
      </aside>

      <main className="viewer">
        <Viewer design={design} centralLabel={equipment.centralLabel} view={view} viewNonce={viewNonce} section={section} showDims={showDims} showWater={showWater} selectedId={selected} isolatedIds={isolated} onSelect={setSelected} />
        {vs.error && (
          <div className="toast" onClick={() => vs.setError(null)}>
            {vs.error}
          </div>
        )}
        {selectedComp && (
          <div className="inspector">
            <div className="row">
              <b>
                <code>{selectedComp.id}</code> {selectedComp.name}
              </b>
              <button className="link" onClick={() => setIsolated(isolated ? null : [selectedComp.id])}>
                {isolated ? 'Mostrar todo' : 'Aislar'}
              </button>
            </div>
            <div className="muted small">
              {selectedComp.discipline} · {selectedComp.materialIds.join(', ')} · {selectedComp.motion.type === 'rotation' ? 'gira (1 GDL, eje Y)' : 'fijo'} ·{' '}
              {selectedComp.massKg !== null ? `${selectedComp.massKg.toFixed(0)} kg (estimada)` : `masa ${selectedComp.massStatus}`}
            </div>
            <div className="small">
              {selectedComp.checkIds.map((id) => {
                const c = design.checks.find((x) => x.id === id)!;
                return (
                  <span key={id} className={`tag t-${c.status}`} title={c.message}>
                    {id}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        <div className="legend small muted">Unidades: m · Origen: centro del tanque, cota 0 = fondo en pared · Y vertical</div>
      </main>

      <aside className="right">
        <button className="collapse" onClick={() => setRightOpen(!rightOpen)} aria-label="Contraer panel de resultados">
          {rightOpen ? '›' : '‹'}
        </button>
        {rightOpen && (
          <ResultsPanel
            equipment={equipment}
            variant={vs.selected}
            design={design}
            variants={vs.variants}
            compareIds={compareIds}
            onToggleCompare={toggleCompare}
            onSelectComponent={setSelected}
            onImport={vs.importJson}
          />
        )}
      </aside>
    </div>
  );
}
