import 'server-only';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type {
  AIResponse, Assessment, AuditLog, ClimateScenario, Company, Control, Disclosure,
  Engagement, Evidence, Facility, Finding, FrameworkCoverage, Grievance, IRO, KPI,
  MaterialityClass, MaterialityTopic, NatureLocation, Organization, Policy, Portfolio,
  Report, Requirement, SearchResult, Stakeholder, Supplier, Target, Topic, Workspace,
} from './types';
import { materialityFrom, scoreIsCritical } from './materiality-rules';

let dbInstance: Database.Database | null = null;

const DB_FILENAME = 'esg.db';

/**
 * Candidate locations for the seeded database.
 *
 * - `ESG_DB_PATH` lets a deployment point at a durable volume or a managed
 *   SQLite file without changing code.
 * - `data/esg.db` is the project default.
 * - The `.next/server` variants cover standalone output layouts.
 */
function bundledDbCandidates(): string[] {
  const cwd = process.cwd();
  return [
    path.join(cwd, 'data', DB_FILENAME),
    path.join(cwd, '.next', 'server', 'data', DB_FILENAME),
    path.join(cwd, '..', 'data', DB_FILENAME),
  ];
}

function findBundledDb(): string | null {
  for (const candidate of bundledDbCandidates()) {
    // `next.config.ts` traces `data/esg.db` explicitly; skip Turbopack's
    // automatic tracing here so it does not pull the whole project in.
    if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) return candidate;
  }
  return null;
}

/**
 * Vercel functions run on a read-only filesystem except for `os.tmpdir()`.
 * Copy the traced database once per instance and open the writable copy.
 * The file name includes the source size and mtime so a new deployment does
 * not reuse a stale copy from a previous build.
 */
function stageDbForServerless(source: string): string {
  const stat = fs.statSync(source);
  const signature = `${stat.size}-${Math.round(stat.mtimeMs)}`;
  const target = path.join(os.tmpdir(), `gol-esg-${signature}.db`);

  if (!fs.existsSync(/*turbopackIgnore: true*/ target)) {
    fs.copyFileSync(source, target);
    const wal = `${source}-wal`;
    if (fs.existsSync(/*turbopackIgnore: true*/ wal) && fs.statSync(wal).size > 0) {
      fs.copyFileSync(wal, `${target}-wal`);
    }
  }

  return target;
}

function resolveDbPath(): string {
  const override = process.env.ESG_DB_PATH?.trim();
  if (override) {
    const resolved = path.resolve(override);
    if (!fs.existsSync(/*turbopackIgnore: true*/ resolved)) {
      throw new Error(`ESG_DB_PATH points to a missing file: ${resolved}`);
    }
    return resolved;
  }

  const bundled = findBundledDb();
  if (!bundled) {
    throw new Error('ESG database not found. Run `npm run seed` before starting the application.');
  }

  return process.env.VERCEL ? stageDbForServerless(bundled) : bundled;
}

function getDb() {
  if (!dbInstance) {
    const dbPath = resolveDbPath();
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
  }
  return dbInstance;
}

export function toCamel<T = Record<string, unknown>>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = value;
  }
  return out as T;
}

const all = <T>(sql: string, ...params: unknown[]) =>
  getDb().prepare(sql).all(...params).map((r) => toCamel<T>(r as Record<string, unknown>));
const one = <T>(sql: string, ...params: unknown[]) => {
  const row = getDb().prepare(sql).get(...params) as Record<string, unknown> | undefined;
  return row ? toCamel<T>(row) : null;
};

const round = (n: number, d = 0) => {
  const p = 10 ** d;
  return Math.round(n * p) / p;
};

