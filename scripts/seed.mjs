import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { organizations, companies, facilities, assessments, companyNotes } from './data/companies.mjs';
import { topics } from './data/topics.mjs';
import { iros as irosA } from './data/iros-a.mjs';
import { iros as irosB } from './data/iros-b.mjs';
import {
  kpis, stakeholderSets, supplierSets, targets,
  frameworkRequirements, policyTemplates, reportTemplates,
} from './data/metrics.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'esg.db');
if (fs.existsSync(dbPath)) fs.rmSync(dbPath);
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(path.join(root, 'src', 'lib', 'schema.sql'), 'utf8'));

const now = '2026-10-30T09:30:00.000Z';
const allIros = { ...irosA, ...irosB };
const topicMap = new Map(topics.map((t) => [t[0], t]));
const assessmentByCompany = new Map(assessments.map((a) => [a.company, a]));

const insertOrg = db.prepare('INSERT INTO organizations (id,name,kind,country,created_at) VALUES (?,?,?,?,?)');
for (const o of organizations) insertOrg.run(o.id, o.name, o.kind, o.country, now);

const insertCompany = db.prepare(`INSERT INTO companies
  (id,organization_id,name,short_name,sector,subsector,country,city,employees,revenue,currency,founded,maturity,description,purpose,strategy,ceo,cs_officer,website,accent,status,data_quality,reporting_status,assurance_status,e_score,s_score,g_score,climate_exposure,nature_dependency,financial_exposure,transition_opportunity,materiality_count,critical_iros,assessment_status,assessment_progress,reporting_coverage,target_progress,updated_at)
  VALUES (@id,@org,@name,@short,@sector,@subsector,@country,@city,@employees,@revenue,@currency,@founded,@maturity,@description,@purpose,@strategy,@ceo,@cs,@website,@accent,'Active',@data,@report,@assurance,@e,@s,@g,@climate,@nature,@financial,@transition,@materiality,@critical,@assess,@progress,0,0,@updated)`);
for (const c of companies) {
  insertCompany.run({
    id: c.id, org: c.org, name: c.name, short: c.short, sector: c.sector, subsector: c.subsector,
    country: c.country, city: c.city, employees: c.employees, revenue: c.revenue, currency: c.currency,
    founded: c.founded, maturity: c.maturity, description: c.description, purpose: c.purpose, strategy: c.strategy,
    ceo: c.ceo, cs: c.cs, website: c.website, accent: c.accent, data: c.data, report: c.report,
    assurance: c.assurance, e: c.e, s: c.s, g: c.g, climate: c.climate, nature: c.nature,
    financial: c.financial, transition: c.transition, materiality: c.materiality, critical: c.critical,
    assess: c.assess, progress: c.progress, updated: now,
  });
}

