'use client';

import { useState } from 'react';
import { ArrowRight, Factory, Globe2, MapPin, Network, Ship, Users, Warehouse } from 'lucide-react';
import { Callout, MaterialityPill, Panel, PanelHead, Pill, Progress, Tabs } from '@/components/ui';
import { fmt, money } from '@/lib/format';
import type { ViewProps } from './types';

export default function ValueChainView({ workspace, actions }: ViewProps) {
  const [tab, setTab] = useState('map');
  const { valueChainExposure, suppliers, facilities, natureLocations, iros, stakeholders, company } = workspace;
  const upstream = iros.filter((i) => i.stage === 'Upstream');
  const own = iros.filter((i) => i.stage === 'Own operations');
  const downstream = iros.filter((i) => i.stage === 'Downstream');
  const spend = suppliers.reduce((a, b) => a + b.spend, 0);
  const avgTrace = suppliers.length ? Math.round(suppliers.reduce((a, b) => a + b.traceability, 0) / suppliers.length) : 0;
  const highRisk = suppliers.filter((s) => s.risk === 'Critical' || s.risk === 'High');
  const criticalByStage = (stage: string) => iros.filter((i) => i.stage === stage && i.critical).length;

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-copy">
          <div className="eyebrow">Cadena de valor y exposición geográfica</div>
          <h1>Cadena de valor</h1>
          <p>Actividades propias, proveedores, distribución y uso del producto. La exposición se evalúa por etapa, ubicación y relación empresarial, no solo por el perímetro legal.</p>
        </div>
        <div className="page-head-actions">
          <Pill variant="blue">{suppliers.length} proveedores</Pill>
          <Pill variant="amber">{facilities.length} instalaciones</Pill>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="panel stat-card"><div className="stat-label"><Network size={11} /> IRO upstream</div><div className="stat-value">{upstream.length}</div><div className="stat-foot">{criticalByStage('Upstream')} críticos</div></div>
        <div className="panel stat-card"><div className="stat-label"><Factory size={11} /> IRO operaciones propias</div><div className="stat-value">{own.length}</div><div className="stat-foot">{criticalByStage('Own operations')} críticos</div></div>
        <div className="panel stat-card"><div className="stat-label"><Ship size={11} /> IRO downstream</div><div className="stat-value">{downstream.length}</div><div className="stat-foot">{criticalByStage('Downstream')} críticos</div></div>
        <div className="panel stat-card"><div className="stat-label"><Warehouse size={11} /> Trazabilidad media</div><div className="stat-value">{avgTrace}<small>%</small></div><div className="stat-foot">gasto evaluado {money(spend)}</div></div>
      </div>

      <div style={{ marginTop: 14 }}>
        <Tabs active={tab} onChange={setTab} items={[
          { key: 'map', label: 'Mapa de cadena' },
          { key: 'upstream', label: 'Upstream y proveedores', count: suppliers.length },
          { key: 'operations', label: 'Operaciones propias', count: facilities.length },
          { key: 'downstream', label: 'Downstream y uso', count: downstream.length },
          { key: 'locations', label: 'Geografía y naturaleza', count: natureLocations.length },
        ]} />
      </div>

      {tab === 'map' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-12" pad>
            <div className="section-head"><div><h3>Exposición por etapa de la cadena de valor</h3><p>Intensidad de impacto, exposición financiera y número de IRO por etapa.</p></div><Pill variant="gray">{company.sector}</Pill></div>
            <div className="value-chain">
              {valueChainExposure.map((s, idx) => (
                <div className="vc-stage" key={s.stage}>
                  <div className="vc-card">
                    <div className="vc-num">0{idx + 1}</div>
                    <div className="vc-name">{s.stage}</div>
                    <div className="vc-bar"><i style={{ width: `${Math.min(100, s.impact * 20)}%` }} /></div>
                    <div className="vc-meta"><span>Imp {s.impact.toFixed(1)}</span><span>Fin {s.financial.toFixed(1)}</span></div>
                    <div className="vc-meta"><span>{s.count} IRO</span></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="divider" />
            <div className="grid grid-3">
              {valueChainExposure.map((s) => (
                <div key={s.stage} className="mini-card">
                  <div className="label">{s.stage}</div>
                  <div className="value">{s.count}</div>
                  <div className="foot">impacto medio {s.impact.toFixed(1)} · financiero medio {s.financial.toFixed(1)}</div>
                  <div className="row" style={{ marginTop: 6 }}><Pill variant={s.impact >= 3.2 ? 'red' : 'gray'}>Impacto {s.impact >= 3.2 ? 'material' : 'bajo umbral'}</Pill><Pill variant={s.financial >= 3.2 ? 'blue' : 'gray'}>Financiero {s.financial >= 3.2 ? 'material' : 'bajo umbral'}</Pill></div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel className="col-7" pad>
            <div className="section-head"><div><h3>Relaciones empresariales críticas</h3><p>Proveedores y socios con mayor exposición.</p></div><Globe2 size={15} className="muted" /></div>
            {highRisk.slice(0, 6).map((s) => (
              <div key={s.id} className="row" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 10.5, fontWeight: 550 }}>{s.name}</div><div className="micro">{s.country} · {s.sector} · evaluación {s.assessment}%</div></div>
                <Pill variant={s.risk === 'Critical' ? 'red' : 'amber'}>{s.risk}</Pill>
              </div>
            ))}
            {highRisk.length === 0 && <div className="table-empty">No hay proveedores de alto riesgo registrados.</div>}
          </Panel>
          <Panel className="col-5" pad>
            <div className="section-head"><div><h3>Concentración</h3><p>Dependencia de relaciones clave.</p></div><Users size={15} className="muted" /></div>
            <div className="mini-card" style={{ marginBottom: 8 }}><div className="label">Gasto con proveedores alto riesgo</div><div className="value" style={{ fontSize: 16 }}>{money(highRisk.reduce((a, b) => a + b.spend, 0))}</div><div className="foot">{spend > 0 ? Math.round((highRisk.reduce((a, b) => a + b.spend, 0) / spend) * 100) : 0}% del gasto evaluado</div></div>
            <div className="mini-card"><div className="label">Proveedores con auditoría</div><div className="value">{suppliers.filter((s) => s.audit !== 'None').length}<span style={{ fontSize: 11, color: 'var(--muted)' }}>/{suppliers.length}</span></div><div className="foot">cobertura de auditoría de segundo nivel</div></div>
            <div className="divider" />
            <Callout tone="amber"><strong>Perímetro de cadena de valor.</strong> La información de proveedores de segundo nivel es parcial. La ausencia de datos no implica ausencia de impacto; se declara como limitación.</Callout>
          </Panel>
        </div>
      )}

      {tab === 'upstream' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-8">
            <PanelHead title="Proveedores y materias primas" subtitle="Riesgo, gasto, evaluación, auditoría, certificaciones y trazabilidad." actions={<Pill variant="amber">{highRisk.length} alto riesgo</Pill>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Proveedor</th><th>País</th><th>Sector</th><th>Riesgo</th><th className="num">Gasto</th><th className="num">Evaluación</th><th>Certificaciones</th><th className="num">Trazabilidad</th></tr></thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id}>
                      <td><span className="strong">{s.name}</span><div className="sub">{s.audit === 'None' ? 'Sin auditoría' : `Auditoría: ${s.audit}`}</div></td>
                      <td>{s.country}</td>
                      <td>{s.sector}</td>
                      <td><Pill variant={s.risk === 'Critical' ? 'red' : s.risk === 'High' ? 'amber' : 'gray'}>{s.risk}</Pill></td>
                      <td className="num">{money(s.spend)}</td>
                      <td className="num"><span style={{ color: s.assessment < 60 ? 'var(--terracotta)' : 'inherit' }}>{s.assessment}%</span></td>
                      <td style={{ maxWidth: 170 }}><span className="sub">{s.certifications || '—'}</span></td>
                      <td className="num">{s.traceability}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel className="col-4" pad>
            <div className="section-head"><div><h3>IRO upstream</h3><p>Impactos y riesgos en la cadena de suministro.</p></div><Network size={15} className="muted" /></div>
            {upstream.map((i) => (
              <div key={i.id} className="iro-item" onClick={() => actions.openIRO(i)}>
                <span className={`iro-mark ${i.materiality}`} />
                <div className="iro-body"><div className="iro-code">{i.code} · {i.type}</div><div className="iro-title">{i.title}</div><div className="iro-meta"><span>{i.topicName}</span>{i.rights && i.rights !== '—' && <><span className="dot-sep" /><span style={{ color: 'var(--terracotta)' }}>Derechos</span></>}</div></div>
              </div>
            ))}
            {upstream.length === 0 && <div className="table-empty">No hay IRO upstream registrados.</div>}
          </Panel>
        </div>
      )}

      {tab === 'operations' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-8">
            <PanelHead title="Instalaciones operativas" subtitle="Ubicación, tipo, empleados, estrés hídrico, área protegida y certificación." actions={<Pill variant="gray">{facilities.length} sitios</Pill>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Instalación</th><th>País / región</th><th>Tipo</th><th className="num">Empleados</th><th>Estrés hídrico</th><th>Área protegida</th><th>Certificación</th></tr></thead>
                <tbody>
                  {facilities.map((f) => (
                    <tr key={f.id}>
                      <td><span className="strong">{f.name}</span><div className="sub">{f.lat.toFixed(2)}, {f.lng.toFixed(2)}</div></td>
                      <td>{f.country}<div className="sub">{f.region}</div></td>
                      <td>{f.type}</td>
                      <td className="num">{fmt(f.employees)}</td>
                      <td><Pill variant={/Extremely|High/i.test(f.waterStress) ? 'red' : /Medium/i.test(f.waterStress) ? 'amber' : 'green'}>{f.waterStress}</Pill></td>
                      <td>{f.protectedArea ? <Pill variant="red">Sí</Pill> : 'No'}</td>
                      <td>{f.certification || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel className="col-4" pad>
            <div className="section-head"><div><h3>Exposición operativa</h3><p>Agua, protección y certificación.</p></div><Factory size={15} className="muted" /></div>
            <div className="mini-card" style={{ marginBottom: 8 }}><div className="label">Sitios en estrés hídrico alto</div><div className="value">{facilities.filter((f) => /Extremely|High/i.test(f.waterStress)).length}</div><div className="foot">de {facilities.length} instalaciones</div></div>
            <div className="mini-card" style={{ marginBottom: 8 }}><div className="label">Sitios en áreas protegidas</div><div className="value">{facilities.filter((f) => f.protectedArea).length}</div><div className="foot">requieren evaluación de biodiversidad</div></div>
            <div className="mini-card"><div className="label">Empleados en operaciones</div><div className="value">{fmt(facilities.reduce((a, b) => a + b.employees, 0))}</div><div className="foot">fuerza laboral registrada</div></div>
            <div className="divider" />
            <div className="micro" style={{ marginBottom: 6 }}>IRO en operaciones propias</div>
            {own.slice(0, 4).map((i) => (
              <div key={i.id} className="row" style={{ padding: '5px 0', borderBottom: '1px solid var(--line)', cursor: 'pointer' }} onClick={() => actions.openIRO(i)}>
                <span className={`iro-mark ${i.materiality}`} style={{ height: 18 }} />
                <span style={{ fontSize: 9.5, flex: 1 }}>{i.title}</span>
                <MaterialityPill value={i.materiality} />
              </div>
            ))}
          </Panel>
        </div>
      )}

      {tab === 'downstream' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-7" pad>
            <div className="section-head"><div><h3>Downstream, uso y fin de vida</h3><p>Impactos en distribución, clientes y disposición final.</p></div><Ship size={15} className="muted" /></div>
            {downstream.map((i) => (
              <div key={i.id} className="iro-item" onClick={() => actions.openIRO(i)}>
                <span className={`iro-mark ${i.materiality}`} />
                <div className="iro-body"><div className="iro-code">{i.code} · {i.type} · {i.actuality}</div><div className="iro-title">{i.title}</div><div className="iro-meta"><span>{i.topicName}</span><span className="dot-sep" /><span>{i.location}</span><span className="dot-sep" /><span>{i.horizon}</span></div></div>
                <div className="iro-scores"><span className="badge amber">Imp {i.impactScore.toFixed(1)}</span><span className="badge blue">Fin {i.financialScore.toFixed(1)}</span></div>
              </div>
            ))}
            {downstream.length === 0 && <div className="table-empty">No hay IRO downstream registrados.</div>}
            <div className="divider" />
            <Callout tone="amber"><strong>Uso del producto.</strong> Los impactos en la fase de uso pueden ser mayores que los operativos. Se reportan por separado y no se compensan con reducciones en la operación propia.</Callout>
          </Panel>
          <Panel className="col-5" pad>
            <div className="section-head"><div><h3>Grupos afectados downstream</h3><p>Clientes, comunidades y usuarios finales.</p></div><Users size={15} className="muted" /></div>
            {stakeholders.filter((s) => /customer|cliente|consumer|consumidor|community|comunidad/i.test(s.category)).map((s) => (
              <div key={s.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <div className="row"><div style={{ fontSize: 10.5, fontWeight: 550, flex: 1 }}>{s.name}</div><Pill variant={s.vulnerability >= 4 ? 'red' : 'gray'}>Vulnerabilidad {s.vulnerability}/5</Pill></div>
                <div className="micro">{s.category} · {s.location}</div>
              </div>
            ))}
            <div className="divider" />
            <div className="row"><span className="micro">Exposición de la cadena</span><span className="micro" style={{ marginLeft: 'auto' }}>{company.financialExposure}/100</span></div>
            <Progress value={company.financialExposure} tone="ocean" height={6} />
            <div className="notice" style={{ marginTop: 8 }}>La exposición financiera es una lectura agregada del modelo y no sustituye el análisis de cada riesgo.</div>
          </Panel>
        </div>
      )}

      {tab === 'locations' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-7">
            <PanelHead title="Geografía y naturaleza" subtitle="Ubicaciones con estrés hídrico, ecosistema y protección." actions={<Pill variant="gray">{natureLocations.length} sitios</Pill>} />
            <div className="panel-body" style={{ paddingTop: 8 }}>
              <div className="map-shell" style={{ minHeight: 280 }}>
                <div className="map-grid" /><div className="map-land" />
                {natureLocations.map((loc) => {
                  const left = Math.max(8, Math.min(92, ((loc.lng + 86) / 70) * 100));
                  const top = Math.max(12, Math.min(88, ((26 - loc.lat) / 58) * 100));
                  return <div key={loc.id} className={`map-point ${loc.risk === 'High' ? 'high' : loc.risk === 'Low' ? 'low' : ''}`} style={{ left: `${left}%`, top: `${top}%` }} title={`${loc.name} · ${loc.ecosystem} · ${loc.waterStress}`}><span>{loc.name.split(' ')[0]}</span></div>;
                })}
                <div className="map-caption">Esquema de ubicaciones · no es una capa GIS certificada</div>
                <div className="map-legend"><span>● Alto</span><span>● Medio</span><span>● Bajo</span></div>
              </div>
            </div>
          </Panel>
          <Panel className="col-5">
            <PanelHead title="Detalle de ubicaciones" subtitle="Dependencia, impacto y riesgo de naturaleza." />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Ubicación</th><th>Ecosistema</th><th>Estrés</th><th>Riesgo</th></tr></thead>
                <tbody>
                  {natureLocations.map((l) => (
                    <tr key={l.id}><td><span className="strong">{l.name}</span><div className="sub">{l.country}{l.protected ? ' · área protegida' : ''}</div></td><td>{l.ecosystem}</td><td>{l.waterStress}</td><td><Pill variant={l.risk === 'High' ? 'red' : l.risk === 'Low' ? 'green' : 'amber'}>{l.risk}</Pill></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="panel-body" style={{ paddingTop: 0 }}>
              <div className="divider" />
              <button className="btn sm" onClick={() => actions.navigate('climate')}>Abrir evaluación LEAP <ArrowRight size={12} /></button>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