export function getPortfolio(): Portfolio {
  const companies = all<Company>(`
    SELECT c.*, o.name AS organization_name
    FROM companies c JOIN organizations o ON o.id = c.organization_id
    ORDER BY c.name
  `);
  const orgs = all<Organization>('SELECT * FROM organizations ORDER BY name');
  const iroRows = all<IRO>(`
    SELECT i.*, t.name AS topic_name, t.dimension
    FROM iros i JOIN topics t ON t.code = i.topic_code
    ORDER BY i.critical DESC, i.impact_score DESC
  `);
  const counts = iroRows.reduce<Record<MaterialityClass, number>>((acc, i) => {
    acc[i.materiality] = (acc[i.materiality] || 0) + 1;
    return acc;
  }, { both: 0, impact: 0, financial: 0, not: 0 });
  const topRisks = iroRows
    .filter((i) => i.type === 'Risk' && (i.critical || i.financialScore >= 4))
    .sort((a, b) => b.financialScore - a.financialScore)
    .slice(0, 6);
  const sectors = all<{ sector: string; count: number; revenue: number }>(`
    SELECT sector, COUNT(*) count, SUM(revenue) revenue FROM companies GROUP BY sector ORDER BY revenue DESC
  `);
  const countries = all<{ country: string; count: number }>(`
    SELECT country, COUNT(*) count FROM companies GROUP BY country ORDER BY count DESC
  `);
  const frameworkRows = getDb().prepare(`
    SELECT framework, COUNT(*) total,
      SUM(CASE WHEN status = 'Complete' THEN 1 ELSE 0 END) complete,
      SUM(CASE WHEN status = 'Partial' THEN 1 ELSE 0 END) partial,
      SUM(CASE WHEN status IN ('Gap','Not started') THEN 1 ELSE 0 END) gap,
      ROUND(AVG(coverage)) coverage
    FROM disclosures GROUP BY framework ORDER BY coverage DESC
  `).all().map((r) => toCamel<FrameworkCoverage>(r as Record<string, unknown>));
  const publishedReports = one<{ n: number }>("SELECT COUNT(*) n FROM reports WHERE status='Published'")?.n ?? 0;
  const openGrievances = one<{ n: number }>("SELECT COUNT(*) n FROM grievances WHERE status != 'Resolved'")?.n ?? 0;
  const totalRevenue = companies.reduce((s, c) => s + (c.revenue || 0), 0);
  const totalEmployees = companies.reduce((s, c) => s + (c.employees || 0), 0);
  const avg = (key: keyof Company) => round(companies.reduce((s, c) => s + Number(c[key] || 0), 0) / Math.max(1, companies.length));
  return {
    organizations: orgs,
    companies,
    summary: {
      companies: companies.length,
      materialTopics: companies.reduce((s, c) => s + c.materialityCount, 0),
      criticalIros: companies.reduce((s, c) => s + c.criticalIros, 0),
      dataQuality: avg('dataQuality'),
      reportingCoverage: avg('reportingCoverage'),
      targetProgress: avg('targetProgress'),
      openGrievances,
      totalRevenue,
      totalEmployees,
      publishedReports,
    },
    sectors,
    countries,
    materialityDistribution: counts,
    topRisks,
    frameworkCoverage: frameworkRows,
    updatedAt: companies[0]?.updatedAt || new Date().toISOString(),
  };
}

function aggregateMateriality(iros: IRO[], topics: { code: string; name: string; dimension: string; esrs: string }[]): MaterialityTopic[] {
  const topicMap = new Map(topics.map((t) => [t.code, t]));
  const groups = new Map<string, IRO[]>();
  for (const iro of iros) {
    if (!groups.has(iro.topicCode)) groups.set(iro.topicCode, []);
    groups.get(iro.topicCode)!.push(iro);
  }
  return [...groups.entries()].map(([code, list]) => {
    const t = topicMap.get(code);
    const impact = Math.max(...list.map((i) => i.impactScore));
    const financial = Math.max(...list.map((i) => i.financialScore));
    const materiality = materialityFrom(impact, financial);
    return {
      code,
      name: t?.name || code,
      dimension: (t?.dimension || 'E') as 'E' | 'S' | 'G',
      esrs: t?.esrs || 'Company-specific',
      impact: round(impact, 2),
      financial: round(financial, 2),
      materiality,
      critical: list.some((i) => i.critical) ? 1 : 0,
      count: list.length,
      iros: list.map((i) => i.code),
    };
  }).sort((a, b) => (b.impact + b.financial) - (a.impact + a.financial));
}

