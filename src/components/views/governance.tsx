'use client';

import { useState } from 'react';
import { AlertTriangle, BadgeCheck, Building2, ClipboardCheck, Gavel, Lock, Scale, ShieldCheck, Users } from 'lucide-react';
import { Callout, Panel, PanelHead, Pill, Progress, ProgressRow, Tabs } from '@/components/ui';
import { dateLabel, label, countLabel } from '@/lib/format';
import type { ViewProps } from './types';

export default function GovernanceView({ workspace, actions }: ViewProps) {
  const [tab, setTab] = useState('overview');
  const { company, policies, controls, findings, kpis, auditLogs, disclosures } = workspace;
  const activePolicies = policies.filter((p) => p.status === 'Active');
  const overduePolicies = policies.filter((p) => /overdue|review/i.test(p.status));
  const operatingControls = controls.filter((c) => c.status === 'Operating');
  const openFindings = findings.filter((f) => f.status !== 'Closed');
  const highFindings = openFindings.filter((f) => f.severity === 'Critical' || f.severity === 'High');
  const boardKpi = kpis.find((k) => /board independence|independencia/i.test(k.name));
  const womenKpi = kpis.find((k) => /women in leadership|mujeres/i.test(k.name));
  const ethicsKpi = kpis.find((k) => /ethics|training|compliance|corrupci/i.test(k.name));
  const gKpis = kpis.filter((k) => k.dimension === 'G');
  const avgG = gKpis.length ? Math.round(gKpis.reduce((a, b) => a + (b.progress || 0), 0) / gKpis.length) : 0;

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-copy">
          <div className="eyebrow">Gobernanza, ética y control interno</div>
          <h1>Gobernanza</h1>
          <p>Estructura de gobierno, supervisión del consejo, políticas, ética, controles internos y hallazgos. La gobernanza se evalúa por su funcionamiento, no solo por la existencia de documentos.</p>
        </div>
        <div className="page-head-actions">
          <Pill variant={highFindings.length ? 'red' : 'green'}>{countLabel(highFindings.length, 'hallazgo alto', 'hallazgos altos')}</Pill>
          <Pill variant="blue">{countLabel(activePolicies.length, 'política activa', 'políticas activas')}</Pill>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="panel stat-card"><div className="stat-label"><Scale size={11} /> Independencia del consejo</div><div className="stat-value">{boardKpi?.value ?? '—'}<small>%</small></div><div className="stat-foot">objetivo {boardKpi?.target ?? '—'}% · {boardKpi?.status ?? 'sin dato'}</div></div>
        <div className="panel stat-card"><div className="stat-label"><Users size={11} /> Mujeres en liderazgo</div><div className="stat-value">{womenKpi?.value ?? '—'}<small>%</small></div><div className="stat-foot">objetivo {womenKpi?.target ?? '—'}%</div></div>
        <div className="panel stat-card"><div className="stat-label"><ShieldCheck size={11} /> Controles operativos</div><div className="stat-value">{operatingControls.length}<small>/{controls.length}</small></div><div className="stat-foot">{countLabel(controls.reduce((a, b) => a + (Number(b.deficiencies) || 0), 0), 'deficiencia registrada', 'deficiencias registradas')}</div></div>
        <div className="panel stat-card"><div className="stat-label"><ClipboardCheck size={11} /> Progreso en gobernanza</div><div className="stat-value">{avgG}<small>%</small></div><div className="stat-foot">{countLabel(gKpis.length, 'indicador', 'indicadores')} · {countLabel(gKpis.filter((k) => k.status === 'At risk').length, 'en riesgo', 'en riesgo')}</div></div>
      </div>

      <div style={{ marginTop: 14 }}>
        <Tabs active={tab} onChange={setTab} items={[
          { key: 'overview', label: 'Estructura y supervisión' },
          { key: 'policies', label: 'Políticas', count: policies.length },
          { key: 'controls', label: 'Controles internos', count: controls.length },
          { key: 'findings', label: 'Hallazgos', count: openFindings.length },
          { key: 'ethics', label: 'Ética y transparencia' },
        ]} />
      </div>

      {tab === 'overview' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-7" pad>
            <div className="section-head"><div><h3>Órganos de gobierno y responsabilidades</h3><p>Supervisión de sostenibilidad, gestión y rendición de cuentas.</p></div><Building2 size={15} className="muted" /></div>
            <div className="stack">
              <div className="mini-card" style={{ borderColor: 'rgba(201,155,81,.3)' }}>
                <div className="row"><Gavel size={14} className="text-g" /><div><div className="label">Consejo de administración</div><div style={{ fontSize: 12, fontWeight: 600 }}>Supervisión estratégica y aprobación del informe</div></div><Pill variant="amber" className="ml-auto">{boardKpi?.value ?? '—'}% independiente</Pill></div>
              </div>
              <div style={{ paddingLeft: 20, borderLeft: '1px solid var(--line-strong)', marginLeft: 18 }} className="stack">
                <div className="mini-card"><div className="row"><ShieldCheck size={13} className="muted" /><div><div className="label">Comité de sostenibilidad</div><div style={{ fontSize: 11, fontWeight: 550 }}>Revisa materialidad, desempeño y divulgación</div></div><Pill variant="green" className="ml-auto">Activo</Pill></div></div>
                <div className="mini-card"><div className="row"><Scale size={13} className="muted" /><div><div className="label">Comité de auditoría</div><div style={{ fontSize: 11, fontWeight: 550 }}>Supervisa control interno, riesgos y aseguramiento</div></div><Pill variant="green" className="ml-auto">Activo</Pill></div></div>
                <div className="mini-card"><div className="row"><Users size={13} className="muted" /><div><div className="label">Comité de ética</div><div style={{ fontSize: 11, fontWeight: 550 }}>Canal de denuncias, conflictos de interés y conducta</div></div><Pill variant="amber" className="ml-auto">En revisión</Pill></div></div>
              </div>
            </div>
            <div className="divider" />
            <div className="grid grid-2" style={{ gap: 9 }}>
              <div className="mini-card"><div className="label">CEO</div><div style={{ fontSize: 13, fontWeight: 600, marginTop: 3 }}>{company.ceo}</div><div className="micro">Responsable de la estrategia y de la cultura de control.</div></div>
              <div className="mini-card"><div className="label">Chief Sustainability Officer</div><div style={{ fontSize: 13, fontWeight: 600, marginTop: 3 }}>{company.csOfficer}</div><div className="micro">Coordina materialidad, desempeño y divulgación.</div></div>
            </div>
            <div className="divider" />
            <Callout tone="amber"><strong>Documento no equivale a funcionamiento.</strong> La existencia de un comité o política no demuestra eficacia. La evidencia de reuniones, decisiones y seguimiento se conserva en aseguramiento.</Callout>
          </Panel>

          <Panel className="col-5" pad>
            <div className="section-head"><div><h3>Indicadores de gobierno</h3><p>Diversidad, independencia y formación.</p></div><BadgeCheck size={15} className="muted" /></div>
            {gKpis.map((k) => (
              <div key={k.id} style={{ marginBottom: 9 }}>
                <div className="row"><span style={{ fontSize: 10 }}>{k.name}</span><span className="micro" style={{ marginLeft: 'auto' }}>{k.value} {k.unit} · objetivo {k.target}</span></div>
                <ProgressRow value={k.progress || 0} tone={k.status === 'On track' ? 'green' : 'amber'} />
              </div>
            ))}
            <div className="divider" />
            <div className="row"><Lock size={13} className="muted" /><span className="micro">Canal de denuncias con opción anónima</span><Pill variant="green" className="ml-auto">Disponible</Pill></div>
            <div className="row" style={{ marginTop: 6 }}><Gavel size={13} className="muted" /><span className="micro">Política de conflictos de interés</span><Pill variant={policies.some((p) => /conflict/i.test(p.title)) ? 'green' : 'amber'} className="ml-auto">{policies.some((p) => /conflict/i.test(p.title)) ? 'Vigente' : 'Revisar'}</Pill></div>
            <div className="divider" />
            <div className="notice">La evaluación de gobernanza no sustituye una opinión legal, fiscal o de control interno.</div>
          </Panel>

          <Panel className="col-12" pad>
            <div className="section-head"><div><h3>Madurez de gobernanza ESG</h3><p>Dimensión de gobierno frente a las demás dimensiones.</p></div><Pill variant="gray">{countLabel(disclosures.filter((d) => /GOV|G1|ESRS G/i.test(d.requirement)).length, 'requisito', 'requisitos')} de gobierno</Pill></div>
            <div className="grid grid-4">
              <div className="mini-card"><div className="label">Supervisión del consejo</div><div className="value">{boardKpi?.value ?? '—'}%</div><div className="foot">independencia</div></div>
              <div className="mini-card"><div className="label">Políticas vigentes</div><div className="value">{activePolicies.length}</div><div className="foot">{overduePolicies.length} requieren revisión</div></div>
              <div className="mini-card"><div className="label">Controles operativos</div><div className="value">{Math.round((operatingControls.length / Math.max(1, controls.length)) * 100)}%</div><div className="foot">de la matriz de controles</div></div>
              <div className="mini-card"><div className="label">Hallazgos abiertos</div><div className="value" style={{ color: highFindings.length ? 'var(--terracotta)' : 'var(--text)' }}>{openFindings.length}</div><div className="foot">{countLabel(highFindings.length, 'alto o crítico', 'altos o críticos')}</div></div>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'policies' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-8">
            <PanelHead title="Políticas corporativas" subtitle="Versión, propietario, aprobación, vigencia y próxima revisión." actions={<Pill variant="gray">{countLabel(policies.length, 'política', 'políticas')}</Pill>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Política</th><th>Versión</th><th>Propietario</th><th>Aprobada</th><th>Vigente</th><th>Próxima revisión</th><th>Estado</th></tr></thead>
                <tbody>
                  {policies.map((p) => (
                    <tr key={p.id}>
                      <td><span className="strong">{p.title}</span><div className="sub">{p.code} · alcance: {p.scope}</div></td>
                      <td>v{p.version}</td>
                      <td>{p.owner}</td>
                      <td>{dateLabel(p.approved)}</td>
                      <td>{dateLabel(p.effective)}</td>
                      <td>{dateLabel(p.review)}</td>
                      <td><Pill variant={p.status === 'Active' ? 'green' : /overdue/i.test(p.status) ? 'red' : 'amber'}>{label(p.status)}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>{activePolicies.length} vigentes · {overduePolicies.length} con revisión pendiente</span><span>Las políticas se versionan y no se sobrescriben.</span></div>
          </Panel>
          <Panel className="col-4" pad>
            <div className="section-head"><div><h3>Controles sobre políticas</h3><p>Qué evita que una política sea solo un documento.</p></div><ShieldCheck size={15} className="muted" /></div>
            <div className="stack">
              <div className="callout"><ShieldCheck size={15} /><div><strong>Aprobación formal.</strong> Cada política registra órgano aprobador, fecha y versión vigente.</div></div>
              <div className="callout"><ShieldCheck size={15} /><div><strong>Difusión y formación.</strong> La evidencia de capacitación se vincula al personal alcanzado.</div></div>
              <div className="callout"><ShieldCheck size={15} /><div><strong>Revisión periódica.</strong> Las políticas vencidas se marcan como brecha y requieren plan de actualización.</div></div>
            </div>
            <div className="divider" />
            {overduePolicies.length > 0 && <Callout tone="red"><strong>{overduePolicies.length} política(s) con revisión vencida.</strong> Un marco desactualizado debilita la respuesta a nuevas obligaciones y riesgos.</Callout>}
          </Panel>
        </div>
      )}

      {tab === 'controls' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-12">
            <PanelHead title="Matriz de controles internos" subtitle="Riesgo asociado, frecuencia, evidencia exigida, resultado de prueba y deficiencias." actions={<Pill variant={operatingControls.length === controls.length ? 'green' : 'amber'}>{operatingControls.length}/{controls.length} operativos</Pill>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Control</th><th>Riesgo</th><th>Propietario</th><th>Frecuencia</th><th>Evidencia</th><th>Prueba</th><th className="num">Deficiencias</th><th>Estado</th></tr></thead>
                <tbody>
                  {controls.map((c) => (
                    <tr key={c.id}>
                      <td><span className="strong">{c.title}</span><div className="sub">{c.code}</div></td>
                      <td>{label(c.risk)}</td>
                      <td>{c.owner}</td>
                      <td>{label(c.frequency)}</td>
                      <td>{c.evidenceRequired}</td>
                      <td><Pill variant={c.testResult === 'Effective' ? 'green' : c.testResult === 'Deficient' ? 'red' : 'amber'}>{label(c.testResult)}</Pill></td>
                      <td className="num">{c.deficiencies}</td>
                      <td><Pill variant={c.status === 'Operating' ? 'green' : 'red'}>{label(c.status)}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel className="col-7" pad>
            <div className="section-head"><div><h3>Cobertura de controles</h3><p>Controles operativos y deficiencias por estado.</p></div><ClipboardCheck size={15} className="muted" /></div>
            <div className="row" style={{ marginBottom: 4 }}><span style={{ fontSize: 10 }}>Controles operativos</span><span className="micro" style={{ marginLeft: 'auto' }}>{operatingControls.length}/{controls.length}</span></div>
            <Progress value={(operatingControls.length / Math.max(1, controls.length)) * 100} tone="green" height={6} />
            <div className="row" style={{ marginTop: 10, marginBottom: 4 }}><span style={{ fontSize: 10 }}>Controles con deficiencias</span><span className="micro" style={{ marginLeft: 'auto' }}>{controls.filter((c) => c.deficiencies > 0).length}</span></div>
            <Progress value={(controls.filter((c) => c.deficiencies > 0).length / Math.max(1, controls.length)) * 100} tone="red" height={6} />
            <div className="divider" />
            <Callout tone="amber"><strong>Diseño vs. operación.</strong> Un control diseñado puede no estar operando. La prueba de eficacia se registra por separado de la descripción del control.</Callout>
          </Panel>
          <Panel className="col-5" pad>
            <div className="section-head"><div><h3>Resumen de deficiencias</h3><p>Prioridad de remediación.</p></div><AlertTriangle size={15} className="muted" /></div>
            {['Critical', 'High', 'Medium', 'Low'].map((sev) => {
              const count = controls.filter((c) => c.deficiencies > 0 && c.testResult === 'Deficient').length;
              return <div key={sev} className="row" style={{ padding: '5px 0' }}><Pill variant={sev === 'Critical' ? 'red' : sev === 'High' ? 'amber' : 'gray'}>{label(sev)}</Pill><span className="micro" style={{ marginLeft: 'auto' }}>{countLabel(count, 'control deficiente', 'controles deficientes')}</span></div>;
            })}
            <div className="notice" style={{ marginTop: 8 }}>El conteo se basa en el resultado de prueba registrado, no en una estimación estadística.</div>
          </Panel>
        </div>
      )}

      {tab === 'findings' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-12">
            <PanelHead title="Hallazgos de auditoría" subtitle="Severidad, estado, responsable, fecha límite y acción correctiva." actions={<Pill variant={highFindings.length ? 'red' : 'green'}>{countLabel(openFindings.length, 'abierto', 'abiertos')}</Pill>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Hallazgo</th><th>Severidad</th><th>Estado</th><th>Responsable</th><th>Fecha límite</th><th>Acción correctiva</th></tr></thead>
                <tbody>
                  {findings.map((f) => (
                    <tr key={f.id}>
                      <td><span className="strong">{f.title}</span><div className="sub">{f.code} · {f.finding}</div></td>
                      <td><Pill variant={f.severity === 'Critical' ? 'red' : f.severity === 'High' ? 'amber' : 'gray'}>{label(f.severity)}</Pill></td>
                      <td><Pill variant={f.status === 'Closed' ? 'green' : f.status === 'Overdue' ? 'red' : 'amber'}>{label(f.status)}</Pill></td>
                      <td>{f.owner}</td>
                      <td>{dateLabel(f.dueDate)}</td>
                      <td style={{ maxWidth: 280 }}><span className="sub">{label(f.action)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>{countLabel(findings.filter((f) => f.status === 'Closed').length, 'cerrado', 'cerrados')} · {countLabel(findings.filter((f) => f.status === 'Overdue').length, 'vencido', 'vencidos')}</span><span>El cierre requiere evidencia de la acción, no solo la declaración del responsable.</span></div>
          </Panel>
          <Panel className="col-7" pad>
            <div className="section-head"><div><h3>Respuesta a hallazgos</h3><p>Del hallazgo a la acción verificable.</p></div><BadgeCheck size={15} className="muted" /></div>
            <div className="stack">
              <div className="mini-card"><div className="label">1 · Registrar</div><div style={{ fontSize: 10.5, marginTop: 4 }}>Describir el criterio, la condición, la causa y el efecto del hallazgo.</div></div>
              <div className="mini-card"><div className="label">2 · Asignar</div><div style={{ fontSize: 10.5, marginTop: 4 }}>Responsable con autoridad, fecha límite y recursos.</div></div>
              <div className="mini-card"><div className="label">3 · Remediar</div><div style={{ fontSize: 10.5, marginTop: 4 }}>Ejecutar la acción y conservar evidencia verificable.</div></div>
              <div className="mini-card"><div className="label">4 · Verificar</div><div style={{ fontSize: 10.5, marginTop: 4 }}>Probar la eficacia antes de cerrar. Un cierre sin prueba se reabre.</div></div>
            </div>
          </Panel>
          <Panel className="col-5" pad>
            <div className="section-head"><div><h3>Registro de auditoría reciente</h3><p>Trazabilidad de cambios del sistema.</p></div><Lock size={15} className="muted" /></div>
            {auditLogs.slice(0, 6).map((l) => (
              <div key={l.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <div className="row"><div style={{ fontSize: 9.5, flex: 1 }}>{label(l.action)} · {label(l.entity)}</div><span className="mono" style={{ fontSize: 7.5 }}>{l.hash.slice(7, 15)}</span></div>
                <div className="micro">{l.actor} · {dateLabel(l.createdAt)}</div>
              </div>
            ))}
            <div className="divider" />
            <button className="btn sm" onClick={() => actions.navigate('assurance')}>Abrir aseguramiento</button>
          </Panel>
        </div>
      )}

      {tab === 'ethics' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-7" pad>
            <div className="section-head"><div><h3>Ética, integridad y conducta</h3><p>Anticorrupción, conflictos de interés, canal de denuncias y formación.</p></div><Gavel size={15} className="muted" /></div>
            <div className="grid grid-2" style={{ gap: 9 }}>
              <div className="mini-card"><div className="label">Código de conducta</div><div style={{ fontSize: 11, marginTop: 4 }}>{policies.find((p) => /conduct|ética|etica/i.test(p.title))?.title || 'No registrado'}</div><div className="micro">v{policies.find((p) => /conduct|ética|etica/i.test(p.title))?.version || '—'}</div></div>
              <div className="mini-card"><div className="label">Formación en ética</div><div style={{ fontSize: 18, fontWeight: 600, marginTop: 3 }}>{ethicsKpi?.value ?? '—'}<span style={{ fontSize: 9, color: 'var(--muted)' }}> {ethicsKpi?.unit || ''}</span></div><div className="micro">{ethicsKpi?.status || 'sin dato'}</div></div>
              <div className="mini-card"><div className="label">Canal de denuncias</div><div style={{ fontSize: 11, marginTop: 4 }}>Disponible con opción anónima y prohibición de represalias.</div><div className="micro">Casos registrados en el módulo social</div></div>
              <div className="mini-card"><div className="label">Conflictos de interés</div><div style={{ fontSize: 11, marginTop: 4 }}>Declaración anual y revisión por el comité de ética.</div><div className="micro">Evidencia pendiente de carga</div></div>
            </div>
            <div className="divider" />
            <Callout tone="amber"><strong>Transparencia fiscal y lobby.</strong> Las contribuciones políticas, actividades de lobby y estructuras fiscales requieren divulgación específica. La ausencia de registro se declara como brecha, no como ausencia de actividad.</Callout>
          </Panel>
          <Panel className="col-5" pad>
            <div className="section-head"><div><h3>Controles anticorrupción</h3><p>Diseño y evidencia.</p></div><ShieldCheck size={15} className="muted" /></div>
            {controls.filter((c) => /corrup|soborno|bribery|ethics|conducta|conflicto|lobby|fiscal/i.test(`${c.title} ${label(c.risk)}`)).map((c) => (
              <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <div className="row"><div style={{ fontSize: 10.5, fontWeight: 550, flex: 1 }}>{c.title}</div><Pill variant={c.status === 'Operating' ? 'green' : 'red'}>{label(c.status)}</Pill></div>
                <div className="micro">{label(c.frequency)} · prueba: {label(c.testResult)} · {c.deficiencies} deficiencias</div>
              </div>
            ))}
            <div className="divider" />
            <div className="notice">La existencia de un canal de denuncias no demuestra que las personas confíen en él. La confianza requiere independencia, confidencialidad y resultados visibles.</div>
          </Panel>
        </div>
      )}
    </div>
  );
}
