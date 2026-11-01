'use client';

import { useState } from 'react';
import { ArrowRight, Coins, Compass, ShieldAlert, Target, TrendingUp } from 'lucide-react';
import { OpportunityBars, RiskHeatmap } from '@/components/charts';
import { Callout, MaterialityPill, Panel, PanelHead, Pill, ProgressRow, Tabs } from '@/components/ui';
import { money } from '@/lib/format';
import type { ViewProps } from './types';

export default function RisksView({ workspace, actions }: ViewProps) {
  const [tab, setTab] = useState('register');
  const { iros, riskHeatmap, controls, findings, company } = workspace;
  const risks = iros.filter((i) => i.type === 'Risk');
  const opportunities = iros.filter((i) => i.type === 'Opportunity');
  const highRisks = risks.filter((i) => (i.inherent || 0) >= 3.5 || i.financialScore >= 3.5);
  const criticalRisks = risks.filter((i) => i.critical);
  const investment = opportunities.reduce((a, b) => a + (b.investment || 0), 0);
  const benefit = opportunities.reduce((a, b) => a + (b.benefit || 0), 0);
  const residualGap = risks.filter((r) => (r.inherent || 0) > (r.residual || 0)).length;
  const avgResidual = risks.length ? risks.reduce((a, b) => a + (b.residual || 0), 0) / risks.length : 0;

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-copy">
          <div className="eyebrow">Inteligencia de riesgos y oportunidades</div>
          <h1>Riesgos y oportunidades</h1>
          <p>Exposición financiera, probabilidad, magnitud, efecto financiero, controles y riesgo residual. Los riesgos y oportunidades se leen junto a la materialidad de impacto, sin compensación.</p>
        </div>
        <div className="page-head-actions">
          <Pill variant={criticalRisks.length ? 'red' : 'green'}>{criticalRisks.length} riesgos críticos</Pill>
          <Pill variant="blue">Exposición {company.financialExposure}/100</Pill>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="panel stat-card"><div className="stat-label"><ShieldAlert size={11} /> Riesgos registrados</div><div className="stat-value">{risks.length}</div><div className="stat-foot">{highRisks.length} con exposición alta · {criticalRisks.length} críticos</div></div>
        <div className="panel stat-card"><div className="stat-label"><TrendingUp size={11} /> Riesgo residual medio</div><div className="stat-value">{avgResidual.toFixed(1)}<small>/5</small></div><div className="stat-foot">{residualGap} riesgos con reducción por controles</div></div>
        <div className="panel stat-card"><div className="stat-label"><Compass size={11} /> Oportunidades</div><div className="stat-value" style={{ color: '#6fbf8f' }}>{opportunities.length}</div><div className="stat-foot">oportunidad de transición {company.transitionOpportunity}/100</div></div>
        <div className="panel stat-card"><div className="stat-label"><Coins size={11} /> Inversión / beneficio</div><div className="stat-value" style={{ fontSize: 19 }}>{money(investment)} <span style={{ color: 'var(--muted)' }}>/</span> {money(benefit)}</div><div className="stat-foot">CAPEX estimado / beneficio anual</div></div>
      </div>

      <div style={{ marginTop: 14 }}>
        <Tabs active={tab} onChange={setTab} items={[
          { key: 'register', label: 'Registro de riesgos', count: risks.length },
          { key: 'heatmap', label: 'Mapa de calor' },
          { key: 'opportunities', label: 'Oportunidades', count: opportunities.length },
          { key: 'controls', label: 'Controles y mitigación' },
        ]} />
      </div>

      {tab === 'register' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-12">
            <PanelHead title="Registro de riesgos" subtitle="Probabilidad, magnitud, efecto financiero, controles, inherente y residual." actions={<Pill variant="gray">{risks.length} riesgos</Pill>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Riesgo</th><th>Asunto</th><th>Horizonte</th><th className="num">Prob.</th><th className="num">Magnitud</th><th className="num">Financiero</th><th className="num">Inherente</th><th className="num">Residual</th><th>Materialidad</th><th>Estado</th></tr></thead>
                <tbody>
                  {risks.map((r) => (
                    <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => actions.openIRO(r)}>
                      <td><span className="strong">{r.title}</span><div className="sub"><span className="mono">{r.code}</span> · {r.owner}</div></td>
                      <td>{r.topicName}<div className="sub">{r.esrs}</div></td>
                      <td>{r.horizon || '—'}</td>
                      <td className="num">{r.financialLikelihood ?? '—'}/5</td>
                      <td className="num">{r.financialMagnitude ?? '—'}/5</td>
                      <td className="num">{r.financialScore.toFixed(1)}</td>
                      <td className="num">{r.inherent ?? '—'}</td>
                      <td className="num"><span style={{ color: (r.residual || 0) >= 4 ? 'var(--terracotta)' : 'inherit' }}>{r.residual ?? '—'}</span></td>
                      <td><MaterialityPill value={r.materiality} /></td>
                      <td>{r.critical ? <Pill variant="red">Crítico</Pill> : <Pill variant={r.status === 'Approved' ? 'green' : 'gray'}>{r.status}</Pill>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>La puntuación financiera no neutraliza la severidad de impacto.</span><span>Efecto financiero cualitativo disponible en la ficha de cada riesgo.</span></div>
          </Panel>
          <Panel className="col-7" pad>
            <div className="section-head"><div><h3>Riesgos críticos</h3><p>Prioridad por exposición y derechos.</p></div><ShieldAlert size={15} className="muted" /></div>
            {criticalRisks.slice(0, 5).map((r) => (
              <div key={r.id} className="iro-item" onClick={() => actions.openIRO(r)}>
                <span className={`iro-mark ${r.materiality}`} />
                <div className="iro-body"><div className="iro-code">{r.code} · {r.horizon}</div><div className="iro-title">{r.title}</div><div className="iro-meta"><span>{r.topicName}</span><span className="dot-sep" /><span>{r.location}</span></div></div>
                <div className="iro-scores"><span className="badge red">Fin {r.financialScore.toFixed(1)}</span></div>
              </div>
            ))}
            {criticalRisks.length === 0 && <div className="table-empty">No hay riesgos clasificados como críticos.</div>}
          </Panel>
          <Panel className="col-5" pad>
            <div className="section-head"><div><h3>Lectura ejecutiva</h3><p>Cómo usar el registro.</p></div><Target size={15} className="muted" /></div>
            <div className="stack">
              <div className="mini-card"><div className="label">Riesgo inherente</div><div style={{ fontSize: 10.5, marginTop: 4 }}>Exposición antes de controles. Permite comparar la gravedad real de la exposición.</div></div>
              <div className="mini-card"><div className="label">Riesgo residual</div><div style={{ fontSize: 10.5, marginTop: 4 }}>Exposición después de controles, solo si su eficacia está probada. No se reduce por diseño.</div></div>
              <div className="mini-card"><div className="label">Efecto financiero</div><div style={{ fontSize: 10.5, marginTop: 4 }}>Se describe por separado del impacto social o ambiental. No se agrega en un score único.</div></div>
            </div>
            <div className="divider" />
            <Callout tone="amber"><strong>Horizonte.</strong> Los riesgos de corto, medio y largo plazo se evalúan con el mismo rigor. Un impacto futuro grave no es menos relevante por su lejanía.</Callout>
          </Panel>
        </div>
      )}

      {tab === 'heatmap' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-7">
            <PanelHead title="Mapa de calor de riesgos" subtitle="Probabilidad × impacto financiero, con conteo y residual promedio." actions={<Pill variant="amber">{riskHeatmap.reduce((a, b) => a + b.count, 0)} riesgos mapeados</Pill>} />
            <div className="panel-body" style={{ paddingTop: 14 }}>
              <RiskHeatmap data={riskHeatmap} />
              <div className="matrix-note">Las celdas muestran el número de riesgos. El color refleja la severidad combinada de probabilidad e impacto. Los riesgos sin coordenadas completas se declaran como dato faltante.</div>
            </div>
          </Panel>
          <Panel className="col-5" pad>
            <div className="section-head"><div><h3>Distribución por horizonte</h3><p>Corto, medio y largo plazo.</p></div><TrendingUp size={15} className="muted" /></div>
            {['Short term', 'Medium term', 'Long term'].map((h) => {
              const list = risks.filter((r) => r.horizon === h);
              return (
                <div key={h} style={{ marginBottom: 9 }}>
                  <div className="row"><span style={{ fontSize: 10 }}>{h}</span><span className="micro" style={{ marginLeft: 'auto' }}>{list.length} riesgos · residual medio {(list.reduce((a, b) => a + (b.residual || 0), 0) / Math.max(1, list.length)).toFixed(1)}</span></div>
                  <ProgressRow value={(list.length / Math.max(1, risks.length)) * 100} tone={h === 'Long term' ? 'amber' : 'ocean'} />
                </div>
              );
            })}
            <div className="divider" />
            <div className="micro" style={{ marginBottom: 6 }}>Riesgos por dimensión</div>
            {(['E', 'S', 'G'] as const).map((d) => {
              const list = risks.filter((r) => r.dimension === d);
              return <div key={d} className="row" style={{ padding: '5px 0' }}><Pill variant={d === 'E' ? 'green' : d === 'S' ? 'blue' : 'amber'}>{d}</Pill><span className="micro" style={{ marginLeft: 'auto' }}>{list.length} riesgos · {list.filter((r) => r.critical).length} críticos</span></div>;
            })}
          </Panel>
          <Panel className="col-12" pad>
            <div className="section-head"><div><h3>Matriz de priorización</h3><p>Exposición financiera frente a severidad de impacto.</p></div><ShieldAlert size={15} className="muted" /></div>
            <div className="grid grid-4">
              <div className="mini-card"><div className="label">Alto impacto / alta exposición</div><div className="value" style={{ color: 'var(--terracotta)' }}>{iros.filter((i) => i.impactScore >= 3.2 && i.financialScore >= 3.2).length}</div><div className="foot">doble material</div></div>
              <div className="mini-card"><div className="label">Alto impacto / baja exposición</div><div className="value">{iros.filter((i) => i.impactScore >= 3.2 && i.financialScore < 3.2).length}</div><div className="foot">prioridad de derechos</div></div>
              <div className="mini-card"><div className="label">Bajo impacto / alta exposición</div><div className="value" style={{ color: 'var(--ocean)' }}>{iros.filter((i) => i.impactScore < 3.2 && i.financialScore >= 3.2).length}</div><div className="foot">material financiero</div></div>
              <div className="mini-card"><div className="label">No material</div><div className="value">{iros.filter((i) => i.impactScore < 3.2 && i.financialScore < 3.2).length}</div><div className="foot">bajo los umbrales</div></div>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'opportunities' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-8">
            <PanelHead title="Oportunidades de transición" subtitle="Inversión, beneficio anual, horizonte y confianza de la estimación." actions={<Pill variant="green">{opportunities.length} oportunidades</Pill>} />
            <div className="panel-body" style={{ paddingTop: 6 }}>
              <OpportunityBars iros={opportunities} />
              <div className="divider" />
              <div className="table-wrap">
                <table className="data">
                  <thead><tr><th>Oportunidad</th><th>Asunto</th><th className="num">Inversión</th><th className="num">Beneficio/año</th><th>Horizonte</th><th>Confianza</th><th>Materialidad</th></tr></thead>
                  <tbody>
                    {opportunities.map((o) => (
                      <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => actions.openIRO(o)}>
                        <td><span className="strong">{o.title}</span><div className="sub"><span className="mono">{o.code}</span> · {o.owner}</div></td>
                        <td>{o.topicName}</td>
                        <td className="num">{money(o.investment)}</td>
                        <td className="num">{money(o.benefit)}</td>
                        <td>{o.horizon || '—'}</td>
                        <td><Pill variant={o.confidence === 'High' ? 'green' : o.confidence === 'Low' ? 'red' : 'amber'}>{o.confidence || '—'}</Pill></td>
                        <td><MaterialityPill value={o.materiality} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>
          <Panel className="col-4" pad>
            <div className="section-head"><div><h3>Calidad de la estimación</h3><p>Supuestos y límites del beneficio.</p></div><Coins size={15} className="muted" /></div>
            <div className="mini-card" style={{ marginBottom: 8 }}><div className="label">Inversión total</div><div className="value" style={{ fontSize: 17 }}>{money(investment)}</div><div className="foot">CAPEX estimado de las oportunidades registradas</div></div>
            <div className="mini-card" style={{ marginBottom: 8 }}><div className="label">Beneficio anual</div><div className="value" style={{ fontSize: 17 }}>{money(benefit)}</div><div className="foot">estimación antes de impuestos y riesgos</div></div>
            <div className="mini-card"><div className="label">Payback simple</div><div className="value" style={{ fontSize: 17 }}>{benefit > 0 ? `${(investment / benefit).toFixed(1)} años` : '—'}</div><div className="foot">sin descontar flujos ni inflación</div></div>
            <div className="divider" />
            <Callout tone="amber"><strong>El beneficio no se reconoce hasta validarlo.</strong> Las cifras son estimaciones de caso de negocio, no resultados contables. Deben validarse con Finanzas y con evidencia operativa.</Callout>
            <div className="divider" />
            <button className="btn sm" onClick={() => actions.navigate('climate')}>Ver plan de transición <ArrowRight size={12} /></button>
          </Panel>
        </div>
      )}

      {tab === 'controls' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-8">
            <PanelHead title="Controles y mitigación" subtitle="Controles vinculados a riesgos, eficacia probada y deficiencias." actions={<Pill variant="gray">{controls.length} controles</Pill>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Control</th><th>Riesgo mitigado</th><th>Frecuencia</th><th>Prueba</th><th className="num">Deficiencias</th><th>Estado</th></tr></thead>
                <tbody>
                  {controls.map((c) => (
                    <tr key={c.id}>
                      <td><span className="strong">{c.title}</span><div className="sub">{c.code} · {c.owner}</div></td>
                      <td>{c.risk}</td>
                      <td>{c.frequency}</td>
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
            <div className="section-head"><div><h3>Hallazgos abiertos</h3><p>Debilidades que afectan la mitigación.</p></div><ShieldAlert size={15} className="muted" /></div>
            {findings.filter((f) => f.status !== 'Closed').map((f) => (
              <div key={f.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <div className="row"><div style={{ fontSize: 10, fontWeight: 550, flex: 1 }}>{f.title}</div><Pill variant={f.severity === 'Critical' ? 'red' : f.severity === 'High' ? 'amber' : 'gray'}>{f.severity}</Pill></div>
                <div className="micro">{f.owner} · vence {f.dueDate}</div>
              </div>
            ))}
            <div className="divider" />
            <Callout tone="red"><strong>Un control deficiente no reduce el riesgo residual.</strong> El riesgo residual solo baja cuando la eficacia del control está probada y la evidencia se conserva.</Callout>
          </Panel>
        </div>
      )}
    </div>
  );
}