export function getWorkspace(companyId: string): Workspace | null {
  const company = one<Company>(`
    SELECT c.*, o.name AS organization_name FROM companies c
    JOIN organizations o ON o.id = c.organization_id WHERE c.id = ?
  `, companyId);
  if (!company) return null;
  const organization = one<Organization>('SELECT * FROM organizations WHERE id = ?', company.organizationId);
  const facilities = all<Facility>('SELECT * FROM facilities WHERE company_id = ? ORDER BY name', companyId);
  const assessments = all<Assessment>('SELECT * FROM assessments WHERE company_id = ? ORDER BY created_at DESC', companyId);
  const assessment = assessments[0] || null;
  const topics = all<Topic>('SELECT * FROM topics ORDER BY dimension, name');
  const iros = all<IRO>(`
    SELECT i.*, t.name AS topic_name, t.dimension, t.esrs
    FROM iros i JOIN topics t ON t.code = i.topic_code
    WHERE i.company_id = ? ORDER BY i.critical DESC, i.impact_score DESC
  `, companyId);
  const materialityTopics = aggregateMateriality(iros, topics);
  const materialityDistribution = iros.reduce<Record<MaterialityClass, number>>((acc, i) => {
    acc[i.materiality] = (acc[i.materiality] || 0) + 1;
    return acc;
  }, { both: 0, impact: 0, financial: 0, not: 0 });

  const kpis = all<KPI>('SELECT * FROM kpis WHERE company_id = ? ORDER BY dimension, category, name', companyId);
  for (const kpi of kpis) {
    kpi.history = all('SELECT period, value, target FROM kpi_history WHERE kpi_id = ? ORDER BY period', kpi.id);
    const base = kpi.direction === 'lower'
      ? (kpi.baseline === kpi.target ? 100 : ((kpi.baseline - kpi.value) / (kpi.baseline - kpi.target)) * 100)
      : (kpi.baseline === kpi.target ? 100 : ((kpi.value - kpi.baseline) / (kpi.target - kpi.baseline)) * 100);
    kpi.progress = Math.max(0, Math.min(100, Math.round(base)));
  }

  const stakeholders = all<Stakeholder>('SELECT * FROM stakeholders WHERE company_id = ? ORDER BY exposure DESC, vulnerability DESC', companyId);
  const engagements = all<Engagement>(`
    SELECT e.*, s.name AS stakeholder_name FROM engagements e
    LEFT JOIN stakeholders s ON s.id = e.stakeholder_id
    WHERE e.company_id = ? ORDER BY e.date DESC
  `, companyId);
  const grievances = all<Grievance>('SELECT * FROM grievances WHERE company_id = ? ORDER BY opened DESC', companyId);
  const suppliers = all<Supplier>('SELECT * FROM suppliers WHERE company_id = ? ORDER BY assessment ASC, incidents DESC', companyId);
  const policies = all<Policy>('SELECT * FROM policies WHERE company_id = ? ORDER BY code', companyId);
  const disclosures = all<Disclosure>('SELECT * FROM disclosures WHERE company_id = ? ORDER BY framework, requirement', companyId);
  const reports = all<Report>('SELECT * FROM reports WHERE company_id = ? ORDER BY generated_at DESC', companyId);
  const evidence = all<Evidence>('SELECT * FROM evidence WHERE company_id = ? ORDER BY date DESC', companyId);
  const controls = all<Control>('SELECT * FROM controls WHERE company_id = ? ORDER BY code', companyId);
  const findings = all<Finding>('SELECT * FROM audit_findings WHERE company_id = ? ORDER BY CASE severity WHEN \'Critical\' THEN 1 WHEN \'High\' THEN 2 WHEN \'Medium\' THEN 3 ELSE 4 END', companyId);
  const auditLogs = all<AuditLog>('SELECT * FROM audit_logs WHERE company_id = ? ORDER BY created_at DESC LIMIT 30', companyId);
  const climateScenarios = all<ClimateScenario>('SELECT * FROM climate_scenarios WHERE company_id = ? ORDER BY physical_risk DESC', companyId);
  const natureLocations = all<NatureLocation>('SELECT * FROM nature_locations WHERE company_id = ? ORDER BY risk DESC', companyId);
  const targets = all<Target>('SELECT * FROM targets WHERE company_id = ? ORDER BY progress ASC', companyId);
  const requirements = all<Requirement>('SELECT * FROM framework_requirements ORDER BY framework, code');

  const frameworkMap = new Map<string, { coverage: number[]; complete: number; partial: number; gap: number; total: number }>();
  for (const d of disclosures) {
    if (!frameworkMap.has(d.framework)) frameworkMap.set(d.framework, { coverage: [], complete: 0, partial: 0, gap: 0, total: 0 });
    const f = frameworkMap.get(d.framework)!;
    f.coverage.push(d.coverage);
    f.total++;
    if (d.status === 'Complete') f.complete++;
    else if (d.status === 'Partial') f.partial++;
    else f.gap++;
  }
  const frameworkCoverage: FrameworkCoverage[] = [...frameworkMap.entries()].map(([framework, f]) => ({
    framework,
    coverage: round(f.coverage.reduce((a, b) => a + b, 0) / f.coverage.length),
    complete: f.complete,
    partial: f.partial,
    gap: f.gap,
    total: f.total,
  })).sort((a, b) => b.coverage - a.coverage);

  const stageMap = new Map<string, { impact: number[]; financial: number[]; count: number }>();
  for (const iro of iros) {
    const stage = iro.stage || 'Not mapped';
    if (!stageMap.has(stage)) stageMap.set(stage, { impact: [], financial: [], count: 0 });
    const s = stageMap.get(stage)!;
    s.impact.push(iro.impactScore);
    s.financial.push(iro.financialScore);
    s.count++;
  }
  const valueChainExposure = [...stageMap.entries()].map(([stage, s]) => ({
    stage,
    impact: round(s.impact.reduce((a, b) => a + b, 0) / s.impact.length, 2),
    financial: round(s.financial.reduce((a, b) => a + b, 0) / s.financial.length, 2),
    count: s.count,
  }));

  const heatMap = new Map<string, { count: number; residual: number[] }>();
  for (const iro of iros.filter((i) => i.type === 'Risk')) {
    const likelihood = Math.max(1, Math.min(5, Math.round(iro.financialLikelihood || iro.likelihood || 3)));
    const impact = Math.max(1, Math.min(5, Math.round(iro.financialMagnitude || iro.financialScore || 3)));
    const key = `${likelihood}-${impact}`;
    if (!heatMap.has(key)) heatMap.set(key, { count: 0, residual: [] });
    const h = heatMap.get(key)!;
    h.count++;
    h.residual.push(iro.residual || iro.financialScore);
  }
  const riskHeatmap = [...heatMap.entries()].map(([key, h]) => {
    const [likelihood, impact] = key.split('-').map(Number);
    return { likelihood, impact, count: h.count, residual: round(h.residual.reduce((a, b) => a + b, 0) / h.residual.length, 2) };
  });

  const dq = company.dataQuality;
  const evidenceVerified = evidence.filter((e) => e.status === 'Verified').length;
  const dataQuality = {
    overall: dq,
    completeness: Math.min(100, dq + 4),
    accuracy: Math.min(100, dq - 3),
    consistency: Math.min(100, dq - 1),
    timeliness: Math.min(100, dq + 2),
    traceability: Math.min(100, Math.round((evidenceVerified / Math.max(1, evidence.length)) * 100)),
    comparability: Math.min(100, dq - 6),
    coverage: Math.min(100, round(disclosures.reduce((a, d) => a + d.coverage, 0) / Math.max(1, disclosures.length))),
  };

  return {
    company, organization, facilities, assessment, assessments, topics, iros, materialityTopics,
    materialityDistribution, kpis, stakeholders, engagements, grievances, suppliers, policies,
    disclosures, reports, evidence, controls, findings, auditLogs, climateScenarios,
    natureLocations, targets, requirements, frameworkCoverage, valueChainExposure, riskHeatmap, dataQuality,
  };
}

