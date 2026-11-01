'use client';

import { useEffect, useState } from 'react';
import { Building2, Database, Globe2, Layers3, Lock, Settings2, ShieldCheck, Users } from 'lucide-react';
import { Callout, Panel, PanelHead, Pill, Progress } from '@/components/ui';
import { dateTimeLabel, fmt, money } from '@/lib/format';
import type { AuditLog, Company, Organization, Requirement } from '@/lib/types';
import type { ViewProps } from './types';

interface AdminData {
  organizations: Organization[];
  companies: Company[];
  requirements: Requirement[];
  versions: { framework: string; version: string; n: number }[];
  counts: { users: number; roles: number; auditLogs: number; evidence: number; disclosures: number; aiRuns: number };
}

export default function AdminView({ portfolio, workspace, actions }: ViewProps) {
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/admin').then((r) => r.ok ? r.json() : null),
      fetch('/api/audit?limit=40').then((r) => r.ok ? r.json() : null),
    ]).then(([a, l]) => {
      if (cancelled) return;
      if (a) setAdmin(a as AdminData);
      if (l?.logs) setLogs(l.logs as AuditLog[]);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const companies = admin?.companies || portfolio.companies;
  const versions = admin?.versions || [];
  const counts = admin?.counts;

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-copy">
          <div className="eyebrow">Portafolio y administración del sistema</div>
          <h1>Administración</h1>
          <p>Portafolio de empresas, organizaciones, marcos y versiones, usuarios, roles y estado del sistema.</p>
        </div>
        <div className="page-head-actions">
          <Pill variant="green">Sistema operativo</Pill>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="panel stat-card"><div className="stat-label"><Building2 size={11} /> Empresas</div><div className="stat-value">{companies.length}</div><div className="stat-foot">{portfolio.organizations.length} organizaciones propietarias</div></div>
        <div className="panel stat-card"><div className="stat-label"><Layers3 size={11} /> Marcos</div><div className="stat-value">{versions.length}</div><div className="stat-foot">{admin?.requirements.length ?? '—'} requisitos catalogados</div></div>
        <div className="panel stat-card"><div className="stat-label"><Users size={11} /> Usuarios / roles</div><div className="stat-value">{counts?.users ?? '—'}<small>/{counts?.roles ?? '—'}</small></div><div className="stat-foot">roles definidos</div></div>
        <div className="panel stat-card"><div className="stat-label"><Database size={11} /> Registros auditados</div><div className="stat-value">{counts?.auditLogs ?? logs.length}</div><div className="stat-foot">{counts?.aiRuns ?? 0} consultas de IA registradas</div></div>
      </div>

      <div className="grid grid-12" style={{ marginTop: 14 }}>
        <Panel className="col-8">
          <PanelHead title="Portafolio de empresas" subtitle="Sector, país, ingresos, empleados, calidad del dato y cobertura." actions={<Pill variant="gray">{companies.length} entidades</Pill>} />
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Empresa</th><th>Sector</th><th>País</th><th className="num">Ingresos</th><th className="num">Empleados</th><th className="num">Data quality</th><th className="num">Cobertura</th><th>Estado</th></tr></thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => actions.selectCompany(c.id)}>
                    <td><span className="strong">{c.name}</span><div className="sub">{c.shortName} · {c.maturity}</div></td>
                    <td>{c.sector}<div className="sub">{c.subsector}</div></td>
                    <td>{c.country}</td>
                    <td className="num">{money(c.revenue, c.currency)}</td>
                    <td className="num">{fmt(c.employees)}</td>
                    <td className="num">{c.dataQuality}</td>
                    <td className="num">{c.reportingCoverage}%</td>
                    <td><Pill variant={c.status === 'Active' ? 'green' : 'gray'}>{c.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer"><span>Selecciona una empresa para abrir su espacio de trabajo.</span><span>Ingresos agregados {money(portfolio.summary.totalRevenue)}</span></div>
        </Panel>

        <Panel className="col-4" pad>
          <div className="section-head"><div><h3>Estado del sistema</h3><p>Componentes y límites de la plataforma.</p></div><Settings2 size={15} className="muted" /></div>
          <div className="stack" style={{ gap: 8 }}>
            <div className="row"><Database size={13} className="muted" /><span style={{ fontSize: 10, flex: 1 }}>SQLite local</span><Pill variant="green">Conectado</Pill></div>
            <div className="row"><Lock size={13} className="muted" /><span style={{ fontSize: 10, flex: 1 }}>Persistencia ESG</span><Pill variant="green">Base de datos</Pill></div>
            <div className="row"><ShieldCheck size={13} className="muted" /><span style={{ fontSize: 10, flex: 1 }}>Registro de auditoría</span><Pill variant="green">Activo</Pill></div>
            <div className="row"><Globe2 size={13} className="muted" /><span style={{ fontSize: 10, flex: 1 }}>Integraciones externas</span><Pill variant="amber">Ninguna</Pill></div>
          </div>
          <div className="divider" />
          <Callout tone="amber"><strong>Sin integraciones externas.</strong> La plataforma opera con una base de datos local y no declara conexiones a ERP, CDP, proveedores de datos o aseguradoras.</Callout>
          <div className="divider" />
          <div className="micro" style={{ marginBottom: 4 }}>Cobertura de datos</div>
          <div className="row"><span style={{ fontSize: 10 }}>Evidencia</span><span className="micro" style={{ marginLeft: 'auto' }}>{counts?.evidence ?? workspace.evidence.length}</span></div>
          <Progress value={Math.min(100, ((counts?.evidence ?? workspace.evidence.length) / 80) * 100)} tone="green" height={6} />
          <div className="row" style={{ marginTop: 8 }}><span style={{ fontSize: 10 }}>Divulgaciones</span><span className="micro" style={{ marginLeft: 'auto' }}>{counts?.disclosures ?? workspace.disclosures.length}</span></div>
          <Progress value={Math.min(100, ((counts?.disclosures ?? workspace.disclosures.length) / 300) * 100)} tone="ocean" height={6} />
        </Panel>

        <Panel className="col-6" pad>
          <div className="section-head"><div><h3>Marcos y versiones</h3><p>Catálogo de referencia y número de requisitos.</p></div><Layers3 size={15} className="muted" /></div>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Marco</th><th>Versión</th><th className="num">Requisitos</th></tr></thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={`${v.framework}-${v.version}`}><td><span className="strong">{v.framework}</span></td><td>{v.version}</td><td className="num">{v.n}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divider" />
          <div className="notice">Las versiones se conservan para trazabilidad. Un cambio de versión no debe reinterpretar retroactivamente un reporte ya publicado.</div>
        </Panel>

        <Panel className="col-6" pad>
          <div className="section-head"><div><h3>Organizaciones</h3><p>Estructura propietaria del portafolio.</p></div><Building2 size={15} className="muted" /></div>
          {(admin?.organizations || portfolio.organizations).map((o) => (
            <div key={o.id} className="row" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 10.5, fontWeight: 550 }}>{o.name}</div><div className="micro">{o.kind} · {o.country}</div></div>
              <Pill variant="gray">{companies.filter((c) => c.organizationId === o.id).length} empresas</Pill>
            </div>
          ))}
          <div className="divider" />
          <div className="grid grid-2" style={{ gap: 8 }}>
            <div className="mini-card"><div className="label">Sectores</div><div className="value">{portfolio.sectors.length}</div><div className="foot">diversificación sectorial</div></div>
            <div className="mini-card"><div className="label">Países</div><div className="value">{portfolio.countries.length}</div><div className="foot">presencia del portafolio</div></div>
          </div>
        </Panel>

        <Panel className="col-12">
          <PanelHead title="Registro de auditoría global" subtitle="Últimos eventos de todas las empresas del portafolio." actions={<Pill variant="gray">{logs.length} eventos</Pill>} />
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Fecha</th><th>Empresa</th><th>Actor</th><th>Acción</th><th>Entidad</th><th>Detalle</th><th>Hash</th></tr></thead>
              <tbody>
                {logs.map((l) => {
                  const company = companies.find((c) => c.id === l.companyId);
                  return (
                    <tr key={l.id}>
                      <td>{dateTimeLabel(l.createdAt)}</td>
                      <td>{company?.shortName || l.companyId || '—'}</td>
                      <td>{l.actor}<div className="sub">{l.role}</div></td>
                      <td><Pill variant={l.action === 'CREATED' ? 'green' : l.action === 'UPDATED' ? 'amber' : l.action === 'QUERIED' ? 'blue' : 'gray'}>{l.action}</Pill></td>
                      <td>{l.entity}<div className="sub">{l.entityId}</div></td>
                      <td style={{ maxWidth: 340 }}><span className="sub">{l.detail}</span></td>
                      <td><span className="mono" style={{ fontSize: 7.5 }}>{l.hash.slice(7, 19)}…</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="table-footer"><span>El registro es global y conserva el identificador de empresa.</span><span>Registro cronológico de eventos.</span></div>
        </Panel>
      </div>
    </div>
  );
}
