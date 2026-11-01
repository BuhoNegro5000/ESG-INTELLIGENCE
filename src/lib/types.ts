export type Dimension = 'E' | 'S' | 'G';
export type MaterialityClass = 'both' | 'impact' | 'financial' | 'not';

export interface Organization {
  id: string;
  name: string;
  kind: string;
  country: string;
  createdAt: string;
}

export interface Company {
  id: string;
  organizationId: string;
  organizationName?: string;
  name: string;
  shortName: string;
  sector: string;
  subsector: string;
  country: string;
  city: string;
  employees: number;
  revenue: number;
  currency: string;
  founded: number;
  maturity: string;
  description: string;
  purpose: string;
  strategy: string;
  ceo: string;
  csOfficer: string;
  website: string;
  accent: string;
  status: string;
  dataQuality: number;
  reportingStatus: string;
  assuranceStatus: string;
  eScore: number;
  sScore: number;
  gScore: number;
  climateExposure: number;
  natureDependency: number;
  financialExposure: number;
  transitionOpportunity: number;
  materialityCount: number;
  criticalIros: number;
  assessmentStatus: string;
  assessmentProgress: number;
  reportingCoverage: number;
  targetProgress: number;
  updatedAt: string;
}

export interface Facility {
  id: string;
  companyId: string;
  name: string;
  country: string;
  region: string;
  type: string;
  lat: number;
  lng: number;
  employees: number;
  waterStress: string;
  protectedArea: number;
  certification: string;
}

export interface Assessment {
  id: string;
  companyId: string;
  title: string;
  period: string;
  version: string;
  status: string;
  stage: number;
  scope: string;
  methodology: string;
  thresholdImpact: number;
  thresholdFinancial: number;
  createdAt: string;
  approvedAt: string | null;
  progress: number;
  owner: string;
  reviewer: string;
  notes: string;
}

export interface Topic {
  code: string;
  dimension: Dimension;
  name: string;
  subtopic: string;
  esrs: string;
  gri: string;
  description: string;
}

export interface IRO {
  id: string;
  companyId: string;
  assessmentId: string | null;
  topicCode: string;
  code: string;
  title: string;
  type: 'Impact' | 'Risk' | 'Opportunity' | string;
  nature: 'Positive' | 'Negative' | string | null;
  actuality: 'Actual' | 'Potential' | string | null;
  stage: string | null;
  activity: string | null;
  location: string | null;
  stakeholder: string | null;
  rights: string | null;
  horizon: string | null;
  description: string;
  cause: string;
  consequence: string;
  evidence: string;
  owner: string;
  status: string;
  scale: number | null;
  scope: number | null;
  irremediability: number | null;
  likelihood: number | null;
  severity: number | null;
  impactScore: number;
  financialLikelihood: number | null;
  financialMagnitude: number | null;
  financialScore: number;
  materiality: MaterialityClass;
  critical: number;
  financialEffect: string | null;
  controls: string | null;
  inherent: number | null;
  residual: number | null;
  investment: number | null;
  benefit: number | null;
  confidence: string | null;
  updatedAt: string;
  topicName?: string;
  dimension?: Dimension;
  esrs?: string;
}

export interface KPI {
  id: string;
  companyId: string;
  code: string;
  name: string;
  dimension: Dimension;
  category: string;
  unit: string;
  value: number;
  previousValue: number;
  baseline: number;
  target: number;
  direction: 'lower' | 'higher';
  quality: number;
  source: string;
  owner: string;
  framework: string;
  status: string;
  updatedAt: string;
  history: KPIHistory[];
  progress?: number;
}

export interface KPIHistory {
  period: string;
  value: number;
  target: number;
}

export interface Stakeholder {
  id: string;
  companyId: string;
  name: string;
  category: string;
  relation: string;
  influence: number;
  exposure: number;
  vulnerability: number;
  location: string;
  interests: string;
  rights: string;
  channels: string;
  lastEngagement: string;
}

export interface Engagement {
  id: string;
  companyId: string;
  stakeholderId: string;
  stakeholderName?: string;
  title: string;
  type: string;
  date: string;
  status: string;
  participants: number;
  commitments: string;
  evidence: string;
}

export interface Grievance {
  id: string;
  companyId: string;
  stakeholder: string;
  category: string;
  severity: string;
  status: string;
  opened: string;
  resolved: string | null;
  description: string;
  remediation: string;
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  country: string;
  sector: string;
  risk: string;
  spend: number;
  assessment: number;
  audit: string;
  certifications: string;
  incidents: number;
  traceability: number;
  status: string;
}

export interface Policy {
  id: string;
  companyId: string;
  code: string;
  title: string;
  version: string;
  owner: string;
  approved: string;
  effective: string;
  review: string;
  status: string;
  scope: string;
}