export function searchAll(q: string): SearchResult[] {
  const query = `%${q.trim()}%`;
  if (!q.trim()) return [];
  const results: SearchResult[] = [];
  const companies = all<{ id: string; name: string; sector: string; country: string }>(`
    SELECT id, name, sector, country FROM companies
    WHERE name LIKE ? OR short_name LIKE ? OR sector LIKE ? LIMIT 5
  `, query, query, query);
  for (const c of companies) results.push({ type: 'company', id: c.id, title: c.name, subtitle: `${c.sector} · ${c.country}`, companyId: c.id });
  // NOTE: the `all` helper camel-cases every column, so aliases must be read in camelCase.
  const iros = all<{ code: string; title: string; companyId: string; companyName: string }>(`
    SELECT i.code, i.title, i.company_id, c.short_name company_name FROM iros i
    JOIN companies c ON c.id = i.company_id
    WHERE i.code LIKE ? OR i.title LIKE ? OR i.description LIKE ? LIMIT 8
  `, query, query, query);
  for (const i of iros) results.push({ type: 'iro', id: i.code, title: `${i.code} · ${i.title}`, subtitle: i.companyName, companyId: i.companyId });
  const stakeholders = all<{ id: string; name: string; category: string; companyId: string; companyName: string }>(`
    SELECT s.id, s.name, s.category, s.company_id, c.short_name company_name FROM stakeholders s
    JOIN companies c ON c.id = s.company_id
    WHERE s.name LIKE ? OR s.category LIKE ? LIMIT 5
  `, query, query);
  for (const s of stakeholders) results.push({ type: 'stakeholder', id: s.id, title: s.name, subtitle: `${s.category} · ${s.companyName}`, companyId: s.companyId });
  const suppliers = all<{ id: string; name: string; sector: string; companyId: string; companyName: string }>(`
    SELECT s.id, s.name, s.sector, s.company_id, c.short_name company_name FROM suppliers s
    JOIN companies c ON c.id = s.company_id
    WHERE s.name LIKE ? OR s.sector LIKE ? LIMIT 5
  `, query, query);
  for (const s of suppliers) results.push({ type: 'supplier', id: s.id, title: s.name, subtitle: `${s.sector} · ${s.companyName}`, companyId: s.companyId });
  const disclosures = all<{ id: string; requirement: string; title: string; companyId: string; companyName: string }>(`
    SELECT d.id, d.requirement, d.title, d.company_id, c.short_name company_name FROM disclosures d
    JOIN companies c ON c.id = d.company_id
    WHERE d.requirement LIKE ? OR d.title LIKE ? LIMIT 5
  `, query, query);
  for (const d of disclosures) results.push({ type: 'disclosure', id: d.id, title: `${d.requirement} · ${d.title}`, subtitle: d.companyName, companyId: d.companyId });
  return results;
}

