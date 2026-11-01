'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { clsx } from 'clsx';
import {
  Activity, AlertTriangle, ArrowRight, BadgeCheck, Bell, Building2, Check, ChevronDown, ChevronLeft,
  ChevronRight, CircleDot, Compass, Database, FileCheck2, FileText, Filter, Gauge, Globe2, Grid3X3,
  HelpCircle, LayoutDashboard, Leaf, ListFilter, Loader2, Menu, Moon, Network, Plus, Printer, Scale, Search,
  Settings2, ShieldAlert, ShieldCheck, Sparkles, Sun, Truck, Users, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NAV_GROUPS, VIEW_META, type ViewKey } from '@/lib/views';
import type {
  Assessment, Company, Disclosure, Evidence, FrameworkCoverage, IRO, KPI,
  MaterialityTopic, Portfolio, SearchResult, Target, Workspace,
} from '@/lib/types';
import { countLabel, dateLabel, fmt, initials, label, materialityLabel } from '@/lib/format';
import { materialityFrom } from '@/lib/materiality-rules';
import { Panel, Pill } from '@/components/ui';
import { prefersReducedMotion, useFocusTrap, usePresence } from '@/components/motion';
import type { AppActions } from '@/components/views/types';
import OverviewView from '@/components/views/overview';
import ProfileView from '@/components/views/profile';
import MaterialityView from '@/components/views/materiality';
import IROView from '@/components/views/iros';
import PerformanceView from '@/components/views/performance';
import ClimateNatureView from '@/components/views/climate';
import SocialView from '@/components/views/social';
import GovernanceView from '@/components/views/governance';
import RisksView from '@/components/views/risks';
import ValueChainView from '@/components/views/valuechain';
import ReportingView from '@/components/views/reporting';
import AssuranceView from '@/components/views/assurance';
import AIView from '@/components/views/ai';
import AdminView from '@/components/views/admin';
import Onboarding, { GuidedTour } from '@/components/onboarding';

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, Building2, Grid3X3, ListFilter, Activity, Leaf, Users, Scale, ShieldAlert,
  Network, FileText, BadgeCheck, Sparkles, Settings2,
};

const ROLES = [
  'Corporate ESG Director',
  'Sustainability Analyst',
  'CFO / Finance',
  'Legal & Compliance',
  'Internal Audit',
  'Data Contributor',
  'External Assurance',
];

type Theme = 'dark' | 'light';

interface Props {
  initialPortfolio: Portfolio;
  initialWorkspace: Workspace;
}

