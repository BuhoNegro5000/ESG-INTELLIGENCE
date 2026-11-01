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
  // Date-only values (YYYY-MM-DD) are calendar dates, not instants. Parsing them
  // as UTC midnight makes them render one day earlier in negative-offset zones.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const d = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
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

/**
 * Spanish labels for controlled vocabularies that live in SQLite.
 * Free-text narrative (IRO titles, descriptions, KPI names) is data and is
 * rendered exactly as stored; only enum-like values are translated here.
 */
const LABELS: Record<string, string> = {
  // Dimensions
  E: 'Ambiental', S: 'Social', G: 'Gobernanza',
  Environmental: 'Ambiental', Social: 'Social', Governance: 'Gobernanza',
  // IRO vocabulary
  Impact: 'Impacto', Risk: 'Riesgo', Opportunity: 'Oportunidad',
  Negative: 'Negativa', Positive: 'Positiva',
  Actual: 'Actual', Potential: 'Potencial',
  Upstream: 'Aguas arriba', 'Own operations': 'Operaciones propias', Downstream: 'Aguas abajo',
  'Short term': 'Corto plazo', 'Medium term': 'Mediano plazo', 'Long term': 'Largo plazo',
  'Short–medium term': 'Corto–mediano plazo', 'Medium–long term': 'Mediano–largo plazo',
  'Short–long term': 'Corto–largo plazo',
  // Statuses
  Draft: 'Borrador', 'In review': 'En revisión', 'Under review': 'En revisión',
  Approved: 'Aprobado', Rejected: 'Rechazado', Evaluated: 'Evaluado',
  Published: 'Publicado', 'On track': 'En curso', 'In progress': 'En progreso',
  'At risk': 'En riesgo', Complete: 'Completo', Partial: 'Parcial', Gap: 'Brecha',
  'Not started': 'Sin iniciar', Verified: 'Verificado', Submitted: 'Enviado', Expired: 'Vencido',
  Operating: 'Operativo', 'Needs remediation': 'Requiere remediación', Failed: 'Fallido',
  Open: 'Abierto', Closed: 'Cerrado', Completed: 'Completado', 'Follow-up required': 'Requiere seguimiento',
  'Under investigation': 'En investigación', 'Remediation in progress': 'Remediación en curso',
  Escalated: 'Escalado', Resolved: 'Resuelto', Suspended: 'Suspendido',
  Conditional: 'Condicional', 'Corrective action': 'Acción correctiva', Active: 'Activo',
  Effective: 'Efectivo', 'Effective with observation': 'Efectivo con observación', Deficiency: 'Deficiencia', 'Significant deficiency': 'Deficiencia significativa',
  'Partially effective': 'Parcialmente efectivo', 'Not tested': 'No probado',
  Overdue: 'Vencido', Due: 'Por vencer', 'Review due': 'Revisión pendiente', 'Review overdue': 'Revisión vencida',
  // Severity / exposure
  Critical: 'Crítico', High: 'Alto', Medium: 'Medio', Low: 'Bajo',
  'Extremely high': 'Extremadamente alto',
  // Maturity & assurance
  Advanced: 'Avanzada', Developing: 'En desarrollo', Foundational: 'Inicial',
  'Limited assurance': 'Aseguramiento limitado', 'Reasonable assurance': 'Aseguramiento razonable',
  // Relationships & stakeholders
  Engaged: 'En diálogo', Consulted: 'Consultado', Regulated: 'Regulado', Affected: 'Afectado', Partner: 'Socio',
  Workers: 'Trabajadores', Customers: 'Clientes', Communities: 'Comunidades',
  Authorities: 'Autoridades', 'Civil society': 'Sociedad civil', Suppliers: 'Proveedores',
  Investors: 'Inversionistas', Employees: 'Colaboradores',
  Survey: 'Encuesta', Interview: 'Entrevista', 'Community assembly': 'Asamblea comunitaria',
  'Technical workshop': 'Taller técnico', 'Dialogue table': 'Mesa de diálogo',
  Quarterly: 'Trimestral', Continuous: 'Continuo', Annual: 'Anual',
  // Reporting
  'Sustainability Report': 'Reporte de sostenibilidad',
  'Investor ESG Briefing': 'Briefing ESG para inversionistas',
  'Double Materiality Assessment': 'Evaluación de doble materialidad',
  // Audit actions
  APPROVED: 'APROBADO', COMMENTED: 'COMENTADO', CREATED: 'CREADO', EXPORTED: 'EXPORTADO',
  GENERATED: 'GENERADO', LOGIN: 'INGRESO', QUERIED: 'CONSULTADO', REVIEWED: 'REVISADO',
  UPDATED: 'ACTUALIZADO', UPLOADED: 'CARGADO',
  // Entity names
  Stakeholder: 'Grupo de interés', Session: 'Sesión', Report: 'Reporte', KPI: 'KPI',
  'IRO Register': 'Registro IRO', IRO: 'IRO', Evidence: 'Evidencia', Disclosure: 'Divulgación',
  Control: 'Control', Assessment: 'Evaluación', AI: 'IA',
  // Roles
  'Organization Owner': 'Titular de la organización', 'Data Contributor': 'Contribuidor de datos',
  Auditor: 'Auditor', 'Corporate ESG Director': 'Dirección ESG corporativa',
  'CFO / Financial Analyst': 'CFO / Analista financiero',
  'Sustainability Analyst': 'Analista de sostenibilidad', 'CFO / Finance': 'CFO / Finanzas',
  'Legal & Compliance': 'Legal y cumplimiento', 'Internal Audit': 'Auditoría interna',
  'External Assurance': 'Aseguramiento externo',
};

export function label(value: string | null | undefined) {
  if (value === null || value === undefined || value === '') return '—';
  return LABELS[value] ?? value;
}

export function dimensionLabel(dimension: string) {
  return dimension === 'E' ? 'Ambiental' : dimension === 'S' ? 'Social' : dimension === 'G' ? 'Gobernanza' : dimension;
}

/** "1 reporte publicado" / "2 reportes publicados" without hardcoding plurals. */
export function plural(count: number, singular: string, pluralForm?: string) {
  return count === 1 ? singular : pluralForm ?? `${singular}s`;
}

export function countLabel(count: number, singular: string, pluralForm?: string, digits = 0) {
  return `${fmt(count, digits)} ${plural(count, singular, pluralForm)}`;
}

/** Some seeded company websites use a reserved `.demo` domain. */
export function isPublicWebsite(value: string | null | undefined) {
  if (!value) return false;
  return !/(^|\.)demo($|[./])/i.test(value);
}