export function createIRO(input: {
  companyId: string; topicCode: string; title: string; type: string; nature?: string;
  actuality?: string; stage?: string; description: string; consequence?: string; cause?: string;
  impactScore: number; financialScore: number; critical?: boolean; owner?: string;
}): IRO | null {
  const company = one<Company>('SELECT * FROM companies WHERE id = ?', input.companyId);
  if (!company) return null;
  const topic = one<{ code: string; name: string }>('SELECT code, name FROM topics WHERE code = ?', input.topicCode);
  if (!topic) return null;
  const assessment = one<{ id: string }>('SELECT id FROM assessments WHERE company_id = ? ORDER BY created_at DESC LIMIT 1', input.companyId);
  const count = one<{ n: number }>('SELECT COUNT(*) n FROM iros WHERE company_id = ?', input.companyId)?.n || 0;
  const code = `IRO-${company.shortName.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()}-${String(count + 1).padStart(2, '0')}`;
  const id = `${code}-${Date.now()}`;
  const materiality = materialityFrom(input.impactScore, input.financialScore);
  const critical = input.critical || scoreIsCritical(input.impactScore, input.financialScore) ? 1 : 0;
  getDb().prepare(`
    INSERT INTO iros (id,company_id,assessment_id,topic_code,code,title,type,nature,actuality,stage,description,cause,consequence,owner,status,impact_score,financial_score,materiality,critical,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, input.companyId, assessment?.id || null, input.topicCode, code, input.title, input.type,
    input.nature || null, input.actuality || null, input.stage || null, input.description,
    input.cause || null, input.consequence || null, input.owner || 'Unassigned', 'Draft',
    input.impactScore, input.financialScore, materiality, critical, new Date().toISOString());
  logAudit(input.companyId, input.owner || 'Data Contributor', 'Data Contributor', 'CREATED', 'IRO', code,
    `New IRO created: ${input.title}`);
  return one<IRO>('SELECT * FROM iros WHERE id = ?', id);
}

export function updateIRO(id: string, patch: {
  impactScore?: number; financialScore?: number; status?: string; critical?: boolean;
  scale?: number; scope?: number; irremediability?: number; likelihood?: number;
  financialLikelihood?: number; financialMagnitude?: number; owner?: string;
}): IRO | null {
  const current = one<IRO>('SELECT * FROM iros WHERE id = ?', id);
  if (!current) return null;
  const impact = patch.impactScore ?? current.impactScore;
  const financial = patch.financialScore ?? current.financialScore;
  const materiality = materialityFrom(impact, financial);
  const critical = (patch.critical ?? (scoreIsCritical(impact, financial) || current.critical === 1)) ? 1 : 0;
  getDb().prepare(`
    UPDATE iros SET impact_score=?, financial_score=?, materiality=?, critical=?, status=?,
      scale=COALESCE(?,scale), scope=COALESCE(?,scope), irremediability=COALESCE(?,irremediability),
      likelihood=COALESCE(?,likelihood), financial_likelihood=COALESCE(?,financial_likelihood),
      financial_magnitude=COALESCE(?,financial_magnitude), owner=COALESCE(?,owner), updated_at=?
    WHERE id=?
  `).run(impact, financial, materiality, critical, patch.status || current.status,
    patch.scale ?? null, patch.scope ?? null, patch.irremediability ?? null, patch.likelihood ?? null,
    patch.financialLikelihood ?? null, patch.financialMagnitude ?? null, patch.owner ?? null,
    new Date().toISOString(), id);
  logAudit(current.companyId, patch.owner || 'Corporate ESG Director', 'Corporate ESG Director', 'UPDATED', 'IRO', current.code,
    `Impact score ${current.impactScore} → ${impact}; financial score ${current.financialScore} → ${financial}; materiality ${materiality}`);
  return one<IRO>('SELECT * FROM iros WHERE id = ?', id);
}

export function advanceAssessment(id: string, stage: number, status?: string): { ok: boolean; progress: number } {
  const current = one<{ id: string; company_id: string; stage: number; status: string }>('SELECT id, company_id, stage, status FROM assessments WHERE id = ?', id);
  if (!current) return { ok: false, progress: 0 };
  const progress = Math.round((Math.max(1, Math.min(9, stage)) / 9) * 100);
  const nextStatus = status || (stage >= 9 ? 'Approved' : stage >= 6 ? 'In review' : 'Draft');
  getDb().prepare('UPDATE assessments SET stage=?, progress=?, status=?, approved_at=? WHERE id=?')
    .run(stage, progress, nextStatus, stage >= 9 ? new Date().toISOString() : null, id);
  getDb().prepare('UPDATE companies SET assessment_progress=?, assessment_status=? WHERE id=?').run(progress, nextStatus, current.company_id);
  logAudit(current.company_id, 'Corporate ESG Director', 'Corporate ESG Director', 'UPDATED', 'Assessment', id,
    `Assessment advanced to stage ${stage}/9 (${nextStatus})`);
  return { ok: true, progress };
}

export function createAssessmentVersion(companyId: string): { id: string; version: string } | null {
  const company = one<Company>('SELECT * FROM companies WHERE id = ?', companyId);
  if (!company) return null;
  const latest = one<Assessment>('SELECT * FROM assessments WHERE company_id = ? ORDER BY created_at DESC LIMIT 1', companyId);
  const count = one<{ n: number }>('SELECT COUNT(*) n FROM assessments WHERE company_id = ?', companyId)?.n || 0;
  const baseVersion = latest?.version?.replace(/^v/, '') || '0.0';
  const [major, minor] = baseVersion.split('.').map((n) => Number(n) || 0);
  const version = `v${major}.${minor + 1}`;
  const id = `asm-${companyId}-${Date.now()}`;
  const now = new Date().toISOString();
  getDb().prepare(`
    INSERT INTO assessments (id,company_id,title,period,version,status,stage,scope,methodology,threshold_impact,threshold_financial,created_at,approved_at,progress,owner,reviewer,notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, companyId, `Doble materialidad ${new Date().getFullYear() + (count > 0 ? 1 : 0)} — nueva versión de trabajo`, 'FY2026', version,
    'Draft', 1, latest?.scope || 'Corporate perimeter', latest?.methodology || 'ESRS 1 / EFRAG IG1 (2025)',
    latest?.thresholdImpact || 3.2, latest?.thresholdFinancial || 3.2, now, null, 11,
    latest?.owner || company.csOfficer, latest?.reviewer || company.ceo, 'Versión creada a partir de la evaluación anterior. Los IRO se conservan vinculados a la versión original hasta su revisión.');
  getDb().prepare('UPDATE companies SET assessment_progress=11, assessment_status=? WHERE id=?').run('Draft', companyId);
  logAudit(companyId, 'Corporate ESG Director', 'Corporate ESG Director', 'CREATED', 'Assessment', id, `New assessment version ${version} created`);
  return { id, version };
}

export function logAudit(companyId: string | null, actor: string, role: string, action: string, entity: string, entityId: string, detail: string) {
  const hash = `sha256:${Buffer.from(`${companyId}${actor}${action}${entityId}${Date.now()}`).toString('hex').padEnd(64, '0').slice(0, 64)}`;
  getDb().prepare(`
    INSERT INTO audit_logs (company_id,actor,role,action,entity,entity_id,detail,created_at,hash)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(companyId, actor, role, action, entity, entityId, detail, new Date().toISOString(), hash);
}

export function getAuditTrail(limit = 100): AuditLog[] {
  return all<AuditLog>('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?', limit);
}

export function getAdminData() {
  const organizations = all('SELECT * FROM organizations ORDER BY name');
  const companies = all('SELECT * FROM companies ORDER BY name');
  const requirements = all('SELECT * FROM framework_requirements ORDER BY framework, code');
  const versions = all<{ framework: string; version: string; n: number }>(`
    SELECT framework, version, COUNT(*) n FROM framework_requirements GROUP BY framework, version ORDER BY framework
  `);
  const counts = {
    users: 14,
    roles: 12,
    auditLogs: one<{ n: number }>('SELECT COUNT(*) n FROM audit_logs')?.n || 0,
    evidence: one<{ n: number }>('SELECT COUNT(*) n FROM evidence')?.n || 0,
    disclosures: one<{ n: number }>('SELECT COUNT(*) n FROM disclosures')?.n || 0,
    aiRuns: one<{ n: number }>('SELECT COUNT(*) n FROM ai_runs')?.n || 0,
  };
  return { organizations, companies, requirements, versions, counts };
}

export function getReportData(companyId: string) {
  const workspace = getWorkspace(companyId);
  if (!workspace) return null;
  return {
    company: workspace.company,
    assessment: workspace.assessment,
    materialTopics: workspace.materialityTopics.filter((t) => t.materiality !== 'not'),
    criticalIros: workspace.iros.filter((i) => i.critical),
    kpis: workspace.kpis,
    targets: workspace.targets,
    disclosures: workspace.disclosures,
    evidence: workspace.evidence,
    frameworkCoverage: workspace.frameworkCoverage,
    generatedAt: new Date().toISOString(),
    perimeter: workspace.assessment?.scope || 'Corporate perimeter',
    methodology: workspace.assessment?.methodology || 'Double materiality methodology',
  };
}

export function askAI(companyId: string, prompt: string, agent = 'ESG Corporate Analyst'): AIResponse {
  const w = getWorkspace(companyId);
  if (!w) {
    return { answer: 'No company data found for this workspace.', sources: [], confidence: 'Low', classification: 'Grounded analysis', agent, suggestedActions: [] };
  }
  const q = prompt.toLowerCase();
  const mat = w.materialityTopics.filter((t) => t.materiality !== 'not');
  const both = mat.filter((t) => t.materiality === 'both');
  const impactOnly = mat.filter((t) => t.materiality === 'impact');
  const critical = w.iros.filter((i) => i.critical);
  const water = w.iros.filter((i) => /water|agua|hídric|hidric/i.test(`${i.topicName} ${i.title} ${i.description}`));
  const rights = w.iros.filter((i) => i.rights && i.rights !== '—' && /human|derecho|right|labour|labor/i.test(`${i.rights} ${i.topicName}`));
  const suppliers = w.suppliers.filter((s) => s.assessment < 60 || s.incidents > 0);
  const opps = w.iros.filter((i) => i.type === 'Opportunity');
  const risks = w.iros.filter((i) => i.type === 'Risk');
  const gaps = w.disclosures.filter((d) => d.status === 'Gap' || d.status === 'Not started');
  const topFramework = [...w.frameworkCoverage].sort((a, b) => a.coverage - b.coverage)[0];
  const kpiWater = w.kpis.find((k) => /water|agua/i.test(k.name));
  const climateKpis = w.kpis.filter((k) => k.dimension === 'E' && /carbon|emission|energ|renew|electric/i.test(k.name));
  const sources = [
    { label: 'Materiality register', value: `${w.iros.length} IROs · ${mat.length} material topics` },
    { label: 'Assessment', value: `${w.assessment?.title || 'No assessment'} · ${w.assessment?.status || 'Draft'}` },
    { label: 'Data quality', value: `${w.company.dataQuality}/100` },
  ];

  let answer = '';
  let classification: AIResponse['classification'] = 'Grounded analysis';
  let suggestedActions: string[] = [];

  if (/water|agua|hídric|hidric|estrés/i.test(q)) {
    const maxWater = water.sort((a, b) => b.impactScore - a.impactScore)[0];
    answer = [
      `**Water exposure — ${w.company.shortName}**`,
      `The register contains **${water.length} water-related IROs**. The highest impact is **${maxWater?.code || 'n/a'} — ${maxWater?.title || 'n/a'}** (impact ${maxWater?.impactScore ?? '—'}/5; financial ${maxWater?.financialScore ?? '—'}/5).`,
      `Material water topics: ${water.filter((i) => i.materiality !== 'not').map((i) => `${i.topicName} (${i.materiality})`).join(', ') || 'none above threshold'}.`,
      kpiWater ? `The operational KPI **${kpiWater.name}** is at **${kpiWater.value} ${kpiWater.unit}** against a target of ${kpiWater.target} (${kpiWater.status}).` : 'No dedicated water KPI is currently linked.',
      `**Interpretation:** water is ${water.some((i) => i.materiality === 'both') ? 'material in both dimensions, creating a coupled ecological and financial exposure' : 'predominantly an impact materiality issue in the current register'}. This should be read with the basin-level stress classification, not only company averages.`,
    ].join('\n\n');
    classification = 'Data interpretation';
    suggestedActions = ['Open the water IROs and verify basin stress evidence', 'Link the water KPI to ESRS E3-4 and CDP Water', 'Test the water scenario against the 2030 capex plan'];
  } else if (/supplier|proveedor|due diligence|debida diligencia/i.test(q)) {
    answer = [
      `**Supplier due diligence — ${w.company.shortName}**`,
      `**${suppliers.length} of ${w.suppliers.length} suppliers** show an assessment score below 60 or a recorded incident. The lowest assessment is **${w.suppliers[0]?.name}** at **${w.suppliers[0]?.assessment}%** with ${w.suppliers[0]?.incidents} incident(s).`,
      `Highest-risk suppliers: ${suppliers.slice(0, 4).map((s) => `${s.name} (${s.risk}, ${s.assessment}%)`).join('; ') || 'none flagged'}.`,
      `Grievances currently open: **${w.grievances.filter((g) => g.status !== 'Resolved').length}**. Critical cases: ${w.grievances.filter((g) => g.severity === 'Critical').map((g) => g.category).join(', ') || 'none'}.`,
      `**Limitation:** an audit or certificate is not evidence that adverse impacts are absent. The analysis uses the records available in this workspace and does not substitute for an independent investigation.`,
    ].join('\n\n');
    classification = 'Data interpretation';
    suggestedActions = ['Review suspended and escalated suppliers', 'Verify remediation evidence for open grievances', 'Run the OECD six-step coverage check'];
  } else if (/disclosure|divulgaci|report|reporte|esrs|gri|ifrs|tnfd|cdp/i.test(q)) {
    answer = [
      `**Disclosure readiness — ${w.company.shortName}**`,
      `Average coverage is **${w.company.reportingCoverage}%**. The weakest framework in this workspace is **${topFramework?.framework}** at **${topFramework?.coverage}%**; the strongest is **${w.frameworkCoverage[0]?.framework}** at **${w.frameworkCoverage[0]?.coverage}%**.`,
      `**${gaps.length} requirements** are classified as Gap or Not started. Examples: ${gaps.slice(0, 4).map((d) => `${d.requirement} — ${d.title}`).join('; ') || 'none'}.`,
      `The report library contains **${w.reports.length} packages**, of which ${w.reports.filter((r) => r.status === 'Published').length} are published. Every disclosed value should retain a link to a source record and evidence; completeness alone is not assurance.`,
    ].join('\n\n');
    classification = 'Grounded analysis';
    suggestedActions = ['Open the disclosure coverage matrix', 'Assign owners to the highest-severity gaps', 'Check evidence traceability for reported datapoints'];
  } else if (/climate|clima|carbon|emisi|transici|net zero/i.test(q)) {
    answer = [
      `**Climate intelligence — ${w.company.shortName}**`,
      `Climate exposure is scored **${w.company.climateExposure}/100** and transition opportunity **${w.company.transitionOpportunity}/100** in the portfolio model.`,
      `Relevant KPIs: ${climateKpis.map((k) => `${k.name} ${k.value}${k.unit ? ` ${k.unit}` : ''} (${k.status})`).join('; ') || 'no climate KPI linked'}.`,
      `Scenario set: ${w.climateScenarios.map((s) => `${s.name} (${s.warming}, physical ${s.physicalRisk}/5)`).join('; ')}.`,
      `**Important:** scenarios are decision-support tools, not predictions. The physical and transition scores must be read with their source, horizon and assumptions.`,
    ].join('\n\n');
    classification = 'Data interpretation';
    suggestedActions = ['Open the climate scenario comparison', 'Reconcile the GHG inventory to evidence', 'Review transition capex against targets'];
  } else if (/human right|derechos|labour|laboral|trabajador|forced|forzoso/i.test(q)) {
    answer = [
      `**Human rights & workforce — ${w.company.shortName}**`,
      `The register contains **${rights.length} IROs with an explicit rights dimension**. Critical cases: ${critical.filter((i) => i.rights).map((i) => `${i.code} — ${i.title}`).join('; ') || 'none flagged'}.`,
      `Open grievances: **${w.grievances.filter((g) => g.status !== 'Resolved').length}**. Severity mix: ${['Critical', 'High', 'Medium', 'Low'].map((s) => `${s}: ${w.grievances.filter((g) => g.severity === s).length}`).join(' · ')}.`,
      `Supplier assessments below 60%: **${suppliers.length}**. This is a coverage signal, not a finding of absence or presence of abuse.`,
      `**Interpretation:** human-rights severity receives priority even where likelihood is low. Remediation and access to remedy must be evidenced separately from policy commitments.`,
    ].join('\n\n');
    classification = 'Recommendation';
    suggestedActions = ['Escalate critical grievances to the human-rights lead', 'Review supplier remediation evidence', 'Test the grievance channel for confidentiality and retaliation protection'];
  } else if (/opportunit|oportunidad|transition|transición/i.test(q)) {
    answer = [
      `**Opportunity intelligence — ${w.company.shortName}**`,
      `**${opps.length} opportunities** are recorded. The largest estimated benefit is **${opps.sort((a, b) => (b.benefit || 0) - (a.benefit || 0))[0]?.title || 'n/a'}** (investment ${opps[0]?.investment ?? '—'}, annual benefit ${opps[0]?.benefit ?? '—'}).`,
      `Opportunities are ${opps.filter((i) => i.materiality !== 'not').length} material under the approved thresholds. Transition opportunity score: **${w.company.transitionOpportunity}/100**.`,
      `**Limitation:** financial benefits are only as reliable as the stated assumptions and are not recognised until supported by a business case and verified data.`,
    ].join('\n\n');
    classification = 'Recommendation';
    suggestedActions = ['Review opportunity business cases', 'Link opportunities to CAPEX and targets', 'Validate benefit assumptions with Finance'];
  } else {
    answer = [
      `**Executive brief — ${w.company.shortName}**`,
      `**${w.company.name}** operates in **${w.company.sector}** (${w.company.country}). The current assessment is **${w.assessment?.status || 'not started'}** at stage **${w.assessment?.stage || 0}/9** with **${mat.length} material topics** and **${critical.length} critical IROs**.`,
      `Material in both dimensions: **${both.map((t) => t.name).join(', ') || 'none'}**. Impact-only: **${impactOnly.map((t) => t.name).join(', ') || 'none'}**.`,
      `Data quality is **${w.company.dataQuality}/100**, reporting coverage **${w.company.reportingCoverage}%**, and average target progress **${w.company.targetProgress}%**. ${w.findings.filter((f) => f.severity === 'Critical' || f.severity === 'High').length} high/critical audit findings remain open.`,
      `**What I would look at next:** ${critical.slice(0, 3).map((i) => `${i.code} (${i.title})`).join('; ') || 'the materiality assessment'}. The answer is grounded in the current records and does not replace management judgement or assurance.`,
    ].join('\n\n');
    classification = 'Grounded analysis';
    suggestedActions = ['Open the double materiality matrix', 'Review critical IROs', 'Check open audit findings and evidence'];
  }

  getDb().prepare('INSERT INTO ai_runs (company_id,agent,prompt,response,sources,created_at) VALUES (?,?,?,?,?,?)')
    .run(companyId, agent, prompt, answer, JSON.stringify(sources), new Date().toISOString());
  logAudit(companyId, 'ESG AI Agent', 'AI Assistant', 'QUERIED', 'AI', agent, `Prompt: ${prompt.slice(0, 160)}`);

  return { answer, sources, confidence: w.company.dataQuality >= 80 ? 'High' : w.company.dataQuality >= 65 ? 'Medium' : 'Low', classification, agent, suggestedActions };
}

export function getFrameworkRequirements(): Requirement[] {
  return all<Requirement>('SELECT * FROM framework_requirements ORDER BY framework, code');
}
