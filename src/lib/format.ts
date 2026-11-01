export const nf = new Intl.NumberFormat('es-PE');
export const nf1 = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 });
export const nf2 = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function fmt(n: number | null | undefined, digits = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es-PE', { maximumFractionDigits: digits }).format(n);
}

export function money(n: number | null | undefined, currency = 'USD') {
  if (n === null || n === undefined) return '—';
  // All monetary seed values are stored in USD millions.
  if (Math.abs(n) >= 1000) return `${currency} ${nf1.format(n / 1000)}bn`;
  return `${currency} ${nf1.format(n)}m`;
}

export function dateLabel(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

export function dateTimeLabel(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d);
}

export function pct(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return `${nf1.format(n)}%`;
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
}

export function materialityLabel(m: string) {
  return m === 'both' ? 'Doble material' : m === 'impact' ? 'Material por impacto' : m === 'financial' ? 'Material financiero' : 'No material';
}

export function materialityClass(m: string) {
  return m === 'both' ? 'amber' : m === 'impact' ? 'red' : m === 'financial' ? 'blue' : 'gray';
}

export function riskColor(score: number) {
  if (score >= 4.2) return '#ab685a';
  if (score >= 3.4) return '#c99b51';
  if (score >= 2.4) return '#87918c';
  return '#5e9e7a';
}
