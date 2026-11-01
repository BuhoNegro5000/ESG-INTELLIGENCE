PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'Portfolio',
  country TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  sector TEXT NOT NULL,
  subsector TEXT,
  country TEXT NOT NULL,
  city TEXT,
  employees INTEGER,
  revenue REAL,
  currency TEXT DEFAULT 'USD',
  founded INTEGER,
  maturity TEXT,
  description TEXT,
  purpose TEXT,
  strategy TEXT,
  ceo TEXT,
  cs_officer TEXT,
  website TEXT,
  accent TEXT,
  status TEXT DEFAULT 'Active',
  data_quality INTEGER DEFAULT 0,
  reporting_status TEXT DEFAULT 'Draft',
  assurance_status TEXT DEFAULT 'Not started',
  e_score REAL DEFAULT 0,
  s_score REAL DEFAULT 0,
  g_score REAL DEFAULT 0,
  climate_exposure INTEGER DEFAULT 0,
  nature_dependency INTEGER DEFAULT 0,
  financial_exposure INTEGER DEFAULT 0,
  transition_opportunity INTEGER DEFAULT 0,
  materiality_count INTEGER DEFAULT 0,
  critical_iros INTEGER DEFAULT 0,
  assessment_status TEXT DEFAULT 'Draft',
  assessment_progress INTEGER DEFAULT 0,
  reporting_coverage INTEGER DEFAULT 0,
  target_progress INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  type TEXT,
  lat REAL,
  lng REAL,
  employees INTEGER,
  water_stress TEXT,
  protected_area INTEGER DEFAULT 0,
  certification TEXT
);

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  period TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL,
  stage INTEGER NOT NULL DEFAULT 1,
  scope TEXT,
  methodology TEXT,
  threshold_impact REAL DEFAULT 3.2,
  threshold_financial REAL DEFAULT 3.2,
  created_at TEXT NOT NULL,
  approved_at TEXT,
  progress INTEGER DEFAULT 0,
  owner TEXT,
  reviewer TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS topics (
  code TEXT PRIMARY KEY,
  dimension TEXT NOT NULL,
  name TEXT NOT NULL,
  subtopic TEXT,
  esrs TEXT,
  gri TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS iros (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  assessment_id TEXT REFERENCES assessments(id) ON DELETE SET NULL,
  topic_code TEXT REFERENCES topics(code),
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  nature TEXT,
  actuality TEXT,
  stage TEXT,
  activity TEXT,
  location TEXT,
  stakeholder TEXT,
  rights TEXT,
  horizon TEXT,
  description TEXT,
  cause TEXT,
  consequence TEXT,
  evidence TEXT,
  owner TEXT,
  status TEXT DEFAULT 'Evaluated',
  scale INTEGER,
  scope INTEGER,
  irremediability INTEGER,
  likelihood INTEGER,
  severity REAL,
  impact_score REAL,
  financial_likelihood INTEGER,
  financial_magnitude INTEGER,
  financial_score REAL,
  materiality TEXT,
  critical INTEGER DEFAULT 0,
  financial_effect TEXT,
  controls TEXT,
  inherent REAL,
  residual REAL,
  investment REAL,
  benefit REAL,
  confidence TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kpis (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  dimension TEXT NOT NULL,
  category TEXT,
  unit TEXT,
  value REAL,
  previous_value REAL,
  baseline REAL,
  target REAL,
  direction TEXT DEFAULT 'lower',
  quality INTEGER DEFAULT 0,
  source TEXT,
  owner TEXT,
  framework TEXT,
  status TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kpi_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kpi_id TEXT NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  value REAL NOT NULL,
  target REAL,
  UNIQUE(kpi_id, period)
);

CREATE TABLE IF NOT EXISTS stakeholders (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  relation TEXT,
  influence INTEGER,
  exposure INTEGER,
  vulnerability INTEGER,
  location TEXT,
  interests TEXT,
  rights TEXT,
  channels TEXT,
  last_engagement TEXT
);

CREATE TABLE IF NOT EXISTS engagements (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stakeholder_id TEXT REFERENCES stakeholders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT,
  date TEXT,
  status TEXT,
  participants INTEGER,
  commitments TEXT,
  evidence TEXT
);

CREATE TABLE IF NOT EXISTS grievances (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stakeholder TEXT,
  category TEXT,
  severity TEXT,
  status TEXT,
  opened TEXT,
  resolved TEXT,
  description TEXT,
  remediation TEXT
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  country TEXT,
  sector TEXT,
  risk TEXT,
  spend REAL,
  assessment INTEGER,
  audit TEXT,
  certifications TEXT,
  incidents INTEGER,
  traceability INTEGER,
  status TEXT
);

CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  version TEXT,
  owner TEXT,
  approved TEXT,
  effective TEXT,
  review TEXT,
  status TEXT,
  scope TEXT
);

CREATE TABLE IF NOT EXISTS disclosures (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  framework TEXT NOT NULL,
  version TEXT,
  requirement TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT,
  coverage INTEGER,
  owner TEXT,
  evidence TEXT,
  data_points TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS framework_requirements (
  id TEXT PRIMARY KEY,
  framework TEXT NOT NULL,
  version TEXT,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  instrument_type TEXT,
  category TEXT,
  description TEXT,
  effective TEXT
);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  linked_to TEXT,
  owner TEXT,
  date TEXT,
  status TEXT,
  size TEXT,
  hash TEXT
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT,
  framework TEXT,
  period TEXT,
  status TEXT,
  coverage INTEGER,
  generated_at TEXT,
  pages INTEGER
);

CREATE TABLE IF NOT EXISTS controls (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  risk TEXT,
  owner TEXT,
  frequency TEXT,
  evidence_required TEXT,
  test_result TEXT,
  deficiencies INTEGER,
  status TEXT
);

CREATE TABLE IF NOT EXISTS audit_findings (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  severity TEXT,
  status TEXT,
  owner TEXT,
  due_date TEXT,
  finding TEXT,
  action TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id TEXT,
  actor TEXT NOT NULL,
  role TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  detail TEXT,
  created_at TEXT NOT NULL,
  hash TEXT
);

CREATE TABLE IF NOT EXISTS climate_scenarios (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source TEXT,
  horizon TEXT,
  warming TEXT,
  physical_risk INTEGER,
  transition_risk INTEGER,
  opportunity INTEGER,
  capex REAL,
  probability TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS nature_locations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  country TEXT,
  ecosystem TEXT,
  protected INTEGER,
  water_stress TEXT,
  dependency TEXT,
  impact TEXT,
  risk TEXT,
  lat REAL,
  lng REAL
);

CREATE TABLE IF NOT EXISTS targets (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT,
  baseline REAL,
  target REAL,
  current REAL,
  unit TEXT,
  deadline TEXT,
  progress INTEGER,
  status TEXT,
  owner TEXT
);

CREATE TABLE IF NOT EXISTS ai_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id TEXT,
  agent TEXT,
  prompt TEXT,
  response TEXT,
  sources TEXT,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_iros_company ON iros(company_id);
CREATE INDEX IF NOT EXISTS idx_iros_assessment ON iros(assessment_id);
CREATE INDEX IF NOT EXISTS idx_kpis_company ON kpis(company_id);
CREATE INDEX IF NOT EXISTS idx_history_kpi ON kpi_history(kpi_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_company ON stakeholders(company_id);
CREATE INDEX IF NOT EXISTS idx_disclosures_company ON disclosures(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_company ON audit_logs(company_id);
