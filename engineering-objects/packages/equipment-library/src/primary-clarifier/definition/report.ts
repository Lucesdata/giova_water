import { LEVEL_NAMES, round, unitLabel, type CheckStatus, type ValidationLevel } from '@eo/engineering-core';
import { getMaterial, isMaterialId } from '@eo/material-library';
import type { ClarifierDesign } from './design.js';
import { MODELLING_RULES } from './engine.js';
import type { ClarifierVariant } from './variant.js';

const ICON: Record<CheckStatus, string> = { PASS: 'PASS', WARNING: 'WARNING', FAIL: 'FAIL', NOT_EVALUATED: 'NOT_EVALUATED' };

const fmt = (v: number) => {
  if (!Number.isFinite(v)) return String(v);
  if (Number.isInteger(v)) return String(v);
  const a = Math.abs(v);
  return a >= 100 ? v.toFixed(1) : a >= 1 ? v.toFixed(3) : v.toPrecision(3);
};

const esc = (s: string) => s.replace(/\|/g, '\\|');

/**
 * Memoria de cálculo preliminar, inventario, mediciones y reporte de validación en Markdown (spec §13, fase 6).
 */
export function renderReport(design: ClarifierDesign, variant?: ClarifierVariant): string {
  const d = design;
  const L: string[] = [];
  L.push(`# Memoria de cálculo preliminar — ${d.input.tag}`);
  if (d.input.name) L.push(`\n${d.input.name}`);
  L.push('');
  L.push('> **Documento generado automáticamente. No es un proyecto aprobado.** Las verificaciones estructurales y mecánicas pendientes se enumeran en la sección 7.');
  L.push('');
  L.push('## 1. Identificación');
  L.push('');
  L.push('| Campo | Valor |');
  L.push('|---|---|');
  if (variant) {
    L.push(`| objectId | \`${variant.objectId}\` |`);
    L.push(`| variantId | \`${variant.variantId}\` |`);
    L.push(`| parentVariantId | ${variant.parentVariantId ? `\`${variant.parentVariantId}\`` : '—'} |`);
    L.push(`| Modo | ${variant.mode} |`);
    L.push(`| createdAt | ${variant.createdAt} |`);
    L.push(`| outputsHash | \`${variant.outputsHash}\` |`);
  }
  L.push(`| Versión de esquema | ${variant?.schemaVersion ?? '—'} |`);
  L.push(`| Modelo de cálculo | ${d.engineeringModelVersion} |`);
  L.push(`| Estado de validación | **${d.summary.status}** |`);
  L.push('');
  L.push(`## 2. Perfil de diseño: ${d.profile.name}`);
  L.push('');
  L.push(`${d.profile.purpose} (aprobación: ${d.profile.approval}).`);
  L.push('');
  for (const h of d.profile.hypotheses) L.push(`- ${h}`);
  L.push('');
  const crit = Object.entries(d.criteria);
  if (crit.length > 0) {
    L.push('| Criterio | Restricción | Fuente | Nota |');
    L.push('|---|---|---|---|');
    for (const [k, c] of crit) {
      const r = c!.constraint;
      const parts = [r.min !== undefined && `mín ${fmt(r.min)}`, r.max !== undefined && `máx ${fmt(r.max)}`, (r.warnMin !== undefined || r.warnMax !== undefined) && `recomendado ${r.warnMin !== undefined ? fmt(r.warnMin) : '—'}…${r.warnMax !== undefined ? fmt(r.warnMax) : '—'}`].filter(Boolean);
      L.push(`| ${k} | ${parts.join('; ')} | ${c!.sourceId} | ${esc(c!.note ?? '')} |`);
    }
    L.push('');
  }
  L.push('## 3. Datos de entrada');
  L.push('');
  L.push('```json');
  L.push(JSON.stringify(d.input, null, 2));
  L.push('```');
  L.push('');
  L.push('## 4. Cálculos (trazabilidad)');
  L.push('');
  L.push('| Clave | Magnitud | Valor | Unidad | Ecuación / regla | Depende de | Origen |');
  L.push('|---|---|---:|---|---|---|---|');
  for (const v of Object.values(d.values)) {
    L.push(`| \`${v.key}\` | ${esc(v.label)} | ${fmt(v.value)} | ${unitLabel(v.unit)} | ${esc(v.equation)} | ${v.inputs.map((i) => `\`${i}\``).join(', ')} | ${v.origin}${v.warnings.length ? ` ⚠ ${esc(v.warnings.join(' '))}` : ''} |`);
  }
  L.push('');
  L.push('Reglas de modelado (no son criterios de diseño):');
  L.push('');
  for (const [k, v] of Object.entries(MODELLING_RULES)) L.push(`- \`${k}\` = ${v}`);
  L.push('');
  L.push('## 5. Inventario de componentes');
  L.push('');
  L.push('| ID | Componente | Disciplina | Materiales | Masa | Movimiento | Conexiones |');
  L.push('|---|---|---|---|---|---|---|');
  for (const c of d.components) {
    const mats = c.materialIds.map((m) => (isMaterialId(m) ? getMaterial(m).designation : m)).join('; ');
    const mass = c.massKg !== null ? `${round(c.massKg, 1)} kg (estimada)` : c.massStatus;
    L.push(`| ${c.id} | ${c.name} | ${c.discipline} | ${esc(mats)} | ${mass} | ${c.motion.type}${c.motion.dof ? ` (${c.motion.dof} GDL, eje Y)` : ''} | ${c.connections.length} |`);
  }
  L.push('');
  L.push('## 6. Mediciones');
  L.push('');
  const m = d.measurements;
  L.push('| Partida | Cantidad |');
  L.push('|---|---:|');
  for (const [k, v] of Object.entries(m.concreteByElementM3)) L.push(`| Hormigón estructural ${k} | ${fmt(v)} m³ |`);
  L.push(`| **Hormigón estructural total** | **${fmt(m.concreteTotalM3)} m³** |`);
  L.push(`| Hormigón de formación de pendiente | ${fmt(m.fillTotalM3)} m³ |`);
  for (const [k, v] of Object.entries(m.wettedLiningM2)) L.push(`| Revestimiento ${k} | ${fmt(v)} m² |`);
  L.push(`| Excavación | ${m.excavationM3 === null ? 'NOT_EVALUATED' : `${fmt(m.excavationM3)} m³`} |`);
  for (const [k, v] of Object.entries(m.metalLengthByMaterialM)) L.push(`| Longitud de perfiles/tubos ${k} | ${fmt(v)} m |`);
  L.push(`| Superficie de protección anticorrosiva (acero al carbono) | ${fmt(m.corrosionProtectionM2)} m² |`);
  L.push(`| Armaduras | ${m.rebar} |`);
  L.push('');
  for (const n of m.notes) L.push(`- ${n}`);
  L.push('');
  L.push('## 7. Validación');
  L.push('');
  L.push(`Estado global: **${d.summary.status}** — PASS ${d.summary.counts.PASS} · WARNING ${d.summary.counts.WARNING} · FAIL ${d.summary.counts.FAIL} · NOT_EVALUATED ${d.summary.counts.NOT_EVALUATED}`);
  L.push('');
  for (const lvl of [1, 2, 3, 4] as ValidationLevel[]) {
    L.push(`### Nivel ${lvl} — ${LEVEL_NAMES[lvl]}`);
    L.push('');
    L.push('| Estado | ID | Comprobación | Valor | Límite | Mensaje |');
    L.push('|---|---|---|---:|---|---|');
    for (const c of d.checks.filter((x) => x.level === lvl)) {
      L.push(`| ${ICON[c.status]}${c.critical ? ' (crítica)' : ''} | \`${c.id}\` | ${esc(c.title)} | ${c.value !== undefined ? `${fmt(c.value)}${c.unit ? ` ${c.unit}` : ''}` : ''} | ${esc(c.limit ?? '')} | ${esc(c.message)} |`);
    }
    L.push('');
  }
  if (d.summary.pendingCritical.length > 0) {
    L.push('### Verificaciones críticas pendientes');
    L.push('');
    for (const id of d.summary.pendingCritical) {
      const c = d.checks.find((x) => x.id === id)!;
      L.push(`- **${c.title}** (\`${id}\`): ${c.message}`);
    }
    L.push('');
  }
  L.push('## 8. Fuentes');
  L.push('');
  for (const s of d.sources) L.push(`- **${s.id}** — ${s.title}, ${s.edition}${s.locator ? `, ${s.locator}` : ''}. Ámbito: ${s.scope} _Verificación: ${s.verification}._`);
  L.push('');
  return L.join('\n');
}
