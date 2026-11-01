'use client';

import { useState } from 'react';
import {
  AlertTriangle, ArrowRight, BadgeCheck, HeartHandshake, Megaphone, ShieldCheck, Users, Waypoints,
} from 'lucide-react';
import { Callout, MaterialityPill, Panel, PanelHead, Pill, ProgressRow, Tabs } from '@/components/ui';
import { dateLabel, fmt, money } from '@/lib/format';
import type { ViewProps } from './types';

const DUE_DILIGENCE_STEPS = [
  ['1 · Integrar', 'Incorporar la debida diligencia en políticas, sistemas de gestión y procesos de decisión.'],
  ['2 · Identificar', 'Identificar y evaluar impactos adversos reales y potenciales sobre las personas y el medio ambiente.'],
  ['3 · Detener y mitigar', 'Detener, prevenir o mitigar los impactos adversos identificados.'],
  ['4 · Seguimiento', 'Hacer seguimiento de la eficacia de las medidas y de los resultados para las personas afectadas.'],
  ['5 · Comunicar', 'Comunicar cómo se abordan los impactos y permitir el acceso a información relevante.'],
  ['6 · Remediación', 'Proporcionar o facilitar la remediación cuando corresponda.'],
];

export default function SocialView({ workspace, actions }: ViewProps) {
  const [tab, setTab] = useState('stakeholders');
  const { stakeholders, engagements, grievances, suppliers, iros, policies, kpis } = workspace;
  const rightsIros = iros.filter((i) => i.rights && i.rights !== '—');
  const openGrievances = grievances.filter((g) => g.status !== 'Resolved');
  const criticalGrievances = openGrievances.filter((g) => g.severity === 'Critical');
  const highRiskSuppliers = suppliers.filter((s) => s.risk === 'Critical' || s.risk === 'High');
  const lowAssessed = suppliers.filter((s) => s.assessment < 60);
  const womenKpi = kpis.find((k) => /women|mujeres|gender|género/i.test(k.name));
  const injuryKpi = kpis.find((k) => /injur|accident|seguridad|safety|lost time/i.test(k.name));
  const trainingKpi = kpis.find((k) => /training|formación|capacitaci/i.test(k.name));
  const communityKpi = kpis.find((k) => /community|comunidad|social investment|inversión social/i.test(k.name));

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-copy">
          <div className="eyebrow">Personas, derechos humanos y debida diligencia</div>
          <h1>Social y derechos humanos</h1>
          <p>Grupos de interés, participación significativa, reclamos, acceso a remediación y debida diligencia en derechos humanos a lo largo de la cadena de valor.</p>
        </div>
        <div className="page-head-actions">
          <Pill variant={criticalGrievances.length ? 'red' : 'green'}>{criticalGrievances.length} reclamos críticos</Pill>
          <Pill variant="amber">UNGP · OECD</Pill>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="panel stat-card"><div className="stat-label"><Users size={11} /> Grupos de interés</div><div className="stat-value">{stakeholders.length}</div><div className="stat-foot">{engagements.length} procesos de participación</div></div>
        <div className="panel stat-card"><div className="stat-label"><Megaphone size={11} /> Reclamos abiertos</div><div className="stat-value" style={{ color: criticalGrievances.length ? 'var(--terracotta)' : 'var(--text)' }}>{openGrievances.length}</div><div className="stat-foot">{criticalGrievances.length} críticos · {grievances.length} totales</div></div>
        <div className="panel stat-card"><div className="stat-label"><ShieldCheck size={11} /> IRO con derechos</div><div className="stat-value">{rightsIros.length}</div><div className="stat-foot">{rightsIros.filter((i) => i.critical).length} críticos</div></div>
        <div className="panel stat-card"><div className="stat-label"><Waypoints size={11} /> Proveedores alto riesgo</div><div className="stat-value" style={{ color: highRiskSuppliers.length ? 'var(--amber)' : 'var(--text)' }}>{highRiskSuppliers.length}</div><div className="stat-foot">{lowAssessed.length} con evaluación &lt; 60%</div></div>
      </div>

      <div style={{ marginTop: 14 }}>
        <Tabs
          active={tab}
          onChange={setTab}
          items={[
            { key: 'stakeholders', label: 'Grupos de interés', count: stakeholders.length },
            { key: 'grievances', label: 'Reclamos y remediación', count: openGrievances.length },
            { key: 'suppliers', label: 'Cadena de suministro', count: suppliers.length },
            { key: 'duediligence', label: 'Debida diligencia' },
          ]}
        />
      </div>

      {tab === 'stakeholders' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-8">
            <PanelHead title="Mapa de grupos de interés" subtitle="Influencia, exposición y vulnerabilidad se evalúan por separado." actions={<Pill variant="gray">{stakeholders.length} grupos</Pill>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Grupo</th><th>Categoría</th><th>Relación</th><th className="num">Influencia</th><th className="num">Exposición</th><th className="num">Vulnerabilidad</th><th>Último contacto</th></tr></thead>
                <tbody>
                  {stakeholders.map((s) => (
                    <tr key={s.id}>
                      <td><span className="strong">{s.name}</span><div className="sub">{s.location}</div></td>
                      <td><Pill variant="gray">{s.category}</Pill></td>
                      <td>{s.relation}</td>
                      <td className="num">{s.influence}/5</td>
                      <td className="num">{s.exposure}/5</td>
                      <td className="num"><span style={{ color: s.vulnerability >= 4 ? 'var(--terracotta)' : 'inherit' }}>{s.vulnerability}/5</span></td>
                      <td>{dateLabel(s.lastEngagement)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>La vulnerabilidad no se compensa con la influencia del grupo.</span><span>Fuente: registro de participación</span></div>
          </Panel>

          <Panel className="col-4">
            <PanelHead title="Participación significativa" subtitle="Compromisos y evidencia" actions={<Pill variant="blue">{engagements.length} procesos</Pill>} />
            <div className="panel-body" style={{ paddingTop: 8 }}>
              {engagements.map((e) => (
                <div key={e.id} style={{ padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
                  <div className="row"><div style={{ fontSize: 10.5, fontWeight: 600, flex: 1 }}>{e.title}</div><Pill variant={e.status === 'Completed' ? 'green' : e.status === 'Ongoing' ? 'amber' : 'gray'}>{e.status}</Pill></div>
                  <div className="micro" style={{ marginTop: 3 }}>{e.stakeholderName || 'Múltiples grupos'} · {e.type} · {dateLabel(e.date)}</div>
                  <div className="micro" style={{ marginTop: 3 }}>{e.participants} participantes · {e.commitments}</div>
                </div>
              ))}
              <div className="divider" />
              <Callout tone="amber"><strong>Participación no equivale a validación.</strong> La evidencia de participación informa el juicio de materialidad, pero no transfiere la responsabilidad de decisión a los stakeholders.</Callout>
            </div>
          </Panel>

          <Panel className="col-12" pad>
            <div className="section-head"><div><h3>Indicadores sociales clave</h3><p>Datos de fuerza laboral, seguridad, formación y comunidad.</p></div><Users size={15} className="muted" /></div>
            <div className="grid grid-4">
              {[womenKpi, injuryKpi, trainingKpi, communityKpi].filter(Boolean).map((k) => k && (
                <div key={k.id} className="mini-card">
                  <div className="label">{k.category}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginTop: 3 }}>{fmt(k.value, 1)} <span style={{ fontSize: 9, color: 'var(--muted)' }}>{k.unit}</span></div>
                  <div className="foot">Objetivo {fmt(k.target, 1)} · {k.status}</div>
                  <ProgressRow value={k.progress || 0} tone={k.status === 'On track' ? 'green' : 'amber'} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'grievances' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-8">
            <PanelHead title="Mecanismo de reclamos" subtitle="Casos abiertos, severidad, estado y remediación." actions={<Pill variant={criticalGrievances.length ? 'red' : 'green'}>{criticalGrievances.length} críticos</Pill>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Caso</th><th>Grupo afectado</th><th>Categoría</th><th>Severidad</th><th>Estado</th><th>Remediación</th></tr></thead>
                <tbody>
                  {grievances.map((g) => (
                    <tr key={g.id}>
                      <td><span className="strong">{g.id}</span><div className="sub">Abierto {dateLabel(g.opened)}{g.resolved ? ` · Cerrado ${dateLabel(g.resolved)}` : ''}</div></td>
                      <td>{g.stakeholder}</td>
                      <td>{g.category}<div className="sub">{g.description}</div></td>
                      <td><Pill variant={g.severity === 'Critical' ? 'red' : g.severity === 'High' ? 'amber' : 'gray'}>{g.severity}</Pill></td>
                      <td><Pill variant={g.status === 'Resolved' ? 'green' : g.status === 'Escalated' ? 'red' : 'amber'}>{g.status}</Pill></td>
                      <td style={{ maxWidth: 240 }}><span className="sub">{g.remediation}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="col-4">
            <PanelHead title="Acceso a remediación" subtitle="Principios operativos del mecanismo" actions={<HeartHandshake size={15} className="muted" />} />
            <div className="panel-body" style={{ paddingTop: 8 }}>
              <div className="stack">
                <div className="mini-card"><div className="label">Legitimidad</div><div style={{ fontSize: 10.5, marginTop: 4 }}>El mecanismo es independiente de la línea operativa y permite reclamos anónimos.</div></div>
                <div className="mini-card"><div className="label">Accesibilidad</div><div style={{ fontSize: 10.5, marginTop: 4 }}>Canales presenciales, telefónicos y comunitarios, en el idioma local.</div></div>
                <div className="mini-card"><div className="label">Protección</div><div style={{ fontSize: 10.5, marginTop: 4 }}>Prohibición de represalias y revisión de casos de retaliación.</div></div>
                <div className="mini-card"><div className="label">Remediación</div><div style={{ fontSize: 10.5, marginTop: 4 }}>La reparación se documenta por separado del cierre administrativo del caso.</div></div>
              </div>
              <div className="divider" />
              {criticalGrievances.length > 0 && (
                <Callout tone="red"><strong>{criticalGrievances.length} caso(s) crítico(s) abierto(s).</strong> Requieren plan de remediación, responsable y evidencia de cierre verificable. Un pago o acuerdo no demuestra por sí solo reparación efectiva.</Callout>
              )}
              <div className="notice" style={{ marginTop: 8 }}>Cada caso conserva su expediente, responsable y evidencia de cierre en el registro de trazabilidad.</div>
            </div>
          </Panel>

          <Panel className="col-12">
            <PanelHead title="IRO con dimensión de derechos humanos" subtitle="Impactos que reciben prioridad por severidad, no solo por probabilidad." actions={<Pill variant="red">{rightsIros.length} registros</Pill>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>IRO</th><th>Derecho</th><th>Tipo</th><th>Materialidad</th><th className="num">Impacto</th><th className="num">Financiero</th><th>Ubicación</th><th>Estado</th></tr></thead>
                <tbody>
                  {rightsIros.map((i) => (
                    <tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => actions.openIRO(i)}>
                      <td><span className="strong">{i.title}</span><div className="sub"><span className="mono">{i.code}</span> · {i.topicName}</div></td>
                      <td style={{ maxWidth: 200 }}>{i.rights}</td>
                      <td><Pill variant={i.type === 'Impact' ? 'red' : i.type === 'Risk' ? 'amber' : 'green'}>{i.type}</Pill></td>
                      <td><MaterialityPill value={i.materiality} /></td>
                      <td className="num">{i.impactScore.toFixed(1)}</td>
                      <td className="num">{i.financialScore.toFixed(1)}</td>
                      <td>{i.location}</td>
                      <td>{i.critical ? <Pill variant="red">Crítico</Pill> : <Pill variant="gray">{i.status}</Pill>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'suppliers' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-8">
            <PanelHead title="Cadena de suministro" subtitle="Riesgo, evaluación, auditoría, trazabilidad e incidentes." actions={<Pill variant="amber">{highRiskSuppliers.length} alto riesgo</Pill>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Proveedor</th><th>País</th><th>Sector</th><th>Riesgo</th><th className="num">Gasto</th><th className="num">Evaluación</th><th>Auditoría</th><th className="num">Incidentes</th><th className="num">Trazabilidad</th></tr></thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id}>
                      <td><span className="strong">{s.name}</span><div className="sub">{s.status}</div></td>
                      <td>{s.country}</td>
                      <td>{s.sector}</td>
                      <td><Pill variant={s.risk === 'Critical' ? 'red' : s.risk === 'High' ? 'amber' : s.risk === 'Low' ? 'green' : 'gray'}>{s.risk}</Pill></td>
                      <td className="num">{money(s.spend)}</td>
                      <td className="num"><span style={{ color: s.assessment < 60 ? 'var(--terracotta)' : 'inherit' }}>{s.assessment}%</span></td>
                      <td>{s.audit}</td>
                      <td className="num">{s.incidents}</td>
                      <td className="num">{s.traceability}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>{suppliers.length} proveedores · {suppliers.filter((s) => s.audit !== 'None').length} con auditoría</span><span>Certificaciones: {suppliers.filter((s) => s.certifications && s.certifications !== '—').length} proveedores</span></div>
          </Panel>

          <Panel className="col-4">
            <PanelHead title="Señales de riesgo" subtitle="Lectura de concentración y cobertura" actions={<AlertTriangle size={15} className="muted" />} />
            <div className="panel-body" style={{ paddingTop: 8 }}>
              <div className="grid grid-2" style={{ gap: 8 }}>
                <div className="mini-card"><div className="label">Evaluados &lt; 60%</div><div className="value" style={{ color: 'var(--terracotta)' }}>{lowAssessed.length}</div><div className="foot">requieren plan de acción</div></div>
                <div className="mini-card"><div className="label">Con incidentes</div><div className="value">{suppliers.filter((s) => s.incidents > 0).length}</div><div className="foot">en los últimos 24 meses</div></div>
                <div className="mini-card"><div className="label">Trazabilidad media</div><div className="value">{Math.round(suppliers.reduce((a, b) => a + b.traceability, 0) / Math.max(1, suppliers.length))}%</div><div className="foot">nivel de origen</div></div>
                <div className="mini-card"><div className="label">Gasto cubierto</div><div className="value" style={{ fontSize: 15 }}>{money(suppliers.reduce((a, b) => a + b.spend, 0))}</div><div className="foot">gasto evaluado</div></div>
              </div>
              <div className="divider" />
              <Callout tone="red"><strong>Una auditoría no prueba ausencia de abuso.</strong> La evaluación de proveedores mide cobertura y controles, no la inexistencia de impactos adversos.</Callout>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'duediligence' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-7" pad>
            <div className="section-head"><div><h3>Debida diligencia en derechos humanos</h3><p>Marco de seis pasos OECD y expectativas de los Principios Rectores de la ONU.</p></div><BadgeCheck size={15} className="muted" /></div>
            <div className="stack">
              {DUE_DILIGENCE_STEPS.map(([title, desc], idx) => {
                const done = idx < 4;
                return (
                  <div key={title} className="row" style={{ alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                    <div className="step-dot" style={{ background: done ? 'var(--forest)' : 'var(--panel)', borderColor: done ? 'var(--forest-2)' : 'var(--line)' }}>{idx + 1}</div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 10.5, fontWeight: 600 }}>{title}</div><div className="micro">{desc}</div></div>
                    <Pill variant={done ? 'green' : 'amber'}>{done ? 'Implementado' : 'En desarrollo'}</Pill>
                  </div>
                );
              })}
            </div>
            <div className="divider" />
            <div className="callout"><ShieldCheck size={15} /><div><strong>Prioridad de derechos.</strong> La severidad se evalúa por escala, alcance e irremediabilidad. La probabilidad no reduce la obligación de actuar frente a impactos graves.</div></div>
          </Panel>

          <Panel className="col-5" pad>
            <div className="section-head"><div><h3>Políticas y compromisos</h3><p>Instrumentos que sostienen la debida diligencia.</p></div><ShieldCheck size={15} className="muted" /></div>
            {policies.filter((p) => /human|derecho|labour|labor|supplier|proveedor|grievance|reclamo|diversity|diversidad/i.test(p.title)).map((p) => (
              <div key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <div className="row"><div style={{ fontSize: 10.5, fontWeight: 550, flex: 1 }}>{p.title}</div><Pill variant={p.status === 'Active' ? 'green' : 'amber'}>{p.status}</Pill></div>
                <div className="micro">{p.code} · v{p.version} · {p.owner}</div>
              </div>
            ))}
            {policies.filter((p) => /human|derecho|labour|labor|supplier|proveedor|grievance|reclamo|diversity|diversidad/i.test(p.title)).length === 0 && (
              <div className="table-empty">No hay políticas específicas registradas para derechos humanos. La ausencia se declara como brecha.</div>
            )}
            <div className="divider" />
            <div className="micro" style={{ marginBottom: 6 }}>Brechas de debida diligencia</div>
            <div className="stack" style={{ gap: 7 }}>
              <div className="callout red"><AlertTriangle size={15} /><div><strong>Remediación.</strong> Verificar que los casos cerrados cuenten con evidencia de reparación, no solo de respuesta administrativa.</div></div>
              <div className="callout"><AlertTriangle size={15} /><div><strong>Proveedores de segundo nivel.</strong> La trazabilidad más allá del primer nivel sigue siendo parcial en varios sectores.</div></div>
            </div>
            <div className="divider" />
            <button className="btn sm" onClick={() => actions.navigate('valuechain')}>Ver cadena de valor <ArrowRight size={12} /></button>
          </Panel>
        </div>
      )}
    </div>
  );
}