const insertFacility = db.prepare('INSERT INTO facilities (id,company_id,name,country,region,type,lat,lng,employees,water_stress,protected_area,certification) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
for (const f of facilities) insertFacility.run(f.id, f.company, f.name, f.country, f.region, f.type, f.lat, f.lng, f.employees, f.water, f.protected, f.cert);

const insertAssessment = db.prepare('INSERT INTO assessments (id,company_id,title,period,version,status,stage,scope,methodology,threshold_impact,threshold_financial,created_at,approved_at,progress,owner,reviewer,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
for (const a of assessments) insertAssessment.run(a.id, a.company, a.title, a.period, a.version, a.status, a.stage, a.scope, a.methodology, a.thresholdI, a.thresholdF, a.created, a.approved, a.progress, a.owner, a.reviewer, a.notes);

const insertTopic = db.prepare('INSERT INTO topics (code,dimension,name,subtopic,esrs,gri,description) VALUES (?,?,?,?,?,?,?)');
for (const t of topics) insertTopic.run(...t);

function decide(impact, financial, thresholdI = 3.2, thresholdF = 3.2) {
  const i = impact >= thresholdI;
  const f = financial >= thresholdF;
  if (i && f) return 'both';
  if (i) return 'impact';
  if (f) return 'financial';
  return 'not';
}

const insertIro = db.prepare(`INSERT INTO iros
  (id,company_id,assessment_id,topic_code,code,title,type,nature,actuality,stage,activity,location,stakeholder,rights,horizon,description,cause,consequence,evidence,owner,status,scale,scope,irremediability,likelihood,severity,impact_score,financial_likelihood,financial_magnitude,financial_score,materiality,critical,financial_effect,controls,inherent,residual,investment,benefit,confidence,updated_at)
  VALUES (@id,@company,@assessment,@topic,@code,@title,@type,@nature,@actuality,@stage,@activity,@location,@stakeholder,@rights,@horizon,@description,@cause,@consequence,@evidence,@owner,@status,@scale,@scope,@irremed,@likelihood,@severity,@impact,@finL,@finM,@financial,@materiality,@critical,@financialEffect,@controls,@inherent,@residual,@investment,@benefit,@confidence,@updated)`);
let iroCounter = 0;
for (const c of companies) {
  const list = allIros[c.id] || [];
  for (const i of list) {
    const assessment = assessmentByCompany.get(c.id);
    const t = topicMap.get(i.topic);
    if (!t) throw new Error(`Unknown topic ${i.topic} for ${i.code}`);
    const severity = i.scale && i.scope && i.irremed ? (i.scale + i.scope + i.irremed) / 3 : null;
    const materiality = decide(i.impact, i.financial, assessment?.thresholdI, assessment?.thresholdF);
    const critical = i.critical || i.impact >= 4.4 || i.financial >= 4.4 ? 1 : 0;
    const status = assessment?.status === 'Approved' ? 'Approved' : assessment?.status === 'In review' ? 'Under review' : 'Evaluated';
    insertIro.run({
      id: i.code, company: c.id, assessment: assessment?.id || null, topic: i.topic, code: i.code,
      title: i.title, type: i.type, nature: i.nature || null, actuality: i.actuality || null,
      stage: i.stage || null, activity: i.activity || null, location: i.location || null,
      stakeholder: i.stakeholder || null, rights: i.rights || null, horizon: i.horizon || null,
      description: i.description, cause: i.cause, consequence: i.consequence, evidence: i.evidence,
      owner: i.owner, status, scale: i.scale || null, scope: i.scope || null,
      irremed: i.irremed || null, likelihood: i.likelihood || null, severity,
      impact: i.impact, finL: i.finL || null, finM: i.finM || null, financial: i.financial,
      materiality, critical, financialEffect: i.financialEffect || null, controls: i.controls || null,
      inherent: i.inherent || null, residual: i.residual || null, investment: i.investment || null,
      benefit: i.benefit || null, confidence: i.confidence || null, updated: now,
    });
    iroCounter++;
  }
}

const insertKpi = db.prepare('INSERT INTO kpis (id,company_id,code,name,dimension,category,unit,value,previous_value,baseline,target,direction,quality,source,owner,framework,status,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
const insertHistory = db.prepare('INSERT INTO kpi_history (kpi_id,period,value,target) VALUES (?,?,?,?)');
const periods = ['2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10'];
let kpiIndex = 0;
for (const c of companies) {
  for (const k of kpis[c.id]) {
    const [code, name, dim, category, unit, value, previous, baseline, target, direction, quality, source, owner, framework] = k;
    let progress;
    if (direction === 'lower') {
      progress = baseline === target ? 100 : ((baseline - value) / (baseline - target)) * 100;
    } else {
      progress = baseline === target ? 100 : ((value - baseline) / (target - baseline)) * 100;
    }
    progress = Math.max(0, Math.min(100, Math.round(progress)));
    const status = progress >= 75 ? 'On track' : progress >= 45 ? 'In progress' : 'At risk';
    insertKpi.run(code, c.id, code, name, dim, category, unit, value, previous, baseline, target, direction, quality, source, owner, framework, status, now);
    const start = direction === 'lower' ? previous + (previous - value) * 1.1 : previous - (value - previous) * 1.1;
    for (let p = 0; p < periods.length; p++) {
      const t = p / (periods.length - 1);
      const wave = Math.sin((p + kpiIndex) * 0.9) * (Math.abs(value - start) * 0.035);
      const v = p === periods.length - 1 ? value : start + (value - start) * t + wave;
      insertHistory.run(code, periods[p], Math.round(v * 100) / 100, target);
    }
    kpiIndex++;
  }
}

const insertStakeholder = db.prepare('INSERT INTO stakeholders (id,company_id,name,category,relation,influence,exposure,vulnerability,location,interests,rights,channels,last_engagement) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
for (const c of companies) {
  for (const s of stakeholderSets[c.id]) {
    insertStakeholder.run(s[0], c.id, s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8], s[9], s[10], '2026-09-18');
  }
}

const insertEngagement = db.prepare('INSERT INTO engagements (id,company_id,stakeholder_id,title,type,date,status,participants,commitments,evidence) VALUES (?,?,?,?,?,?,?,?,?,?)');
const engagementTypes = ['Dialogue table', 'Interview', 'Survey', 'Community assembly', 'Technical workshop'];
const engagementTitles = ['Water stewardship dialogue', 'Materiality validation workshop', 'Worker voice survey', 'Community grievance review', 'Supplier standards consultation'];
for (const [ci, c] of companies.entries()) {
  for (let e = 0; e < 3; e++) {
    const s = stakeholderSets[c.id][e];
    insertEngagement.run(`ENG-${c.id}-${e + 1}`, c.id, s[0], engagementTitles[(ci + e) % engagementTitles.length], engagementTypes[(ci + e) % engagementTypes.length], `2026-0${(e % 8) + 2}-1${e + 1}`, e === 2 ? 'Follow-up required' : 'Completed', 18 + e * 7 + ci, 'Documented in engagement minutes; actions assigned to owner.', `EV-${c.id.toUpperCase().slice(0, 3)}-ENG-${e + 1}`);
  }
}

const insertGrievance = db.prepare('INSERT INTO grievances (id,company_id,stakeholder,category,severity,status,opened,resolved,description,remediation) VALUES (?,?,?,?,?,?,?,?,?,?)');
const grievanceTemplates = {
  'andean-copper': [
    ['Grievance: water truck access denied to downstream farmers', 'Community water access', 'High', 'Under investigation', '2026-08-12', null, 'Farmers report reduced access to a shared water point during the dry season.', 'Emergency water delivery under review; joint monitoring proposed.'],
    ['Grievance: dust and blasting impacts on housing', 'Community health', 'Medium', 'Remediation in progress', '2026-06-03', null, 'Cracks and dust reported in homes near the northern expansion.', 'Structural assessment and dust suppression schedule agreed.'],
  ],
  'valle-verde': [
    ['Grievance: recruitment fees charged to seasonal workers', 'Labour rights', 'High', 'Remediation in progress', '2026-07-22', null, 'Workers reported fees charged by a labour intermediary.', 'Repayment initiated; intermediary suspended.'],
    ['Grievance: pesticide spray near school', 'Community health', 'High', 'Under investigation', '2026-09-04', null, 'Community reports spraying near a school during school hours.', 'Spray buffer audit and schedule change under review.'],
  ],
  'pacific-logistics': [
    ['Grievance: night-time noise at urban depot', 'Community health', 'Medium', 'Resolved', '2026-05-19', '2026-08-30', 'Residents reported noise from refrigerated trailers at night.', 'Trailer parking relocated and noise barrier installed.'],
    ['Grievance: unpaid waiting time for contracted drivers', 'Labour rights', 'Medium', 'Under investigation', '2026-08-11', null, 'Drivers report deductions for waiting time at customer sites.', 'Contract review and payroll audit initiated.'],
  ],
  'bosque-azul': [
    ['Grievance: beach access restricted by lodge operations', 'Community access', 'Medium', 'Remediation in progress', '2026-06-15', null, 'Residents report restricted access to a customary beach path.', 'Access route redesign agreed with community council.'],
    ['Grievance: waste water smell near staff housing', 'Community health', 'Medium', 'Under investigation', '2026-09-02', null, 'Staff and neighbours report odour from a treatment system.', 'Maintenance and monitoring scheduled.'],
  ],
  'alimentos-pacifico': [
    ['Grievance: river odour near plant outfall', 'Community health', 'Medium', 'Remediation in progress', '2026-07-30', null, 'Residents report odour and discolouration near the discharge point.', 'Effluent treatment upgrade accelerated.'],
    ['Grievance: seasonal supplier payment delays', 'Supplier treatment', 'Low', 'Resolved', '2026-04-12', '2026-06-01', 'Smallholder suppliers report delayed payments.', 'Payment terms standardised to 30 days.'],
  ],
  'financia-andina': [
    ['Grievance: unclear fees on microcredit product', 'Consumer protection', 'Medium', 'Remediation in progress', '2026-08-05', null, 'Customers report unexpected fees and unclear disclosures.', 'Fee schedule simplified and remediation payments initiated.'],
    ['Grievance: aggressive debt collection calls', 'Consumer protection', 'High', 'Under investigation', '2026-09-14', null, 'Customers report repeated calls outside permitted hours.', 'Collection agency suspended pending review.'],
  ],
  'novatech-digital': [
    ['Grievance: data-centre water extraction during drought', 'Community water access', 'High', 'Under investigation', '2026-08-25', null, 'Community groups report reduced municipal water pressure near DC1.', 'Water use review and emergency supply plan under discussion.'],
    ['Grievance: excessive overtime at supplier factory', 'Labour rights', 'Medium', 'Remediation in progress', '2026-07-07', null, 'Workers report 70-hour weeks during peak production.', 'Overtime cap and third-party monitoring introduced.'],
  ],
  'textiles-sur': [
    ['Grievance: recruitment fees and retained identity documents', 'Forced labour', 'Critical', 'Escalated', '2026-08-01', null, 'Workers at two subcontractors report fees and document retention.', 'Subcontractors suspended; remediation and reimbursement underway.'],
    ['Grievance: untreated effluent discharged into Rímac basin', 'Environmental pollution', 'Critical', 'Under investigation', '2026-09-11', null, 'Community and regulator reports of coloured discharge.', 'Treatment plant bypass stopped; independent sampling initiated.'],
  ],
};
for (const c of companies) {
  for (const [idx, g] of grievanceTemplates[c.id].entries()) {
    insertGrievance.run(`GRV-${c.id}-${idx + 1}`, c.id, g[0], g[1], g[2], g[3], g[4], g[5], g[6], g[7]);
  }
}

const insertSupplier = db.prepare('INSERT INTO suppliers (id,company_id,name,country,sector,risk,spend,assessment,audit,certifications,incidents,traceability,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
for (const c of companies) for (const s of supplierSets[c.id]) insertSupplier.run(s[0], c.id, ...s.slice(1));

const insertTarget = db.prepare('INSERT INTO targets (id,company_id,title,topic,baseline,target,current,unit,deadline,progress,status,owner) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
for (const c of companies) for (const t of targets[c.id]) insertTarget.run(t[0], c.id, ...t.slice(1));

const insertPolicy = db.prepare('INSERT INTO policies (id,company_id,code,title,version,owner,approved,effective,review,status,scope) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
for (const c of companies) {
  for (const p of policyTemplates) {
    const status = c.id === 'bosque-azul' && p[0] === 'POL-04' ? 'Review overdue' : p[8];
    insertPolicy.run(`PLC-${c.id}-${p[0]}`, c.id, p[0], p[1], p[2], p[3], p[4], p[5], p[6], status, p[9]);
  }
}

const insertRequirement = db.prepare('INSERT INTO framework_requirements (id,framework,version,code,title,instrument_type,category,description,effective) VALUES (?,?,?,?,?,?,?,?,?)');
for (const r of frameworkRequirements) insertRequirement.run(...r);

const insertDisclosure = db.prepare('INSERT INTO disclosures (id,company_id,framework,version,requirement,title,status,coverage,owner,evidence,data_points,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
const frameworkFactor = { ESRS: -2, 'IFRS S2': -6, 'IFRS S1': -4, GRI: 4, TNFD: -12, CDP: -7, OECD: -9, UNGP: -4, 'EU Taxonomy': -14, VSME: 5 };
const ownerByFramework = { ESRS: 'Sustainability', 'IFRS S2': 'CFO Office', 'IFRS S1': 'CFO Office', GRI: 'Sustainability', TNFD: 'Nature Lead', CDP: 'Sustainability', OECD: 'Procurement', UNGP: 'Human Rights Lead', 'EU Taxonomy': 'Finance', VSME: 'Sustainability' };
for (const [ci, c] of companies.entries()) {
  for (const [ri, r] of frameworkRequirements.entries()) {
    const [id, framework, version, code, title, type, category] = r;
    let cov = c.data + (frameworkFactor[framework] || 0) + ((ci * 7 + ri * 3) % 17) - 8;
    if (c.id === 'textiles-sur') cov -= 16;
    if (c.id === 'bosque-azul') cov -= 11;
    if (c.id === 'pacific-logistics') cov += 6;
    if (c.id === 'financia-andina') cov += 4;
    cov = Math.max(8, Math.min(100, cov));
    const status = cov >= 85 ? 'Complete' : cov >= 60 ? 'Partial' : cov >= 35 ? 'Gap' : 'Not started';
    insertDisclosure.run(`DSC-${c.id}-${ri + 1}`, c.id, framework, version, code, title, status, cov, ownerByFramework[framework] || 'Sustainability', `EV-${c.id.toUpperCase().slice(0, 3)}-DSC-${ri + 1}`, `${Math.round(cov / 10)} of 10 datapoints evidenced`, now);
  }
}

const insertReport = db.prepare('INSERT INTO reports (id,company_id,title,type,framework,period,status,coverage,generated_at,pages) VALUES (?,?,?,?,?,?,?,?,?,?)');
for (const [ci, c] of companies.entries()) {
  for (const [ri, r] of reportTemplates.entries()) {
    let status = r[4];
    if (c.report === 'Draft' && ri < 2) status = 'Draft';
    if (c.report === 'In review' && ri === 0) status = 'In review';
    if (c.report === 'Published' && ri === 0) status = 'Published';
    const cov = Math.max(20, Math.min(98, c.data - 8 + ri * 3 + ci));
    insertReport.run(`RPT-${c.id}-${ri + 1}`, c.id, `${r[0]} — ${c.short}`, r[1], r[2], r[3], status, cov, `2026-${String(8 + ri).padStart(2, '0')}-15`, r[6]);
  }
}

const insertEvidence = db.prepare('INSERT INTO evidence (id,company_id,name,type,linked_to,owner,date,status,size,hash) VALUES (?,?,?,?,?,?,?,?,?,?)');
const evidenceTypes = ['Policy', 'Monitoring data', 'Audit report', 'Contract', 'Survey', 'Certificate', 'Minutes', 'Study'];
for (const [ci, c] of companies.entries()) {
  const iroList = allIros[c.id];
  const kpiList = kpis[c.id];
  for (let e = 0; e < 8; e++) {
    const type = evidenceTypes[(ci + e) % evidenceTypes.length];
    const linked = e < 4 ? iroList[e].code : kpiList[e % kpiList.length][0];
    const status = e === 7 ? 'Expired' : e === 6 ? 'Submitted' : 'Verified';
    insertEvidence.run(`EV-${c.id.toUpperCase().slice(0, 3)}-${String(e + 1).padStart(3, '0')}`, c.id, `${type} — ${linked}`, type, linked, c.cs, `2026-${String((e % 9) + 1).padStart(2, '0')}-${String((e * 3) + 4).padStart(2, '0')}`, status, `${(0.4 + e * 0.7).toFixed(1)} MB`, `sha256:${(c.id + e).padEnd(12, 'x').slice(0, 12)}${'a1b2c3d4'.repeat(4)}`);
  }
}

const insertControl = db.prepare('INSERT INTO controls (id,company_id,code,title,risk,owner,frequency,evidence_required,test_result,deficiencies,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
const controlTemplates = [
  ['CTRL-01', 'Materiality register review and approval', 'Incomplete or biased materiality assessment', 'Sustainability', 'Annual', 'Approved IRO register and board minutes', 'Effective', 0, 'Operating'],
  ['CTRL-02', 'GHG data reconciliation', 'Misstated emissions', 'Energy Manager', 'Quarterly', 'Meter data, invoices and calculation workbook', 'Effective with observation', 1, 'Operating'],
  ['CTRL-03', 'Supplier risk-based due diligence', 'Undetected labour or environmental harm', 'Procurement', 'Continuous', 'Risk score, audit and corrective action', 'Deficiency', 2, 'Needs remediation'],
  ['CTRL-04', 'Grievance case access and confidentiality', 'Retaliation or data breach', 'Human Rights Lead', 'Continuous', 'Access log and case review', 'Effective', 0, 'Operating'],
  ['CTRL-05', 'Disclosure evidence traceability', 'Unsupported reporting claim', 'CFO Office', 'Quarterly', 'Evidence link and reviewer sign-off', 'Effective with observation', 1, 'Operating'],
];
for (const c of companies) {
  for (const [idx, t] of controlTemplates.entries()) {
    let result = t[7], def = t[8], status = t[9];
    if (c.id === 'textiles-sur' && idx === 2) { result = 'Significant deficiency'; def = 5; status = 'Failed'; }
    if (c.id === 'bosque-azul' && idx === 0) { result = 'Deficiency'; def = 2; status = 'Needs remediation'; }
    if (c.id === 'pacific-logistics' && idx === 1) { result = 'Effective'; def = 0; }
    insertControl.run(`CT-${c.id}-${idx + 1}`, c.id, t[0], t[1], t[2], t[3], t[4], t[5], result, def, status);
  }
}

const insertFinding = db.prepare('INSERT INTO audit_findings (id,company_id,code,title,severity,status,owner,due_date,finding,action) VALUES (?,?,?,?,?,?,?,?,?,?)');
const findingTemplates = {
  'andean-copper': [
    ['AF-01', 'Tailings emergency action plan not tested downstream', 'High', 'Open', 'COO', '2026-12-15', 'The 2026 tabletop exercise did not include downstream community representatives.', 'Run a full simulation with community and local authorities by Q4 2026.'],
    ['AF-02', 'Water withdrawal data reconciled to meters', 'Low', 'Closed', 'Water Lead', '2026-07-30', 'Minor timing differences between meter readings and invoice dates.', 'Reconciliation procedure updated.'],
    ['AF-03', 'Board minutes evidence climate oversight', 'Medium', 'In progress', 'Board Secretary', '2026-11-30', 'Climate was discussed but not minuted as a standing agenda item.', 'Add climate and nature to standing board agenda.'],
  ],
  'valle-verde': [
    ['AF-01', 'Contractor labour audit sample incomplete', 'High', 'Open', 'HR Director', '2026-11-30', 'Two of six sampled labour contractors had no worker interviews.', 'Complete independent interviews and remediation.'],
    ['AF-02', 'Water use data lacks independent verification', 'Medium', 'Open', 'Water Lead', '2026-12-20', 'Meter calibration records are incomplete for two wells.', 'Calibrate meters and obtain third-party verification.'],
    ['AF-03', 'Grievance log not linked to remediation evidence', 'Medium', 'In progress', 'Sustainability', '2026-11-15', 'Grievance closure evidence is held outside the platform.', 'Migrate evidence and link to case records.'],
  ],
  'pacific-logistics': [
    ['AF-01', 'Contracted driver hours not fully monitored', 'Medium', 'In progress', 'Safety Director', '2026-11-30', 'Telematics data does not cover three subcontractors.', 'Extend data-sharing requirements to all contractors.'],
    ['AF-02', 'Scope 3 category 4 data estimated without disclosure', 'Low', 'Closed', 'CFO Office', '2026-08-15', 'Estimation method was not documented in the report.', 'Add methodology note and sensitivity range.'],
    ['AF-03', 'EV charging procurement controls', 'Low', 'Closed', 'Procurement', '2026-06-30', 'Two purchase orders lacked competitive tender evidence.', 'Procurement policy training completed.'],
  ],
  'bosque-azul': [
    ['AF-01', 'Related-party transactions not disclosed to lenders', 'High', 'Open', 'Board Secretary', '2026-12-31', 'Two transactions with founder-owned entities were not in the related-party register.', 'Complete register and obtain independent review.'],
    ['AF-02', 'Water data coverage incomplete', 'Medium', 'Open', 'Sustainability', '2026-12-15', 'Two of four lodges lack sub-metering.', 'Install meters and establish baseline.'],
    ['AF-03', 'Community grievance evidence not retained', 'Medium', 'In progress', 'Sofía Arce', '2026-11-20', 'Grievance outcomes are not consistently documented.', 'Implement case management workflow.'],
  ],
  'alimentos-pacifico': [
    ['AF-01', 'Supplier ESG data not verified', 'Medium', 'Open', 'Procurement', '2026-12-10', 'Supplier questionnaire responses are self-declared without sample verification.', 'Verify a risk-based sample of 20 suppliers.'],
    ['AF-02', 'Water discharge sampling frequency', 'Low', 'Closed', 'Environment Manager', '2026-07-15', 'Sampling was quarterly instead of monthly for one parameter.', 'Sampling schedule corrected.'],
    ['AF-03', 'Allergen changeover records complete', 'Low', 'Closed', 'Quality Director', '2026-06-20', 'Two changeover records were missing supervisor sign-off.', 'Digital sign-off implemented.'],
  ],
  'financia-andina': [
    ['AF-01', 'Financed emissions data quality for SMEs', 'High', 'Open', 'Climate Risk', '2026-12-20', 'Estimated data represents 62% of SME exposure without confidence disclosure.', 'Disclose data quality and engage top 50 borrowers.'],
    ['AF-02', 'Climate risk appetite not board approved', 'High', 'In progress', 'Board Chair', '2026-11-30', 'Climate risk limits are operational but not formally approved.', 'Approve risk appetite statement at next board meeting.'],
    ['AF-03', 'Nature risk screening coverage', 'Medium', 'Open', 'Risk Director', '2027-03-31', 'Only 38% of high-risk sectors screened for nature dependencies.', 'Extend geospatial screening to full portfolio.'],
  ],
  'novatech-digital': [
    ['AF-01', 'AI impact assessments incomplete', 'High', 'Open', 'Chief AI Officer', '2026-12-31', 'Three customer-facing AI products lack documented impact assessments.', 'Complete assessments and human-oversight review.'],
    ['AF-02', 'Supplier audit corrective actions overdue', 'Medium', 'In progress', 'Supply Chain', '2026-11-30', 'Two corrective actions at a contract manufacturer are overdue.', 'Escalate to supplier executive sponsor.'],
    ['AF-03', 'Water withdrawal data verified', 'Low', 'Closed', 'Facilities', '2026-08-30', 'Meter calibration completed.', 'No further action.'],
  ],
  'textiles-sur': [
    ['AF-01', 'Forced-labour indicators at subcontractors', 'Critical', 'Open', 'HR Director', '2026-11-15', 'Recruitment fees and document retention identified at two subcontractors.', 'Suspend suppliers, reimburse fees and provide remedy.'],
    ['AF-02', 'Effluent discharge exceeds permit limits', 'Critical', 'Open', 'COO', '2026-11-01', 'COD and colour exceed permit limits during bypass events.', 'Stop bypass, upgrade treatment and notify regulator.'],
    ['AF-03', 'Supplier due-diligence coverage inadequate', 'High', 'Open', 'Procurement', '2026-12-31', 'Only 24% of subcontractors audited in 24 months.', 'Implement risk-based audit programme.'],
  ],
};
for (const c of companies) {
  for (const [idx, f] of findingTemplates[c.id].entries()) {
    insertFinding.run(`FND-${c.id}-${idx + 1}`, c.id, f[0], f[1], f[2], f[3], f[4], f[5], f[6], f[7]);
  }
}

const insertScenario = db.prepare('INSERT INTO climate_scenarios (id,company_id,name,source,horizon,warming,physical_risk,transition_risk,opportunity,capex,probability,description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
for (const [ci, c] of companies.entries()) {
  const base = [
    ['Orderly net zero', 'IEA NZE 2025 / NGFS Net Zero 2050', '2026–2050', '1.5°C', 2, 4, 4, 18 + ci * 3, 'Central', 'Rapid policy and technology transition; physical risk contained but transition costs front-loaded.'],
    ['Delayed transition', 'NGFS Delayed Transition', '2026–2040', '1.8°C', 3, 5, 2, 12 + ci * 2, 'Plausible', 'Late and abrupt policy action; higher carbon and compliance costs after 2030.'],
    ['Hot house', 'IPCC SSP5-8.5 / NGFS Hot House', '2026–2050', '>3°C', 5, 2, 1, 8 + ci, 'Downside', 'High physical hazard, chronic water and heat stress, and significant adaptation costs.'],
  ];
  for (const [si, s] of base.entries()) {
    insertScenario.run(`SCN-${c.id}-${si + 1}`, c.id, s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8], s[9]);
  }
}

const insertNature = db.prepare('INSERT INTO nature_locations (id,company_id,name,country,ecosystem,protected,water_stress,dependency,impact,risk,lat,lng) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
const ecosystems = ['High Andean wetland (bofedal)', 'Dry forest', 'Coastal marine reserve', 'Agricultural landscape', 'Urban river basin', 'Cloud forest', 'Semi-arid scrub'];
for (const [ci, c] of companies.entries()) {
  const fsList = facilities.filter((f) => f.company === c.id).slice(0, 3);
  for (const [fi, f] of fsList.entries()) {
    insertNature.run(`NAT-${c.id}-${fi + 1}`, c.id, f.name, f.country, ecosystems[(ci + fi) % ecosystems.length], f.protected, f.water, ['High', 'Medium', 'Low'][(ci + fi) % 3], ['High', 'Medium', 'Low'][(ci + fi + 1) % 3], ['High', 'Medium', 'Low'][(ci + fi + 2) % 3], f.lat, f.lng);
  }
}

const insertLog = db.prepare('INSERT INTO audit_logs (company_id,actor,role,action,entity,entity_id,detail,created_at,hash) VALUES (?,?,?,?,?,?,?,?,?)');
const actors = [
  ['Diego Salazar', 'Corporate ESG Director'], ['Mariana Quispe', 'Organization Owner'], ['Ana Torres', 'Auditor'],
  ['Luis Prado', 'Data Contributor'], ['Carla Ruiz', 'CFO / Financial Analyst'], ['Elena Chávez', 'Social & Human Rights Manager'],
];
const actions = [
  ['UPDATED', 'IRO', 'Impact score revised after technical review'],
  ['APPROVED', 'Assessment', 'Stage 7 direction review completed'],
  ['UPLOADED', 'Evidence', 'Monitoring report linked to KPI'],
  ['CREATED', 'Stakeholder', 'New community stakeholder registered'],
  ['COMMENTED', 'Disclosure', 'Data gap identified for ESRS datapoint'],
  ['GENERATED', 'Report', 'Draft report package generated from records'],
  ['LOGIN', 'Session', 'User authenticated with MFA'],
  ['EXPORTED', 'IRO Register', 'CSV export of material IROs'],
  ['UPDATED', 'KPI', 'Value corrected after evidence review'],
  ['REVIEWED', 'Control', 'Control test evidence reviewed'],
];
for (const [ci, c] of companies.entries()) {
  for (let l = 0; l < 10; l++) {
    const a = actors[(ci + l) % actors.length];
    const act = actions[(ci * 2 + l) % actions.length];
    const timestamp = new Date(Date.UTC(2026, 9, 30 - l, 9 + (l % 6), 12 + l, 0)).toISOString();
    insertLog.run(c.id, a[0], a[1], act[0], act[1], `${act[1]}-${c.id}-${l + 1}`, act[2], timestamp, `sha256:${(c.id + l + act[0]).padEnd(16, '0').slice(0, 16)}${'e5f6a7b8'.repeat(4)}`);
  }
}

for (const c of companies) {
  const matCount = db.prepare("SELECT COUNT(DISTINCT topic_code) AS n FROM iros WHERE company_id = ? AND materiality != 'not'").get(c.id).n;
  const critCount = db.prepare('SELECT COUNT(*) AS n FROM iros WHERE company_id = ? AND critical = 1').get(c.id).n;
  const coverage = db.prepare("SELECT ROUND(AVG(coverage)) AS n FROM disclosures WHERE company_id = ?").get(c.id).n;
  const targetProgress = db.prepare('SELECT ROUND(AVG(progress)) AS n FROM targets WHERE company_id = ?').get(c.id).n;
  db.prepare('UPDATE companies SET materiality_count=?, critical_iros=?, reporting_coverage=?, target_progress=? WHERE id=?').run(matCount, critCount, coverage, targetProgress, c.id);
}

const counts = {
  companies: db.prepare('SELECT COUNT(*) n FROM companies').get().n,
  iros: db.prepare('SELECT COUNT(*) n FROM iros').get().n,
  kpis: db.prepare('SELECT COUNT(*) n FROM kpis').get().n,
  disclosures: db.prepare('SELECT COUNT(*) n FROM disclosures').get().n,
  evidence: db.prepare('SELECT COUNT(*) n FROM evidence').get().n,
  auditLogs: db.prepare('SELECT COUNT(*) n FROM audit_logs').get().n,
};
console.log('Seeded ESG Intelligence Command Center');
console.log(counts);
console.log('IROs inserted:', iroCounter);
console.log('Company notes:', Object.keys(companyNotes).length);
db.close();
