'use client';

import { useState } from 'react';
import { Building2, ChevronRight, Factory, Globe2, Landmark, Network, ShieldCheck, Users } from 'lucide-react';
import { Callout, MaterialityPill, Panel, PanelHead, Pill, ProgressRow, Tabs } from '@/components/ui';
import { dateLabel, fmt, money } from '@/lib/format';
import type { ViewProps } from './types';

export default function ProfileView({ workspace, actions }: ViewProps) {
  const { company, facilities, policies, stakeholders, materialityTopics } = workspace;
  const [tab, setTab] = useState('identity');
  const boardKpi = workspace.kpis.find((k) => /board independence|independencia/i.test(k.name));
  const womenKpi = workspace.kpis.find((k) => /women in leadership|mujeres/i.test(k.name));
  const topMaterial = materialityTopics.filter((t) => t.materiality !== 'not').slice(0, 6);

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-copy">
          <div className="eyebrow">Expediente ESG corporativo</div>
          <h1>{company.name}</h1>
          <p>Identidad, estructura, modelo de negocio, cadena de valor y gobierno. Este expediente es la base de contexto para la evaluación de doble materialidad y la divulgación.</p>
        </div>
        <div className="page-head-actions">
          <Pill variant="green">Dossier actualizado</Pill>
          <button className="btn" onClick={() => actions.navigate('valuechain')}><Network size={13} /> Ver cadena de valor</button>
        </div>
      </div>

      <div className="grid grid-12">
        <Panel className="col-8" pad>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div className="company-monogram" style={{ width: 54, height: 54, borderRadius: 13, fontSize: 17, flex: '0 0 54px' }}>{company.shortName.slice(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div className="eyebrow">{company.sector} · {company.subsector}</div>
              <h2 style={{ marginTop: 4 }}>{company.name}</h2>
              <div className="row wrap" style={{ marginTop: 8 }}>
                <Pill variant="gray">{company.country} · {company.city}</Pill>
                <Pill variant="gray">Fundada en {company.founded}</Pill>
                <Pill variant="gray">{company.maturity}</Pill>
                <Pill variant="blue">{company.assuranceStatus}</Pill>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="micro">Ingresos reportados</div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{money(company.revenue, company.currency)}</div>
              <div className="micro">{fmt(company.employees)} empleados · {workspace.facilities.length} instalaciones</div>
            </div>
          </div>
          <div className="divider" />
          <div className="grid grid-3" style={{ gap: 14 }}>
            <div><div className="micro">Propósito</div><p style={{ fontSize: 11, marginTop: 4, color: 'var(--text-2)' }}>{company.purpose}</p></div>
            <div><div className="micro">Estrategia de sostenibilidad</div><p style={{ fontSize: 11, marginTop: 4, color: 'var(--text-2)' }}>{company.strategy}</p></div>
            <div><div className="micro">Alcance del dossier</div><p style={{ fontSize: 11, marginTop: 4, color: 'var(--text-2)' }}>{workspace.assessment?.scope || 'Operaciones propias y cadena de valor'}. Período {workspace.assessment?.period || 'FY2026'}.</p></div>
          </div>
        </Panel>
        <Panel className="col-4">
          <PanelHead title="Señales de contexto" subtitle="Lectura ejecutiva del perfil" />
          <div className="panel-body" style={{ paddingTop: 10 }}>
            <div className="stack" style={{ gap: 9 }}>
              <div className="row"><Globe2 size={14} className="muted" /><span style={{ fontSize: 10 }}>Exposición climática</span><span className="micro" style={{ marginLeft: 'auto' }}>{company.climateExposure}/100</span></div>
              <ProgressRow value={company.climateExposure} tone="amber" />
              <div className="row"><Factory size={14} className="muted" /><span style={{ fontSize: 10 }}>Dependencia de naturaleza</span><span className="micro" style={{ marginLeft: 'auto' }}>{company.natureDependency}/100</span></div>
              <ProgressRow value={company.natureDependency} tone="green" />
              <div className="row"><Landmark size={14} className="muted" /><span style={{ fontSize: 10 }}>Exposición financiera</span><span className="micro" style={{ marginLeft: 'auto' }}>{company.financialExposure}/100</span></div>
              <ProgressRow value={company.financialExposure} tone="ocean" />
            </div>
            <div className="divider" />
            <Callout tone="amber"><strong>Perímetro.</strong> El dossier no equivale a una opinión legal ni a una validación de aseguramiento. La estructura societaria completa requiere registro mercantil y evidencia de control.</Callout>
          </div>
        </Panel>

        <div className="col-12">
          <Tabs
            active={tab}
            onChange={setTab}
            items={[
              { key: 'identity', label: 'Identidad y estructura' },
              { key: 'model', label: 'Modelo de negocio' },
              { key: 'valuechain', label: 'Cadena de valor' },
              { key: 'governance', label: 'Gobierno y políticas' },
              { key: 'stakeholders', label: 'Grupos de interés' },
            ]}
          />
        </div>

        {tab === 'identity' && (
          <>
            <Panel className="col-7" pad>
              <div className="section-head"><div><h3>Estructura de propiedad y control</h3><p>Representación del perímetro registrado en la plataforma.</p></div></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="mini-card" style={{ borderColor: 'rgba(201,155,81,.3)' }}>
                  <div className="row"><Landmark size={14} className="text-g" /><div><div className="label">Organización propietaria</div><div style={{ fontSize: 12, fontWeight: 600 }}>{workspace.organization?.name}</div></div><Pill variant="amber" className="ml-auto">Portfolio</Pill></div>
                </div>
                <div style={{ paddingLeft: 20, borderLeft: '1px solid var(--line-strong)', marginLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="mini-card">
                    <div className="row"><Building2 size={14} /><div><div className="label">Entidad legal evaluada</div><div style={{ fontSize: 12, fontWeight: 600 }}>{company.name}</div><div className="micro">{company.country} · {company.website}</div></div><Pill variant="green" className="ml-auto">100%</Pill></div>
                  </div>
                  {facilities.map((f) => (
                    <div key={f.id} className="mini-card" style={{ marginLeft: 12 }}>
                      <div className="row"><Factory size={13} className="muted" /><div><div className="label">{f.type}</div><div style={{ fontSize: 11, fontWeight: 550 }}>{f.name}</div><div className="micro">{f.region}, {f.country} · {fmt(f.employees)} personas · {f.certification}</div></div><Pill variant={f.waterStress.includes('Extremely') ? 'red' : 'gray'} className="ml-auto">{f.waterStress}</Pill></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="notice" style={{ marginTop: 12 }}>La cadena de propiedad y control mostrada es una simplificación de la estructura registrada. Las participaciones minoritarias, acuerdos parasociales y entidades fuera del perímetro deben documentarse en el expediente legal.</div>
            </Panel>
            <Panel className="col-5" pad>
              <div className="section-head"><div><h3>Datos corporativos</h3><p>Metadatos mínimos del expediente.</p></div></div>
              <dl className="info-list">
                <div className="info-row"><dt>Razón social</dt><dd>{company.name}</dd></div>
                <div className="info-row"><dt>Nombre comercial</dt><dd>{company.shortName}</dd></div>
                <div className="info-row"><dt>País de constitución</dt><dd>{company.country}</dd></div>
                <div className="info-row"><dt>Sector económico</dt><dd>{company.sector}</dd></div>
                <div className="info-row"><dt>Actividad principal</dt><dd>{company.subsector}</dd></div>
                <div className="info-row"><dt>Empleados</dt><dd>{fmt(company.employees)}</dd></div>
                <div className="info-row"><dt>Facturación</dt><dd>{money(company.revenue, company.currency)}</dd></div>
                <div className="info-row"><dt>CEO</dt><dd>{company.ceo}</dd></div>
                <div className="info-row"><dt>Responsable ESG</dt><dd>{company.csOfficer}</dd></div>
                <div className="info-row"><dt>Última actualización</dt><dd>{dateLabel(company.updatedAt)}</dd></div>
              </dl>
            </Panel>
          </>
        )}

        {tab === 'model' && (
          <>
            <Panel className="col-8" pad>
              <div className="section-head"><div><h3>Modelo de negocio</h3><p>Propuesta de valor, recursos, dependencias y mercados.</p></div></div>
              <div className="grid grid-2" style={{ gap: 10 }}>
                {[
                  ['Propuesta de valor', company.purpose],
                  ['Actividades principales', `${company.subsector}. Operación de ${workspace.facilities.length} instalaciones y una cadena de suministro multinacional.`],
                  ['Recursos clave', 'Capital humano, licencia social, concesiones, infraestructura, datos operativos y relaciones con proveedores críticos.'],
                  ['Clientes y mercados', `${company.country} y mercados de exportación. Ingresos reportados de ${money(company.revenue, company.currency)}.`],
                  ['Dependencias críticas', `Agua, energía, capital natural y estabilidad regulatoria. Dependencia de naturaleza: ${company.natureDependency}/100.`],
                  ['Costos y márgenes', 'Los costos de transición y remediación se gestionan en el módulo de riesgos y en el registro IRO.'],
                ].map(([label, text]) => (
                  <div key={label} className="mini-card"><div className="label">{label}</div><p style={{ fontSize: 10.5, marginTop: 6, color: 'var(--text-2)' }}>{text}</p></div>
                ))}
              </div>
            </Panel>
            <Panel className="col-4" pad>
              <div className="section-head"><div><h3>Asuntos materiales</h3><p>Conexión entre modelo y materialidad.</p></div></div>
              <div className="stack" style={{ gap: 7 }}>
                {topMaterial.map((t) => (
                  <div key={t.code} className="row" style={{ alignItems: 'flex-start' }}>
                    <span className={`iro-mark ${t.materiality}`} style={{ height: 26 }} />
                    <div style={{ flex: 1 }}><div style={{ fontSize: 10.5, fontWeight: 550 }}>{t.name}</div><div className="micro">{t.esrs} · {t.count} IRO</div></div>
                    <MaterialityPill value={t.materiality} />
                  </div>
                ))}
              </div>
            </Panel>
          </>
        )}

        {tab === 'valuechain' && (
          <Panel className="col-12" pad>
            <div className="section-head"><div><h3>Cadena de valor registrada</h3><p>Actividades propias, upstream y downstream con exposición ESG.</p></div><div className="section-head-actions"><button className="btn sm" onClick={() => actions.navigate('valuechain')}>Abrir mapa completo <ChevronRight size={12} /></button></div></div>
            <div className="value-chain">
              {workspace.valueChainExposure.map((s, idx) => (
                <div className="vc-stage" key={s.stage}>
                  <div className="vc-card"><div className="vc-num">0{idx + 1}</div><div className="vc-name">{s.stage}</div><div className="vc-bar"><i style={{ width: `${s.impact * 20}%` }} /></div><div className="vc-meta"><span>Imp {s.impact}</span><span>Fin {s.financial}</span></div><div className="vc-meta"><span>{s.count} IRO</span></div></div>
                </div>
              ))}
            </div>
            <div className="grid grid-3" style={{ marginTop: 12 }}>
              {workspace.iros.filter((i) => i.stage === 'Upstream').slice(0, 3).map((i) => (
                <div key={i.id} className="mini-card" style={{ cursor: 'pointer' }} onClick={() => actions.openIRO(i)}><div className="label">{i.code} · Upstream</div><div style={{ fontSize: 11, fontWeight: 550, marginTop: 4 }}>{i.title}</div><div className="micro" style={{ marginTop: 4 }}>{i.topicName} · {i.location}</div></div>
              ))}
            </div>
          </Panel>
        )}

        {tab === 'governance' && (
          <>
            <Panel className="col-7" pad>
              <div className="section-head"><div><h3>Gobierno corporativo</h3><p>Órganos, responsabilidades y supervisión ESG.</p></div></div>
              <div className="grid grid-2" style={{ gap: 10 }}>
                <div className="mini-card"><div className="label">CEO</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{company.ceo}</div><div className="micro">Responsable de la estrategia y de la rendición de cuentas.</div></div>
                <div className="mini-card"><div className="label">Chief Sustainability Officer</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{company.csOfficer}</div><div className="micro">Coordina materialidad, desempeño y divulgación.</div></div>
                <div className="mini-card"><div className="label">Independencia del consejo</div><div style={{ fontSize: 18, fontWeight: 600, marginTop: 3 }}>{boardKpi?.value ?? '—'}%</div><div className="micro">Objetivo: {boardKpi?.target ?? '—'}% · {boardKpi?.status}</div></div>
                <div className="mini-card"><div className="label">Mujeres en liderazgo</div><div style={{ fontSize: 18, fontWeight: 600, marginTop: 3 }}>{womenKpi?.value ?? '—'}%</div><div className="micro">Objetivo: {womenKpi?.target ?? '—'}% · {womenKpi?.status}</div></div>
              </div>
              <div className="divider" />
              <div className="callout"><ShieldCheck size={15} /><div><strong>Supervisión.</strong> El comité de sostenibilidad reporta al consejo. La aprobación de la doble materialidad y del informe anual requiere quórum y acta; el flujo está registrado en el módulo de aseguramiento.</div></div>
            </Panel>
            <Panel className="col-5" pad>
              <div className="section-head"><div><h3>Políticas corporativas</h3><p>Versiones y estado de revisión.</p></div></div>
              {policies.map((p) => (
                <div key={p.id} className="row" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 10.5, fontWeight: 550 }}>{p.title}</div><div className="micro">{p.code} · v{p.version} · {p.owner}</div></div>
                  <Pill variant={p.status === 'Active' ? 'green' : p.status.includes('overdue') ? 'red' : 'amber'}>{p.status}</Pill>
                </div>
              ))}
            </Panel>
          </>
        )}

        {tab === 'stakeholders' && (
          <Panel className="col-12" pad>
            <div className="section-head"><div><h3>Grupos de interés</h3><p>Intereses, derechos, exposición y canales de relacionamiento.</p></div><div className="section-head-actions"><button className="btn sm" onClick={() => actions.navigate('social')}>Abrir relacionamiento</button></div></div>
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Grupo</th><th>Categoría</th><th>Relación</th><th className="num">Influencia</th><th className="num">Exposición</th><th className="num">Vulnerabilidad</th><th>Intereses</th><th>Último contacto</th></tr></thead>
                <tbody>
                  {stakeholders.map((s) => (
                    <tr key={s.id}>
                      <td><span className="strong">{s.name}</span><div className="sub">{s.location}</div></td>
                      <td><Pill variant="gray">{s.category}</Pill></td>
                      <td>{s.relation}</td>
                      <td className="num">{s.influence}/5</td>
                      <td className="num">{s.exposure}/5</td>
                      <td className="num"><span style={{ color: s.vulnerability >= 4 ? 'var(--terracotta)' : 'inherit' }}>{s.vulnerability}/5</span></td>
                      <td style={{ maxWidth: 220 }}><span className="sub">{s.interests}</span></td>
                      <td>{dateLabel(s.lastEngagement)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
