'use client';

import { useState } from 'react';
import { BadgeCheck, ClipboardCheck, FileCheck2, Fingerprint, Lock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Callout, Panel, PanelHead, Pill, Progress, ProgressRow, Tabs } from '@/components/ui';
import { dateLabel, dateTimeLabel } from '@/lib/format';
import type { ViewProps } from './types';

export default function AssuranceView({ workspace }: ViewProps) {
  const [tab, setTab] = useState('evidence');
  const { evidence, controls, findings, auditLogs, dataQuality, company, reports } = workspace;
  const verified = evidence.filter((e) => e.status === 'Verified');
  const pending = evidence.filter((e) => e.status === 'Pending' || e.status === 'Expired');
  const operating = controls.filter((c) => c.status === 'Operating');
  const openFindings = findings.filter((f) => f.status !== 'Closed');
  const highFindings = openFindings.filter((f) => f.severity === 'Critical' || f.severity === 'High');
  const qualityDims = Object.entries(dataQuality).filter(([k]) => k !== 'overall');

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-copy">
          <div className="eyebrow">Aseguramiento, evidencia y control interno</div>
          <h1>Aseguramiento</h1>
          <p>Evidencia, controles, hallazgos, trazabilidad y calidad del dato. La integridad del reporte se sostiene en fuentes verificables, no en la declaración de completitud.</p>
        </div>
        <div className="page-head-actions">
          <Pill variant={highFindings.length ? 'red' : 'green'}>{highFindings.length} hallazgos altos</Pill>
          <Pill variant="blue">{company.assuranceStatus}</Pill>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="panel stat-card"><div className="stat-label"><FileCheck2 size={11} /> Evidencia verificada</div><div className="stat-value">{verified.length}<small>/{evidence.length}</small></div><div className="stat-foot">{pending.length} pendientes o vencidas</div></div>
        <div className="panel stat-card"><div className="stat-label"><ShieldCheck size={11} /> Controles operativos</div><div className="stat-value">{operating.length}<small>/{controls.length}</small></div><div className="stat-foot">{controls.reduce((a, b) => a + b.deficiencies, 0)} deficiencias</div></div>
        <div className="panel stat-card"><div className="stat-label"><ShieldAlert size={11} /> Hallazgos abiertos</div><div className="stat-value" style={{ color: highFindings.length ? 'var(--terracotta)' : 'var(--text)' }}>{openFindings.length}</div><div className="stat-foot">{findings.filter((f) => f.status === 'Overdue').length} vencidos</div></div>
        <div className="panel stat-card"><div className="stat-label"><Fingerprint size={11} /> Data quality</div><div className="stat-value">{dataQuality.overall}<small>/100</small></div><div className="stat-foot">trazabilidad {dataQuality.traceability}%</div></div>
      </div>

      <div style={{ marginTop: 14 }}>
        <Tabs active={tab} onChange={setTab} items={[
          { key: 'evidence', label: 'Evidencia', count: evidence.length },
          { key: 'controls', label: 'Controles', count: controls.length },
          { key: 'findings', label: 'Hallazgos', count: openFindings.length },
          { key: 'audit', label: 'Registro de auditoría', count: auditLogs.length },
          { key: 'quality', label: 'Calidad del dato' },
        ]} />
      </div>

      {tab === 'evidence' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-8">
            <PanelHead title="Repositorio de evidencia" subtitle="Documento, tipo, vínculo, propietario, fecha, estado, tamaño y hash." actions={<Pill variant="gray">{evidence.length} registros</Pill>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Evidencia</th><th>Tipo</th><th>Vinculada a</th><th>Propietario</th><th>Fecha</th><th>Estado</th><th>Hash</th></tr></thead>
                <tbody>
                  {evidence.map((e) => (
                    <tr key={e.id}>
                      <td><span className="strong">{e.name}</span><div className="sub">{e.size}</div></td>
                      <td>{e.type}</td>
                      <td>{e.linkedTo}</td>
                      <td>{e.owner}</td>
                      <td>{dateLabel(e.date)}</td>
                      <td><Pill variant={e.status === 'Verified' ? 'green' : e.status === 'Pending' ? 'amber' : 'red'}>{e.status}</Pill></td>
                      <td><span className="mono" style={{ fontSize: 8 }}>{e.hash.slice(0, 16)}…</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>{verified.length} verificadas · {pending.length} pendientes o vencidas</span><span>El hash identifica el archivo, no certifica su contenido.</span></div>
          </Panel>
          <Panel className="col-4" pad>
            <div className="section-head"><div><h3>Reglas de evidencia</h3><p>Qué hace verificable un dato.</p></div><BadgeCheck size={15} className="muted" /></div>
            <div className="stack">
              <div className="mini-card"><div className="label">Fuente identificable</div><div style={{ fontSize: 10.5, marginTop: 4 }}>El dato debe poder rastrearse a un sistema, documento o medición concreta.</div></div>
              <div className="mini-card"><div className="label">Responsable</div><div style={{ fontSize: 10.5, marginTop: 4 }}>Una persona con nombre y rol responde por la exactitud y oportunidad.</div></div>
              <div className="mini-card"><div className="label">Fecha y vigencia</div><div style={{ fontSize: 10.5, marginTop: 4 }}>La evidencia vencida no respalda un dato del período actual.</div></div>
              <div className="mini-card"><div className="label">Integridad</div><div style={{ fontSize: 10.5, marginTop: 4 }}>El hash y el control de versiones evitan sustituciones silenciosas.</div></div>
            </div>
            <div className="divider" />
            <Callout tone="amber"><strong>Evidencia no es opinión.</strong> Un archivo cargado no equivale a un dato verificado. La verificación requiere revisión y aprobación registradas.</Callout>
          </Panel>
        </div>
      )}

      {tab === 'controls' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-8">
            <PanelHead title="Controles y pruebas" subtitle="Diseño, frecuencia, evidencia exigida, resultado y deficiencias." actions={<Pill variant={operating.length === controls.length ? 'green' : 'amber'}>{operating.length}/{controls.length} operativos</Pill>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Control</th><th>Riesgo</th><th>Propietario</th><th>Frecuencia</th><th>Evidencia requerida</th><th>Resultado</th><th className="num">Deficiencias</th><th>Estado</th></tr></thead>
                <tbody>
                  {controls.map((c) => (
                    <tr key={c.id}>
                      <td><span className="strong">{c.title}</span><div className="sub">{c.code}</div></td>
                      <td>{c.risk}</td>
                      <td>{c.owner}</td>
                      <td>{c.frequency}</td>
                      <td><span className="sub">{c.evidenceRequired}</span></td>
                      <td><Pill variant={c.testResult === 'Effective' ? 'green' : c.testResult === 'Deficient' ? 'red' : 'amber'}>{c.testResult}</Pill></td>
                      <td className="num">{c.deficiencies}</td>
                      <td><Pill variant={c.status === 'Operating' ? 'green' : 'red'}>{c.status}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel className="col-4" pad>
            <div className="section-head"><div><h3>Resultado de pruebas</h3><p>Eficacia operativa.</p></div><ClipboardCheck size={15} className="muted" /></div>
            {['Effective', 'Partially effective', 'Deficient', 'Not tested'].map((r) => {
              const count = controls.filter((c) => c.testResult === r).length;
              return <div key={r} className="row" style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}><span style={{ fontSize: 10, flex: 1 }}>{r}</span><Pill variant={r === 'Effective' ? 'green' : r === 'Deficient' ? 'red' : 'amber'}>{count}</Pill></div>;
            })}
            <div className="divider" />
            <div className="micro" style={{ marginBottom: 4 }}>Cobertura de controles</div>
            <Progress value={(operating.length / Math.max(1, controls.length)) * 100} tone="green" height={6} />
            <div className="notice" style={{ marginTop: 8 }}>Los controles no probados no reducen el riesgo residual. Se presentan como brecha de aseguramiento.</div>
          </Panel>
        </div>
      )}

      {tab === 'findings' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-8">
            <PanelHead title="Hallazgos y acciones correctivas" subtitle="Severidad, estado, responsable, fecha límite, condición y acción." actions={<Pill variant={highFindings.length ? 'red' : 'green'}>{openFindings.length} abiertos</Pill>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Hallazgo</th><th>Severidad</th><th>Estado</th><th>Responsable</th><th>Vencimiento</th><th>Acción</th></tr></thead>
                <tbody>
                  {findings.map((f) => (
                    <tr key={f.id}>
                      <td><span className="strong">{f.title}</span><div className="sub">{f.code} · {f.finding}</div></td>
                      <td><Pill variant={f.severity === 'Critical' ? 'red' : f.severity === 'High' ? 'amber' : 'gray'}>{f.severity}</Pill></td>
                      <td><Pill variant={f.status === 'Closed' ? 'green' : f.status === 'Overdue' ? 'red' : 'amber'}>{f.status}</Pill></td>
                      <td>{f.owner}</td>
                      <td>{dateLabel(f.dueDate)}</td>
                      <td style={{ maxWidth: 260 }}><span className="sub">{f.action}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel className="col-4" pad>
            <div className="section-head"><div><h3>Cierre de hallazgos</h3><p>Criterio de verificación.</p></div><ShieldAlert size={15} className="muted" /></div>
            <div className="callout red"><ShieldAlert size={15} /><div><strong>No cerrar por declaración.</strong> El cierre exige evidencia de la acción ejecutada y una prueba de eficacia. Un hallazgo sin prueba se mantiene abierto.</div></div>
            <div className="divider" />
            <div className="row"><span className="micro">Tasa de cierre</span><span className="micro" style={{ marginLeft: 'auto' }}>{Math.round((findings.filter((f) => f.status === 'Closed').length / Math.max(1, findings.length)) * 100)}%</span></div>
            <ProgressRow value={(findings.filter((f) => f.status === 'Closed').length / Math.max(1, findings.length)) * 100} tone="green" />
            <div className="divider" />
            <div className="micro" style={{ marginBottom: 4 }}>Reportes publicados</div>
            {reports.filter((r) => r.status === 'Published').map((r) => (
              <div key={r.id} className="row" style={{ padding: '4px 0' }}><FileCheck2 size={12} className="muted" /><span style={{ fontSize: 9.5, flex: 1 }}>{r.title}</span><span className="micro">{r.coverage}%</span></div>
            ))}
          </Panel>
        </div>
      )}

      {tab === 'audit' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-8">
            <PanelHead title="Registro de auditoría" subtitle="Registro cronológico de cambios con actor, rol, entidad y hash." actions={<Pill variant="gray">{auditLogs.length} eventos</Pill>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Fecha</th><th>Actor</th><th>Rol</th><th>Acción</th><th>Entidad</th><th>Detalle</th><th>Hash</th></tr></thead>
                <tbody>
                  {auditLogs.map((l) => (
                    <tr key={l.id}>
                      <td>{dateTimeLabel(l.createdAt)}</td>
                      <td>{l.actor}</td>
                      <td>{l.role}</td>
                      <td><Pill variant={l.action === 'CREATED' ? 'green' : l.action === 'UPDATED' ? 'amber' : l.action === 'DELETED' ? 'red' : 'blue'}>{l.action}</Pill></td>
                      <td>{l.entity}<div className="sub">{l.entityId}</div></td>
                      <td style={{ maxWidth: 300 }}><span className="sub">{l.detail}</span></td>
                      <td><span className="mono" style={{ fontSize: 7.5 }}>{l.hash.slice(7, 23)}…</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>{auditLogs.length} eventos registrados</span><span>El registro es append-only en la lógica de aplicación.</span></div>
          </Panel>
          <Panel className="col-4" pad>
            <div className="section-head"><div><h3>Integridad del registro</h3><p>Trazabilidad de cambios.</p></div><Lock size={15} className="muted" /></div>
            <div className="mini-card" style={{ marginBottom: 8 }}><div className="label">Eventos registrados</div><div className="value">{auditLogs.length}</div><div className="foot">cambios de IRO, evaluación, IA y sistema</div></div>
            <div className="mini-card"><div className="label">Actores distintos</div><div className="value">{new Set(auditLogs.map((l) => l.actor)).size}</div><div className="foot">incluye agentes y usuarios del sistema</div></div>
            <div className="divider" />
            <Callout tone="green"><strong>Trazabilidad.</strong> Cada cambio relevante conserva actor, rol, entidad, detalle y hash. La evidencia de auditoría no se reconstruye a partir de la memoria del equipo.</Callout>
            <div className="divider" />
            <div className="notice">El hash es un identificador determinista de los eventos, no una firma criptográfica con clave privada.</div>
          </Panel>
        </div>
      )}

      {tab === 'quality' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-7" pad>
            <div className="section-head"><div><h3>Dimensiones de calidad del dato</h3><p>Cada dimensión se evalúa por separado y no se promedia para ocultar debilidades.</p></div><Fingerprint size={15} className="muted" /></div>
            {qualityDims.map(([key, value]) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <div className="row"><span style={{ fontSize: 10, textTransform: 'capitalize' }}>{key}</span><span className="micro" style={{ marginLeft: 'auto' }}>{value}/100</span></div>
                <Progress value={Number(value)} tone={Number(value) >= 75 ? 'green' : Number(value) >= 55 ? 'amber' : 'red'} height={6} />
              </div>
            ))}
            <div className="divider" />
            <div className="row"><span style={{ fontSize: 11, fontWeight: 600 }}>Índice global</span><span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 600 }}>{dataQuality.overall}<span style={{ fontSize: 10, color: 'var(--muted)' }}>/100</span></span></div>
            <div className="notice" style={{ marginTop: 6 }}>El índice global es una síntesis de lectura, no un sustituto del detalle por dimensión.</div>
          </Panel>
          <Panel className="col-5" pad>
            <div className="section-head"><div><h3>Limitaciones declaradas</h3><p>Lo que la plataforma no puede afirmar.</p></div><ShieldCheck size={15} className="muted" /></div>
            <div className="stack">
              <div className="callout"><ShieldCheck size={15} /><div><strong>Sin opinión de aseguramiento.</strong> La plataforma organiza evidencia y trazabilidad; no emite una conclusión de auditoría.</div></div>
              <div className="callout"><ShieldCheck size={15} /><div><strong>Cobertura parcial.</strong> La cadena de valor de segundo nivel y las emisiones de alcance 3 pueden estar incompletas y se declaran como brecha.</div></div>
            </div>
            <div className="divider" />
            <div className="row"><span className="micro">Estado de aseguramiento</span><Pill variant="blue">{company.assuranceStatus}</Pill></div>
          </Panel>
        </div>
      )}
    </div>
  );
}