export default function CommandCenter({ initialPortfolio, initialWorkspace }: Props) {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const [portfolio] = useState<Portfolio>(initialPortfolio);
  const [view, setView] = useState<ViewKey>('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingSeen, setOnboardingSeen] = useState(true);
  const [theme, setTheme] = useState<Theme>('dark');
  const [role, setRole] = useState(ROLES[0]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedIro, setSelectedIro] = useState<IRO | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const skeletonMounted = usePresence(loadingWorkspace, 200);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [bellPulse, setBellPulse] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [navY, setNavY] = useState(0);
  const [navReady, setNavReady] = useState(false);
  const navScrollRef = useRef<HTMLDivElement>(null);
  const leavingRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message });
    toastTimer.current = setTimeout(() => setToast(null), 5200);
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // Theme preference is a UI setting only; ESG data always lives in SQLite.
  useEffect(() => {
    const stored = window.localStorage.getItem('gol-theme');
    if (stored === 'light' || stored === 'dark') setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('gol-theme', theme);
  }, [theme]);

  // Navigation width and the welcome guide are UI preferences only.
  useEffect(() => {
    if (window.localStorage.getItem('gol-sidebar-collapsed') === '1') setCollapsed(true);
  }, []);
  useEffect(() => {
    window.localStorage.setItem('gol-sidebar-collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    const seen = window.localStorage.getItem('gol-onboarding-v1') === '1';
    setOnboardingSeen(seen);
    if (seen) return;
    const timer = setTimeout(() => setOnboardingOpen(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const closeOnboarding = useCallback(() => {
    setOnboardingOpen(false);
    setOnboardingSeen(true);
    window.localStorage.setItem('gol-onboarding-v1', '1');
  }, []);

  // Hash navigation, including browser back/forward.
  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash in VIEW_META) setView(hash as ViewKey);
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    window.addEventListener('popstate', applyHash);
    return () => {
      window.removeEventListener('hashchange', applyHash);
      window.removeEventListener('popstate', applyHash);
    };
  }, []);

  const navigate = useCallback((next: ViewKey) => {
    setMobileOpen(false);
    setNotifOpen(false);
    const target = `#${next}`;
    if (window.location.hash !== target) window.history.pushState(null, '', target);
    if (next === view || leavingRef.current) {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      return;
    }
    if (prefersReducedMotion()) {
      setView(next);
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    leavingRef.current = true;
    setLeaving(true);
    window.setTimeout(() => {
      setView(next);
      setLeaving(false);
      leavingRef.current = false;
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 120);
  }, [view]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSelectedIro(null);
        setCreateOpen(false);
        setReportOpen(false);
        setNotifOpen(false);
        setTourOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The gold indicator glides between navigation items (transform only).
  useEffect(() => {
    const measure = () => {
      const container = navScrollRef.current;
      if (!container) return;
      const active = container.querySelector<HTMLElement>('.nav-item.active');
      if (!active) return;
      const cRect = container.getBoundingClientRect();
      const aRect = active.getBoundingClientRect();
      setNavY(aRect.top - cRect.top + container.scrollTop + (aRect.height - 34) / 2);
      setNavReady(true);
    };
    measure();
    const timer = window.setTimeout(measure, 80);
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [view, collapsed]);

  // A new workspace means new alerts: sway the bell once.
  useEffect(() => {
    setBellPulse(true);
    const timer = window.setTimeout(() => setBellPulse(false), 1300);
    return () => window.clearTimeout(timer);
  }, [workspace.company.id]);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/workspace/${workspace.company.id}`, { cache: 'no-store' });
    if (res.ok) setWorkspace((await res.json()) as Workspace);
  }, [workspace.company.id]);

  const selectCompany = useCallback(async (companyId: string) => {
    if (!companyId || companyId === workspace.company.id) return;
    setLoadingWorkspace(true);
    setSelectedIro(null);
    try {
      const res = await fetch(`/api/workspace/${companyId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('No se pudo cargar el espacio de trabajo');
      const data = (await res.json()) as Workspace;
      setWorkspace(data);
      notify(`Espacio de trabajo actualizado: ${data.company.name}.`);
    } catch {
      notify('No se pudo cargar la empresa seleccionada.');
    } finally {
      setLoadingWorkspace(false);
    }
  }, [workspace.company.id, notify]);

  const openIRO = useCallback((iro: IRO) => setSelectedIro(iro), []);

  const actions: AppActions = useMemo(() => ({
    navigate,
    openIRO,
    createIRO: () => setCreateOpen(true),
    openReport: () => setReportOpen(true),
    selectCompany,
    refresh,
    notify,
  }), [navigate, openIRO, selectCompany, refresh, notify]);

  async function pickSearch(result: SearchResult) {
    setSearchOpen(false);
    let target = workspace;
    if (result.companyId && result.companyId !== workspace.company.id) {
      try {
        const res = await fetch(`/api/workspace/${result.companyId}`, { cache: 'no-store' });
        if (res.ok) {
          target = (await res.json()) as Workspace;
          setWorkspace(target);
        }
      } catch {
        // Fall back to the current workspace navigation.
      }
    }
    if (result.type === 'company') { navigate('overview'); return; }
    if (result.type === 'iro') {
      const iro = target.iros.find((i) => i.code === result.id || i.id === result.id);
      if (iro) { setSelectedIro(iro); return; }
      navigate('iros');
      return;
    }
    if (result.type === 'stakeholder') { navigate('social'); return; }
    if (result.type === 'supplier') { navigate('valuechain'); return; }
    if (result.type === 'disclosure') { navigate('reporting'); return; }
  }

  function handleIroSaved(updated: IRO) {
    setSelectedIro(updated);
    void refresh();
    notify(`IRO ${updated.code} actualizado. El cambio quedó en el audit trail.`);
  }

  function renderView() {
    const props = { workspace, portfolio, actions };
    switch (view) {
      case 'overview': return <OverviewView {...props} />;
      case 'profile': return <ProfileView {...props} />;
      case 'materiality': return <MaterialityView {...props} />;
      case 'iros': return <IROView {...props} />;
      case 'performance': return <PerformanceView {...props} />;
      case 'climate': return <ClimateNatureView {...props} />;
      case 'social': return <SocialView {...props} />;
      case 'governance': return <GovernanceView {...props} />;
      case 'risks': return <RisksView {...props} />;
      case 'valuechain': return <ValueChainView {...props} />;
      case 'reporting': return <ReportingView {...props} />;
      case 'assurance': return <AssuranceView {...props} />;
      case 'ai': return <AIView {...props} />;
      case 'admin': return <AdminView {...props} />;
      default: return <OverviewView {...props} />;
    }
  }

  const criticalCount = workspace.iros.filter((i) => i.critical).length;
  const gapCount = workspace.disclosures.filter((d) => d.status === 'Gap' || d.status === 'Not started').length;
  const alerts = [
    ...workspace.iros.filter((i) => i.critical).slice(0, 3).map((i) => ({
      id: `iro-${i.id}`, title: `IRO ${i.code} · ${label(i.type)}`, text: i.title, view: 'iros' as ViewKey,
    })),
    ...workspace.findings.filter((f) => f.severity === 'Critical' || f.severity === 'High').slice(0, 2).map((f) => ({
      id: `finding-${f.id}`, title: `Hallazgo ${f.code} · ${label(f.severity)}`, text: f.title, view: 'assurance' as ViewKey,
    })),
    ...workspace.disclosures.filter((d) => d.status === 'Gap').slice(0, 2).map((d) => ({
      id: `disclosure-${d.id}`, title: `Brecha · ${d.framework}`, text: d.title, view: 'reporting' as ViewKey,
    })),
  ].slice(0, 6);

  return (
    <div className={clsx('app-shell', collapsed && 'collapsed')}>
      <aside className={clsx('sidebar', collapsed && 'collapsed', mobileOpen && 'mobile-open')}>
        <div className="sidebar-head">
          <div className="brand-mark"><img src="/green-owl-mark.png" alt="Green Owl Labs" /></div>
          <div className="brand-copy">
            <div className="brand-name">Green Owl Labs</div>
            <div className="brand-sub">ESG Intelligence</div>
          </div>
          <button
            className="collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Expandir navegación' : 'Contraer navegación'}
            aria-label={collapsed ? 'Expandir navegación' : 'Contraer navegación'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <div className="sidebar-scroll" ref={navScrollRef}>
          {navReady && <span className="nav-indicator" aria-hidden style={{ '--nav-y': `${navY}px` } as CSSProperties} />}
          {NAV_GROUPS.map((group) => (
            <div className="nav-section" key={group.title}>
              <div className="nav-section-title">{group.title}</div>
              {group.items.map((item) => {
                const Icon = ICONS[item.icon] || CircleDot;
                const badge = item.key === 'iros' ? criticalCount : item.key === 'reporting' ? gapCount : 0;
                return (
                  <button
                    key={item.key}
                    className={clsx('nav-item', view === item.key && 'active')}
                    onClick={() => navigate(item.key)}
                    title={VIEW_META[item.key].label}
                  >
                    <Icon />
                    <span className="nav-label">{VIEW_META[item.key].label}</span>
                    {badge > 0 && <span className="nav-badge">{badge}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="sidebar-foot">
          <div className="avatar">{initials('Ricardo Mendoza')}</div>
          <div className="sidebar-foot-copy">
            <div className="sidebar-foot-name">Ricardo Mendoza</div>
            <div className="sidebar-foot-role">{label(role)}</div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn mobile-menu" onClick={() => setMobileOpen((o) => !o)} aria-label="Abrir navegación"><Menu size={16} /></button>
            <div className={clsx('company-switcher', loadingWorkspace && 'is-loading')}>
              <div className="company-monogram">{workspace.company.shortName.slice(0, 2).toUpperCase()}</div>
              <select value={workspace.company.id} onChange={(e) => void selectCompany(e.target.value)} aria-label="Seleccionar empresa">
                {portfolio.companies.map((c) => <option key={c.id} value={c.id}>{c.shortName}</option>)}
              </select>
              <ChevronDown size={13} className="chev" />
              {loadingWorkspace && <span className="skeleton switcher-skeleton" aria-hidden />}
            </div>
            <div className="topbar-context">
              <span className="context-dot" />
              Período {workspace.assessment?.period || 'FY2026'}
            </div>
          </div>

          <div className="topbar-right">
            <button className="search-trigger" onClick={() => setSearchOpen(true)}>
              <Search size={14} />
              <span>Buscar en el portafolio</span>
              <span className="kbd">Ctrl K</span>
            </button>
            <button
              className={clsx('icon-btn', 'guide-btn', !onboardingSeen && 'attention')}
              onClick={() => setOnboardingOpen(true)}
              title="Guía de uso"
              aria-label="Abrir guía de uso"
            >
              <HelpCircle size={15} />
            </button>
            <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Cambiar tema">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              className={clsx('icon-btn', bellPulse && 'bell-sway')}
              onClick={() => setNotifOpen((o) => !o)}
              title="Alertas de gestión"
              aria-label={`Notificaciones: ${alerts.length} alertas`}
              aria-haspopup="dialog"
              aria-expanded={notifOpen}
            >
              <Bell size={15} />
              {alerts.length > 0 && <span className="notification-dot" />}
            </button>
            <label className="role-pill">
              <ShieldCheck size={13} />
              <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Rol activo">
                {ROLES.map((r) => <option key={r} value={r}>{label(r)}</option>)}
              </select>
            </label>
            <div className="avatar" style={{ width: 34, height: 34 }}>{initials('Ricardo Mendoza')}</div>
          </div>
        </header>

        <main className="content">
          <div className="row" style={{ marginBottom: 12, gap: 8 }}>
            <span className="micro">{VIEW_META[view].subtitle}</span>
            <span className="dot-sep" />
            <span className="micro">{workspace.company.name} · {workspace.company.sector}</span>
            <span className="spacer" />
            <Pill variant="gray" dot={false}>Evaluación {workspace.assessment?.progress ?? 0}%</Pill>
          </div>
          <div key={view} className={clsx('view-enter', leaving && 'view-exit')}>{renderView()}</div>
          {skeletonMounted && (
            <div className={clsx('workspace-skeleton', !loadingWorkspace && 'is-leaving')} aria-busy={loadingWorkspace} aria-hidden={!loadingWorkspace}>
              <div className="stack" style={{ gap: 14 }}>
                <div className="skeleton" style={{ height: 160, borderRadius: 20 }} />
                <div className="grid grid-4">
                  {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 108 }} />)}
                </div>
                <div className="skeleton" style={{ height: 320 }} />
              </div>
            </div>
          )}
        </main>
      </div>

      {mobileOpen && <div className="overlay" style={{ zIndex: 28 }} onClick={() => setMobileOpen(false)} />}

      {onboardingOpen && <Onboarding onClose={closeOnboarding} onNavigate={navigate} />}
      {searchOpen && <SearchModal companyCount={portfolio.companies.length} onClose={() => setSearchOpen(false)} onPick={(r) => void pickSearch(r)} />}
      {selectedIro && <IRODrawer key={selectedIro.id} iro={selectedIro} onClose={() => setSelectedIro(null)} onSaved={handleIroSaved} notify={notify} />}
      {createOpen && <CreateIROModal workspace={workspace} onClose={() => setCreateOpen(false)} onCreated={(iro) => { setCreateOpen(false); void refresh(); setSelectedIro(iro); notify(`IRO ${iro.code} creado en estado Draft.`); }} notify={notify} />}
      {reportOpen && <ReportModal companyId={workspace.company.id} onClose={() => setReportOpen(false)} notify={notify} />}

      {notifOpen && (
        <div className="notif-panel" role="dialog" aria-label="Alertas de gestión">
          <div className="notif-head">
            <Bell size={14} /> Alertas de gestión
            <span className="micro" style={{ marginLeft: 'auto' }}>{countLabel(alerts.length, 'alerta', 'alertas')}</span>
          </div>
          {alerts.length === 0 && <div className="search-empty">No hay alertas abiertas en este espacio de trabajo.</div>}
          {alerts.map((alert) => (
            <button key={alert.id} type="button" className="notif-item" onClick={() => navigate(alert.view)}>
              <span className="notif-dot" aria-hidden />
              <span className="notif-body">
                <strong>{alert.title}</strong>
                <span>{alert.text}</span>
              </span>
              <ArrowRight size={13} style={{ marginLeft: 'auto', flex: '0 0 13px', color: 'var(--muted)' }} />
            </button>
          ))}
        </div>
      )}

      {tourOpen && <GuidedTour onClose={() => setTourOpen(false)} onNavigate={navigate} currentView={view} />}

      <button className="help-fab" onClick={() => setTourOpen(true)} aria-label="Iniciar tour guiado por la interfaz" aria-haspopup="dialog">
        <Compass size={15} />
        <span>Guía de uso</span>
      </button>

      {toast && (
        <div className="toast" key={toast.id}>
          <Check size={14} />
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} aria-label="Cerrar"><X size={13} /></button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

function SearchModal({ companyCount, onClose, onPick }: { companyCount: number; onClose: () => void; onPick: (result: SearchResult) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!cancelled) setResults((data.results || []) as SearchResult[]);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [q]);

  const iconFor = (type: SearchResult['type']): LucideIcon =>
    type === 'company' ? Building2 : type === 'iro' ? ListFilter : type === 'stakeholder' ? Users : type === 'supplier' ? Truck : FileText;
  const TYPE_LABEL: Record<SearchResult['type'], string> = {
    company: 'empresa',
    iro: 'IRO',
    stakeholder: 'grupo de interés',
    supplier: 'proveedor',
    disclosure: 'divulgación',
  };

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Buscar en el portafolio">
        <div className="search-input-row">
          <Search size={16} className="muted" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar empresa, IRO, grupo de interés, proveedor o divulgación…" />
          {loading && <Loader2 size={15} className="spin muted" />}
          <button className="btn sm ghost" onClick={onClose}>Esc</button>
        </div>
        <div className="search-results">
          {!q.trim() && (
            <div className="search-empty">
              Busca en las {companyCount} empresas del portafolio. Los resultados de IRO abren la ficha con evidencia y evaluación.
            </div>
          )}
          {q.trim() && !loading && results.length === 0 && <div className="search-empty">Sin resultados para “{q}”.</div>}
          {results.map((r, index) => {
            const Icon = iconFor(r.type);
            return (
              <div key={`${label(r.type)}-${r.id}-${r.companyId}`} className="search-result" style={{ '--i': index } as CSSProperties} onClick={() => onPick(r)}>
                <div className="search-result-icon"><Icon size={13} /></div>
                <div style={{ minWidth: 0 }}>
                  <div className="search-result-title">{r.title}</div>
                  <div className="search-result-sub">{r.subtitle} · {TYPE_LABEL[r.type] || r.type}</div>
                </div>
                <ArrowRight size={13} className="muted" style={{ marginLeft: 'auto' }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* IRO drawer                                                          */
/* ------------------------------------------------------------------ */

function IRODrawer({ iro, onClose, onSaved, notify }: { iro: IRO; onClose: () => void; onSaved: (iro: IRO) => void; notify: (m: string) => void }) {
  const [impact, setImpact] = useState(iro.impactScore);
  const [financial, setFinancial] = useState(iro.financialScore);
  const [status, setStatus] = useState(iro.status);
  const [owner, setOwner] = useState(iro.owner);
  const [saving, setSaving] = useState(false);
  const materiality = materialityFrom(impact, financial);
  const drawerRef = useFocusTrap<HTMLElement>(true, onClose);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/iros/${encodeURIComponent(iro.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ impactScore: impact, financialScore: financial, status, owner }),
      });
      if (!res.ok) throw new Error('No se pudo guardar el IRO');
      const updated = (await res.json()) as IRO;
      onSaved(updated);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Error al guardar el IRO');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="drawer" ref={drawerRef} role="dialog" aria-modal="true" aria-label={`IRO ${iro.code}`} tabIndex={-1}>
        <div className="drawer-head">
          <div style={{ flex: 1 }}>
            <div className="row" style={{ gap: 6 }}>
              <span className="mono">{iro.code}</span>
              <Pill variant={iro.type === 'Impact' ? 'red' : iro.type === 'Risk' ? 'amber' : 'green'}>{label(iro.type)}</Pill>
              {iro.critical ? <Pill variant="red">Crítico</Pill> : null}
            </div>
            <h3 style={{ marginTop: 7, fontSize: 16, lineHeight: 1.3 }}>{iro.title}</h3>
            <div className="micro" style={{ marginTop: 5 }}>{iro.topicName} · {iro.esrs} · {iro.location || 'sin ubicación'}</div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={15} /></button>
        </div>

        <div className="drawer-body">
          <div className="callout" style={{ marginBottom: 12 }}>
            <ShieldCheck size={15} />
            <div><strong>Evaluación en dos ejes.</strong> Impacto y exposición financiera son independientes. Modificar un eje no compensa el otro.</div>
          </div>

          <div className="grid grid-2" style={{ gap: 10 }}>
            <div className="mini-card">
              <div className="row"><div className="label">Materialidad de impacto</div><span className="micro" style={{ marginLeft: 'auto' }}>{impact.toFixed(1)}/5</span></div>
              <input className="range" type="range" min={0} max={5} step={0.1} value={impact} onChange={(e) => setImpact(Number(e.target.value))} />
              <div className="hint">Umbral 3,2 · escala, alcance e irremediabilidad</div>
            </div>
            <div className="mini-card">
              <div className="row"><div className="label">Materialidad financiera</div><span className="micro" style={{ marginLeft: 'auto' }}>{financial.toFixed(1)}/5</span></div>
              <input className="range" type="range" min={0} max={5} step={0.1} value={financial} onChange={(e) => setFinancial(Number(e.target.value))} />
              <div className="hint">Umbral 3,2 · probabilidad y magnitud</div>
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <Pill variant={materiality === 'both' ? 'amber' : materiality === 'impact' ? 'red' : materiality === 'financial' ? 'blue' : 'gray'}>{materialityLabel(materiality)}</Pill>
            <span className="micro" style={{ marginLeft: 'auto' }}>Vista previa de clasificación con los valores editados</span>
          </div>

          <div className="divider" />
          <div className="form-grid">
            <div className="field">
              <label>Estado</label>
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                {['Draft', 'In review', 'Approved', 'Rejected'].map((s) => <option key={s} value={s}>{label(s)}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Responsable</label>
              <input className="input" value={owner} onChange={(e) => setOwner(e.target.value)} />
            </div>
          </div>

          <div className="divider" />
          <div className="micro">Descripción</div>
          <p style={{ fontSize: 11, marginTop: 4, color: 'var(--text-2)', lineHeight: 1.55 }}>{iro.description}</p>

          <div className="grid grid-2" style={{ gap: 10, marginTop: 12 }}>
            <div className="mini-card"><div className="label">Causa</div><div style={{ fontSize: 10, marginTop: 4 }}>{iro.cause || '—'}</div></div>
            <div className="mini-card"><div className="label">Consecuencia</div><div style={{ fontSize: 10, marginTop: 4 }}>{iro.consequence || '—'}</div></div>
          </div>

          <div className="divider" />
          <dl className="info-list">
            <div className="info-row"><dt>Asunto</dt><dd>{iro.topicName} ({iro.topicCode})</dd></div>
            <div className="info-row"><dt>Naturaleza</dt><dd>{label(iro.nature)} · {label(iro.actuality)}</dd></div>
            <div className="info-row"><dt>Etapa de cadena</dt><dd>{label(iro.stage)}</dd></div>
            <div className="info-row"><dt>Ubicación</dt><dd>{iro.location || '—'}</dd></div>
            <div className="info-row"><dt>Grupo de interés</dt><dd>{iro.stakeholder || '—'}</dd></div>
            <div className="info-row"><dt>Derechos humanos</dt><dd>{iro.rights || 'No aplica'}</dd></div>
            <div className="info-row"><dt>Horizonte</dt><dd>{label(iro.horizon)}</dd></div>
            <div className="info-row"><dt>Efecto financiero</dt><dd>{iro.financialEffect || '—'}</dd></div>
            <div className="info-row"><dt>Controles</dt><dd>{iro.controls || '—'}</dd></div>
            <div className="info-row"><dt>Inherente / residual</dt><dd>{iro.inherent ?? '—'} / {iro.residual ?? '—'}</dd></div>
            <div className="info-row"><dt>Evidencia</dt><dd>{iro.evidence || 'Sin evidencia vinculada'}</dd></div>
            <div className="info-row"><dt>Actualizado</dt><dd>{dateLabel(iro.updatedAt)}</dd></div>
          </dl>
        </div>

        <div className="drawer-foot">
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 size={13} className="spin" /> : <Check size={13} />} Guardar evaluación
          </button>
        </div>
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Create IRO                                                          */
/* ------------------------------------------------------------------ */

function CreateIROModal({ workspace, onClose, onCreated, notify }: { workspace: Workspace; onClose: () => void; onCreated: (iro: IRO) => void; notify: (m: string) => void }) {
  const [form, setForm] = useState({
    topicCode: workspace.topics[0]?.code || '',
    title: '',
    type: 'Impact',
    nature: 'Negative',
    actuality: 'Actual',
    stage: 'Own operations',
    description: '',
    cause: '',
    consequence: '',
    impactScore: 3,
    financialScore: 3,
    owner: workspace.company.csOfficer,
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const valid = form.title.trim().length >= 3 && form.description.trim().length >= 5 && form.topicCode;

  async function submit() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/iros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: workspace.company.id, ...form }),
      });
      if (!res.ok) throw new Error('No se pudo crear el IRO');
      const iro = (await res.json()) as IRO;
      onCreated(iro);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Error al crear el IRO');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Nuevo registro</div>
            <h3 style={{ marginTop: 4 }}>Crear impacto, riesgo u oportunidad</h3>
            <p className="micro" style={{ marginTop: 4 }}>El registro se crea en estado Draft y queda vinculado a la evaluación activa.</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={15} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="field full">
              <label>Título</label>
              <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Ej. Estrés hídrico en la cuenca del sitio operativo" />
            </div>
            <div className="field">
              <label>Asunto ESG</label>
              <select className="select" value={form.topicCode} onChange={(e) => set('topicCode', e.target.value)}>
                {workspace.topics.map((t) => <option key={t.code} value={t.code}>{t.code} · {t.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Tipo</label>
              <select className="select" value={label(form.type)} onChange={(e) => set('type', e.target.value)}>
                <option value="Impact">Impacto</option>
                <option value="Risk">Riesgo</option>
                <option value="Opportunity">Oportunidad</option>
              </select>
            </div>
            <div className="field">
              <label>Naturaleza</label>
              <select className="select" value={label(form.nature)} onChange={(e) => set('nature', e.target.value)}>
                <option value="Negative">Negativa</option>
                <option value="Positive">Positiva</option>
              </select>
            </div>
            <div className="field">
              <label>Actualidad</label>
              <select className="select" value={label(form.actuality)} onChange={(e) => set('actuality', e.target.value)}>
                <option value="Actual">Actual</option>
                <option value="Potential">Potencial</option>
              </select>
            </div>
            <div className="field">
              <label>Etapa de cadena</label>
              <select className="select" value={label(form.stage)} onChange={(e) => set('stage', e.target.value)}>
                <option value="Upstream">Aguas arriba</option>
                <option value="Own operations">Operaciones propias</option>
                <option value="Downstream">Aguas abajo</option>
              </select>
            </div>
            <div className="field">
              <label>Responsable</label>
              <input className="input" value={form.owner} onChange={(e) => set('owner', e.target.value)} />
            </div>
            <div className="field full">
              <label>Descripción</label>
              <textarea className="textarea" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe el impacto, riesgo u oportunidad y su vínculo con la actividad." />
            </div>
            <div className="field">
              <label>Causa</label>
              <input className="input" value={form.cause} onChange={(e) => set('cause', e.target.value)} />
            </div>
            <div className="field">
              <label>Consecuencia</label>
              <input className="input" value={form.consequence} onChange={(e) => set('consequence', e.target.value)} />
            </div>
            <div className="field">
              <label>Materialidad de impacto · {form.impactScore.toFixed(1)}/5</label>
              <input className="range" type="range" min={0} max={5} step={0.1} value={form.impactScore} onChange={(e) => set('impactScore', Number(e.target.value))} />
            </div>
            <div className="field">
              <label>Materialidad financiera · {form.financialScore.toFixed(1)}/5</label>
              <input className="range" type="range" min={0} max={5} step={0.1} value={form.financialScore} onChange={(e) => set('financialScore', Number(e.target.value))} />
            </div>
          </div>
          <div className="callout" style={{ marginTop: 12 }}>
            <AlertTriangle size={15} />
            <div>Los dos ejes no se agregan. Un valor ≥ 4,4 en cualquiera de los ejes marca el registro como crítico. Los asuntos de derechos humanos se priorizan además por la severidad del impacto, con independencia de la probabilidad.</div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={() => void submit()} disabled={!valid || saving}>
            {saving ? <Loader2 size={13} className="spin" /> : <Plus size={13} />} Crear IRO
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Report preview                                                      */
/* ------------------------------------------------------------------ */

interface ReportData {
  company: Company;
  assessment: Assessment | null;
  materialTopics: MaterialityTopic[];
  criticalIros: IRO[];
  kpis: KPI[];
  targets: Target[];
  disclosures: Disclosure[];
  evidence: Evidence[];
  frameworkCoverage: FrameworkCoverage[];
  generatedAt: string;
  perimeter: string;
  methodology: string;
}

function ReportModal({ companyId, onClose, notify }: { companyId: string; onClose: () => void; notify: (m: string) => void }) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reports/${companyId}`, { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('No se pudo generar el reporte')))
      .then((d) => { if (!cancelled) setData(d as ReportData); })
      .catch((e) => { if (!cancelled) notify(e instanceof Error ? e.message : 'Error al generar el reporte'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [companyId, notify]);

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-card report-print" style={{ width: 'min(860px, 96vw)' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Vista previa de reporte</div>
            <h3 style={{ marginTop: 4 }}>{data?.company.name || 'Generando…'}</h3>
            <p className="micro" style={{ marginTop: 4 }}>Documento de trabajo · no es una opinión de aseguramiento</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={15} /></button>
        </div>
        <div className="modal-body">
          {loading && <div className="empty-state"><Loader2 size={22} className="spin" /><p>Construyendo el paquete desde la base de datos…</p></div>}
          {data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <section>
                <div className="eyebrow">1 · Perfil y perímetro</div>
                <h2 style={{ marginTop: 6 }}>{data.company.name}</h2>
                <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 5 }}>{data.company.description}</p>
                <div className="grid grid-4" style={{ marginTop: 10 }}>
                  <div className="mini-card"><div className="label">Sector</div><div style={{ fontSize: 11, marginTop: 3 }}>{data.company.sector}</div></div>
                  <div className="mini-card"><div className="label">País</div><div style={{ fontSize: 11, marginTop: 3 }}>{data.company.country}</div></div>
                  <div className="mini-card"><div className="label">Empleados</div><div style={{ fontSize: 11, marginTop: 3 }}>{fmt(data.company.employees)}</div></div>
                  <div className="mini-card"><div className="label">Período</div><div style={{ fontSize: 11, marginTop: 3 }}>{data.assessment?.period || 'FY2026'}</div></div>
                </div>
                <p className="micro" style={{ marginTop: 8 }}>Perímetro: {data.perimeter}. Metodología: {data.methodology}.</p>
              </section>

              <div className="divider" />

              <section>
                <div className="eyebrow">2 · Doble materialidad</div>
                <p className="micro" style={{ marginTop: 4 }}>Asuntos materiales con puntuación independiente por eje. Umbral 3,2/5.</p>
                <div className="table-wrap">
                  <table className="data">
                    <thead><tr><th>Asunto</th><th>Dimensión</th><th className="num">Impacto</th><th className="num">Financiero</th><th>Clasificación</th></tr></thead>
                    <tbody>
                      {data.materialTopics.map((t) => (
                        <tr key={t.code}><td>{t.name}</td><td>{label(t.dimension)}</td><td className="num">{t.impact.toFixed(1)}</td><td className="num">{t.financial.toFixed(1)}</td><td><Pill variant={t.materiality === 'both' ? 'amber' : t.materiality === 'impact' ? 'red' : 'blue'}>{materialityLabel(t.materiality)}</Pill></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="divider" />

              <section>
                <div className="eyebrow">3 · IRO críticos</div>
                <div className="stack" style={{ gap: 8, marginTop: 6 }}>
                  {data.criticalIros.map((i) => (
                    <div key={i.id} className="mini-card">
                      <div className="row"><span className="mono">{i.code}</span><Pill variant={i.type === 'Impact' ? 'red' : i.type === 'Risk' ? 'amber' : 'green'}>{label(i.type)}</Pill><span className="micro" style={{ marginLeft: 'auto' }}>Imp {i.impactScore.toFixed(1)} · Fin {i.financialScore.toFixed(1)}</span></div>
                      <div style={{ fontSize: 11, fontWeight: 550, marginTop: 4 }}>{i.title}</div>
                      <div className="micro" style={{ marginTop: 3 }}>{i.description}</div>
                    </div>
                  ))}
                  {data.criticalIros.length === 0 && <div className="table-empty">Sin IRO críticos.</div>}
                </div>
              </section>

              <div className="divider" />

              <section>
                <div className="eyebrow">4 · Desempeño y objetivos</div>
                <div className="grid grid-2" style={{ gap: 12, marginTop: 8 }}>
                  <div>
                    <div className="micro" style={{ marginBottom: 5 }}>Indicadores</div>
                    {data.kpis.slice(0, 6).map((k) => (
                      <div key={k.id} className="row" style={{ padding: '3px 0' }}><span style={{ fontSize: 9.5, flex: 1 }}>{k.name}</span><span className="micro">{fmt(k.value, 1)} {k.unit}</span></div>
                    ))}
                  </div>
                  <div>
                    <div className="micro" style={{ marginBottom: 5 }}>Objetivos</div>
                    {data.targets.slice(0, 6).map((t) => (
                      <div key={t.id} className="row" style={{ padding: '3px 0' }}><span style={{ fontSize: 9.5, flex: 1 }}>{t.title}</span><span className="micro">{t.progress}%</span></div>
                    ))}
                  </div>
                </div>
              </section>

              <div className="divider" />

              <section>
                <div className="eyebrow">5 · Cobertura de divulgación</div>
                <div className="grid grid-2" style={{ gap: 12, marginTop: 8 }}>
                  <div>
                    {data.frameworkCoverage.map((f) => (
                      <div key={f.framework} className="row" style={{ padding: '3px 0' }}><span style={{ fontSize: 9.5, flex: 1 }}>{f.framework}</span><span className="micro">{f.complete}/{f.total} · {f.coverage}%</span></div>
                    ))}
                  </div>
                  <div>
                    <div className="micro">Evidencia</div>
                    <p style={{ fontSize: 10, marginTop: 4, color: 'var(--text-2)' }}>{data.evidence.filter((e) => e.status === 'Verified').length} registros verificados de {data.evidence.length}. Las brechas se declaran y no se presentan como completas.</p>
                    <p className="micro" style={{ marginTop: 6 }}>Generado {dateLabel(data.generatedAt)}.</p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>Cerrar</button>
          <button className="btn primary" onClick={() => window.print()} disabled={!data}><Printer size={13} /> Imprimir / guardar PDF</button>
        </div>
      </div>
    </div>
  );
}
