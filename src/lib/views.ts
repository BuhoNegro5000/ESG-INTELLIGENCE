export type ViewKey =
  | 'overview'
  | 'profile'
  | 'materiality'
  | 'iros'
  | 'performance'
  | 'climate'
  | 'social'
  | 'governance'
  | 'risks'
  | 'valuechain'
  | 'reporting'
  | 'assurance'
  | 'ai'
  | 'admin';

export const VIEW_META: Record<ViewKey, { label: string; subtitle: string }> = {
  overview: { label: 'Vista ejecutiva', subtitle: 'Centro de mando' },
  profile: { label: 'Perfil corporativo', subtitle: 'Expediente ESG' },
  materiality: { label: 'Doble materialidad', subtitle: 'Centro de evaluación' },
  iros: { label: 'Registro IRO', subtitle: 'Impactos, riesgos y oportunidades' },
  performance: { label: 'Desempeño ESG', subtitle: 'Indicadores y objetivos' },
  climate: { label: 'Clima y naturaleza', subtitle: 'Inteligencia climática y de naturaleza' },
  social: { label: 'Social y DDHH', subtitle: 'Personas y debida diligencia' },
  governance: { label: 'Gobernanza', subtitle: 'Ética, políticas y controles' },
  risks: { label: 'Riesgos y oportunidades', subtitle: 'Inteligencia de riesgos' },
  valuechain: { label: 'Cadena de valor', subtitle: 'Exposición de la cadena de valor' },
  reporting: { label: 'Divulgación', subtitle: 'Motor de divulgación' },
  assurance: { label: 'Aseguramiento', subtitle: 'Auditoría y evidencia' },
  ai: { label: 'Inteligencia ESG', subtitle: 'Agentes de inteligencia' },
  admin: { label: 'Administración', subtitle: 'Portafolio y sistema' },
};

export const NAV_GROUPS: { title: string; items: { key: ViewKey; icon: string; badge?: string }[] }[] = [
  {
    title: 'Inteligencia',
    items: [
      { key: 'overview', icon: 'LayoutDashboard' },
      { key: 'profile', icon: 'Building2' },
      { key: 'materiality', icon: 'Grid3X3' },
      { key: 'iros', icon: 'ListFilter' },
      { key: 'performance', icon: 'Activity' },
    ],
  },
  {
    title: 'Gestión responsable',
    items: [
      { key: 'climate', icon: 'Leaf' },
      { key: 'social', icon: 'Users' },
      { key: 'governance', icon: 'Scale' },
      { key: 'risks', icon: 'ShieldAlert' },
      { key: 'valuechain', icon: 'Network' },
    ],
  },
  {
    title: 'Divulgación',
    items: [
      { key: 'reporting', icon: 'FileText' },
      { key: 'assurance', icon: 'BadgeCheck' },
      { key: 'ai', icon: 'Sparkles' },
    ],
  },
  {
    title: 'Sistema',
    items: [{ key: 'admin', icon: 'Settings2' }],
  },
];
