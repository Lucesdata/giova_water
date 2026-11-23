import { unitLabel, type UnitId } from '@eo/engineering-core';

export function fmt(v: number | null | undefined, digits?: number): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  if (digits !== undefined) return v.toFixed(digits);
  if (Number.isInteger(v)) return String(v);
  const a = Math.abs(v);
  return a >= 100 ? v.toFixed(1) : a >= 10 ? v.toFixed(2) : a >= 1 ? v.toFixed(3) : v.toPrecision(3);
}

export const unit = (u: string) => {
  try {
    return unitLabel(u as UnitId);
  } catch {
    return u;
  }
};

export function download(name: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