export interface Disclosure {
  id: string;
  companyId: string;
  framework: string;
  version: string;
  requirement: string;
  title: string;
  status: string;
  coverage: number;
  owner: string;
  evidence: string;
  dataPoints: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  companyId: string;
  title: string;
  type: string;
  framework: string;
  period: string;
  status: string;
  coverage: number;
  generatedAt: string;
  pages: number;
}

export interface Evidence {
  id: string;
  companyId: string;
  name: string;
  type: string;
  linkedTo: string;
  owner: string;
  date: string;
  status: string;
  size: string;
  hash: string;
}

export interface Control {
  id: string;
  companyId: string;
  code: string;
  title: string;
  risk: string;
  owner: string;
  frequency: string;
  evidenceRequired: string;
  testResult: string;
  deficiencies: number;
  status: string;
}

export interface Finding {
  id: string;
  companyId: string;
  code: string;
  title: string;
  severity: string;
  status: string;
  owner: string;
  dueDate: string;
  finding: string;
  action: string;
}

export interface AuditLog {
  id: number;
  companyId: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  detail: string;
  createdAt: string;
  hash: string;
}

export interface ClimateScenario {
  id: string;
  companyId: string;
  name: string;
  source: string;
  horizon: string;
  warming: string;
  physicalRisk: number;
  transitionRisk: number;
  opportunity: number;
  capex: number;
  probability: string;
  description: string;
}

export interface NatureLocation {
  id: string;
  companyId: string;
  name: string;
  country: string;
  ecosystem: string;
  protected: number;
  waterStress: string;
  dependency: string;
  impact: string;
  risk: string;
  lat: number;
  lng: number;
}

export interface Target {
  id: string;
  companyId: string;
  title: string;
  topic: string;
  baseline: number;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  progress: number;
  status: string;
  owner: string;
}

export interface Requirement {
  id: string;
  framework: string;
  version: string;
  code: string;
  title: string;
  instrumentType: string;
  category: string;
  description: string;
  effective: string;
}

export interface MaterialityTopic {
  code: string;
  name: string;
  dimension: Dimension;
  esrs: string;
  impact: number;
  financial: number;
  materiality: MaterialityClass;
  critical: number;
  count: number;
  iros: string[];
}

export interface FrameworkCoverage {
  framework: string;
  coverage: number;
  complete: number;
  partial: number;
  gap: number;
  total: number;
}

export interface Workspace {
  company: Company;
  organization: Organization | null;
  facilities: Facility[];
  assessment: Assessment | null;
  assessments: Assessment[];
  topics: Topic[];
  iros: IRO[];
  materialityTopics: MaterialityTopic[];
  materialityDistribution: Record<MaterialityClass, number>;
  kpis: KPI[];
  stakeholders: Stakeholder[];
  engagements: Engagement[];
  grievances: Grievance[];
  suppliers: Supplier[];
  policies: Policy[];
  disclosures: Disclosure[];
  reports: Report[];
  evidence: Evidence[];
  controls: Control[];
  findings: Finding[];
  auditLogs: AuditLog[];
  climateScenarios: ClimateScenario[];
  natureLocations: NatureLocation[];
  targets: Target[];
  requirements: Requirement[];
  frameworkCoverage: FrameworkCoverage[];
  valueChainExposure: { stage: string; impact: number; financial: number; count: number }[];
  riskHeatmap: { likelihood: number; impact: number; count: number; residual: number }[];
  dataQuality: {
    overall: number;
    completeness: number;
    accuracy: number;
    consistency: number;
    timeliness: number;
    traceability: number;
    comparability: number;
    coverage: number;
  };
}

export interface Portfolio {
  organizations: Organization[];
  companies: Company[];
  summary: {
    companies: number;
    materialTopics: number;
    criticalIros: number;
    dataQuality: number;
    reportingCoverage: number;
    targetProgress: number;
    openGrievances: number;
    totalRevenue: number;
    totalEmployees: number;
    publishedReports: number;
  };
  sectors: { sector: string; count: number; revenue: number }[];
  countries: { country: string; count: number }[];
  materialityDistribution: Record<MaterialityClass, number>;
  topRisks: IRO[];
  frameworkCoverage: FrameworkCoverage[];
  updatedAt: string;
}

export interface SearchResult {
  type: 'company' | 'iro' | 'stakeholder' | 'supplier' | 'disclosure';
  id: string;
  title: string;
  subtitle: string;
  companyId: string;
}

export interface AIResponse {
  answer: string;
  sources: { label: string; value: string }[];
  confidence: 'High' | 'Medium' | 'Low';
  classification: 'Grounded analysis' | 'Data interpretation' | 'Recommendation';
  agent: string;
  suggestedActions: string[];
}
