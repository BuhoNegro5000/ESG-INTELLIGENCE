'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowRight, Compass, Droplets, Leaf, MapPin, Mountain, ThermometerSun, Waves } from 'lucide-react';
import { ClimateScenarios } from '@/components/charts';
import { Callout, Panel, PanelHead, Pill, ProgressRow, Tabs } from '@/components/ui';
import { fmt, money, label, countLabel } from '@/lib/format';
import type { ViewProps } from './types';

export default function ClimateNatureView({ workspace, actions }: ViewProps) {
  const [tab, setTab] = useState('climate');
  const { climateScenarios, natureLocations, iros, kpis, targets } = workspace;
  const climateIros = iros.filter((i) => i.topicCode?.startsWith('E1'));
  const natureIros = iros.filter((i) => i.topicCode?.startsWith('E4') || i.topicCode?.startsWith('E3'));
  const climateKpis = kpis.filter((k) => k.dimension === 'E' && /carbon|emisi|energ|renew|electric|pue|water/i.test(k.name));
  const opportunities = iros.filter((i) => i.type === 'Opportunity' && (i.topicCode?.startsWith('E1') || i.topicCode?.startsWith('E4') || i.topicCode?.startsWith('E3')));
  const transitionTargets = targets.filter((t) => t.topic?.startsWith('E1') || t.topic?.startsWith('E4'));
  const capex = opportunities.reduce((a, b) => a + (b.investment || 0), 0);
  const benefit = opportunities.reduce((a, b) => a + (b.benefit || 0), 0);
  const physical = climateIros.filter((i) => /adapt|physical|heat|flood|water|drought|storm/i.test(`${i.title} ${i.description}`));
  const transition = climateIros.filter((i) => /regulat|carbon|market|customer|transition|price/i.test(`${i.title} ${i.description}`));

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-copy">
          <div className="eyebrow">Inteligencia climática y de naturaleza</div>
          <h1>Clima y naturaleza</h1>
          <p>Riesgos físicos y de transición, escenarios, plan de descarbonización y evaluación LEAP de dependencias, impactos y oportunidades relacionadas con la naturaleza.</p>
        </div>
        <div className="page-head-actions"><Pill variant="amber">Escenarios no son predicciones</Pill><Pill variant="blue">TNFD LEAP v2.0</Pill></div>
      </div>

      <div className="grid grid-4">
        <div className="panel stat-card"><div className="stat-label"><ThermometerSun size={11} /> Exposición climática</div><div className="stat-value">{workspace.company.climateExposure}<small>/100</small></div><div className="stat-foot">física + transición</div></div>
        <div className="panel stat-card"><div className="stat-label"><Leaf size={11} /> Dependencia de naturaleza</div><div className="stat-value">{workspace.company.natureDependency}<small>/100</small></div><div className="stat-foot">{countLabel(natureLocations.length, 'ubicación evaluada', 'ubicaciones evaluadas')}</div></div>
        <div className="panel stat-card"><div className="stat-label"><Compass size={11} /> Oportunidad de transición</div><div className="stat-value" style={{ color: '#6fbf8f' }}>{workspace.company.transitionOpportunity}<small>/100</small></div><div className="stat-foot">{countLabel(opportunities.length, 'oportunidad vinculada', 'oportunidades vinculadas')}</div></div>
        <div className="panel stat-card"><div className="stat-label"><Waves size={11} /> CAPEX / beneficio</div><div className="stat-value" style={{ fontSize: 19 }}>{money(capex)} <span style={{ color: 'var(--muted)' }}>/</span> {money(benefit)}</div><div className="stat-foot">inversión / beneficio anual estimado</div></div>
      </div>

      <div style={{ marginTop: 14 }}><Tabs active={tab} onChange={setTab} items={[{ key: 'climate', label: 'Clima y escenarios' }, { key: 'transition', label: 'Plan de transición' }, { key: 'nature', label: 'Naturaleza y LEAP' }]} /></div>

      {tab === 'climate' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-7">
            <PanelHead title="Comparación de escenarios climáticos" subtitle="Riesgo físico, riesgo de transición y oportunidad por escenario" actions={<Pill variant="gray">{countLabel(climateScenarios.length, 'escenario', 'escenarios')}</Pill>} />
            <div className="panel-body" style={{ paddingTop: 4 }}>
              <ClimateScenarios scenarios={climateScenarios} height={250} />
              <div className="matrix-note">Los escenarios incluyen fuente, horizonte, variables, supuestos y limitaciones. No representan pronósticos exactos ni una probabilidad calibrada.</div>
            </div>
          </Panel>
          <Panel className="col-5">
            <PanelHead title="Escenarios registrados" subtitle="Supuestos y lectura de resiliencia" />
            <div className="panel-body" style={{ paddingTop: 8 }}>
              {climateScenarios.map((s) => (
                <div key={s.id} className="mini-card" style={{ marginBottom: 8 }}>
                  <div className="row"><div style={{ fontSize: 11, fontWeight: 600 }}>{s.name}</div><Pill variant={s.probability === 'Downside' ? 'red' : 'gray'}>{s.warming}</Pill></div>
                  <div className="micro" style={{ marginTop: 4 }}>{s.source} · {label(s.horizon)}</div>
                  <p style={{ fontSize: 9.5, color: 'var(--muted)', marginTop: 5 }}>{s.description}</p>
                  <div className="row" style={{ marginTop: 5 }}><span className="micro">Físico {s.physicalRisk}/5</span><span className="micro">Transición {s.transitionRisk}/5</span><span className="micro" style={{ marginLeft: 'auto' }}>CAPEX {money(s.capex)}</span></div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="col-6" pad>
            <div className="section-head"><div><h3>Riesgos físicos</h3><p>Agudos y crónicos, con horizonte y consecuencia.</p></div><Mountain size={15} className="muted" /></div>
            {physical.slice(0, 4).map((i) => (
              <div key={i.id} className="iro-item" onClick={() => actions.openIRO(i)}><span className={`iro-mark ${i.materiality}`} /><div className="iro-body"><div className="iro-code">{i.code} · {label(i.actuality)}</div><div className="iro-title">{i.title}</div><div className="iro-meta"><span>{label(i.horizon)}</span><span className="dot-sep" /><span>{i.location}</span></div></div><div className="iro-scores"><span className="badge amber">Fin {i.financialScore.toFixed(1)}</span></div></div>
            ))}
          </Panel>
          <Panel className="col-6" pad>
            <div className="section-head"><div><h3>Riesgos de transición</h3><p>Regulación, mercado, tecnología y preferencias.</p></div><AlertTriangle size={15} className="muted" /></div>
            {transition.slice(0, 4).map((i) => (
              <div key={i.id} className="iro-item" onClick={() => actions.openIRO(i)}><span className={`iro-mark ${i.materiality}`} /><div className="iro-body"><div className="iro-code">{i.code} · {label(i.actuality)}</div><div className="iro-title">{i.title}</div><div className="iro-meta"><span>{label(i.horizon)}</span><span className="dot-sep" /><span>{i.topicName}</span></div></div><div className="iro-scores"><span className="badge blue">Fin {i.financialScore.toFixed(1)}</span></div></div>
            ))}
          </Panel>

          <Panel className="col-12" pad>
            <div className="section-head"><div><h3>Indicadores climáticos y de recursos</h3><p>Datos vinculados a la contabilidad de GEI y al desempeño operativo.</p></div><Pill variant="gray">{countLabel(climateKpis.length, 'KPI', 'KPIs')}</Pill></div>
            <div className="grid grid-4">
              {climateKpis.map((k) => (
                <div key={k.id} className="mini-card"><div className="label">{label(k.category)}</div><div style={{ fontSize: 18, fontWeight: 600, marginTop: 3 }}>{fmt(k.value, 2)} <span style={{ fontSize: 9, color: 'var(--muted)' }}>{k.unit}</span></div><div className="foot">Objetivo {fmt(k.target, 2)} · {label(k.status)}</div><ProgressRow value={k.progress || 0} tone={k.status === 'On track' ? 'green' : 'amber'} /></div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'transition' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-7" pad>
            <div className="section-head"><div><h3>Plan de descarbonización</h3><p>Año base, objetivos, medidas, presupuesto y emisiones residuales.</p></div><Pill variant="amber">En desarrollo</Pill></div>
            <div className="grid grid-3" style={{ gap: 8 }}>
              <div className="mini-card"><div className="label">Año base</div><div className="value">2024</div><div className="foot">inventario verificado</div></div>
              <div className="mini-card"><div className="label">Objetivo net zero</div><div className="value">2040</div><div className="foot">scope 1 + 2</div></div>
              <div className="mini-card"><div className="label">CAPEX transición</div><div className="value" style={{ fontSize: 16 }}>{money(capex)}</div><div className="foot">oportunidades registradas</div></div>
            </div>
            <div className="divider" />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Objetivo</th><th>Asunto</th><th>Línea base</th><th>Meta</th><th>Avance</th><th>Estado</th></tr></thead>
                <tbody>
                  {transitionTargets.map((t) => (
                    <tr key={t.id}><td><span className="strong">{t.title}</span><div className="sub">{t.owner}</div></td><td>{t.topic}</td><td>{fmt(t.baseline, 1)} {t.unit}</td><td>{fmt(t.target, 1)} {t.unit}</td><td style={{ minWidth: 100 }}><ProgressRow value={t.progress} tone={t.status === 'On track' ? 'green' : 'red'} /></td><td><Pill variant={t.status === 'On track' ? 'green' : 'red'}>{label(t.status)}</Pill></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divider" />
            <div className="callout"><Leaf size={15} /><div><strong>Separación contable.</strong> Reducciones dentro de la cadena de valor, remociones y compensaciones externas se registran por separado. No se presentan créditos de carbono como reducciones propias.</div></div>
          </Panel>
          <Panel className="col-5" pad>
            <div className="section-head"><div><h3>Medidas y oportunidades</h3><p>Palancas con inversión y beneficio estimado.</p></div><Compass size={15} className="muted" /></div>
            {opportunities.map((o) => (
              <div key={o.id} className="mini-card" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => actions.openIRO(o)}>
                <div className="row"><div style={{ fontSize: 10.5, fontWeight: 600, flex: 1 }}>{o.title}</div><Pill variant="green">{label(o.confidence)}</Pill></div>
                <div className="micro" style={{ marginTop: 3 }}>{o.code} · {o.topicName} · {label(o.horizon)}</div>
                <div className="row" style={{ marginTop: 6 }}><span className="micro">Inversión {money(o.investment)}</span><span className="micro" style={{ marginLeft: 'auto' }}>Beneficio {money(o.benefit)}/año</span></div>
              </div>
            ))}
            <div className="divider" />
            <div className="micro">Emisiones residuales y remociones</div>
            <div className="row" style={{ marginTop: 6 }}><span style={{ fontSize: 10 }}>Remociones registradas</span><span className="micro" style={{ marginLeft: 'auto' }}>No modeladas</span></div>
            <div className="notice" style={{ marginTop: 6 }}>La ausencia de datos de remociones se declara como limitación; no se asume cero.</div>
          </Panel>
        </div>
      )}

      {tab === 'nature' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-7">
            <PanelHead title="TNFD LEAP v2.0" subtitle="Localizar, Evaluar, Analizar, Preparar" actions={<Pill variant="blue">4 fases</Pill>} />
            <div className="panel-body" style={{ paddingTop: 8 }}>
              <div className="grid grid-2" style={{ gap: 8 }}>
                {[
                  ['L — Localizar', 'Identificar ubicaciones, cuencas, ecosistemas, áreas protegidas y hábitats críticos.', natureLocations.length, 'Completado'],
                  ['E — Evaluar', 'Evaluar dependencias, impactos, presiones y estado de la naturaleza.', natureIros.length, 'En progreso'],
                  ['A — Analizar', 'Evaluar riesgos físicos, de transición, sistémicos y oportunidades.', natureIros.filter((i) => i.type === 'Risk').length, 'En progreso'],
                  ['P — Preparar', 'Definir estrategia, objetivos, indicadores, acciones y monitoreo.', transitionTargets.length, 'Inicial'],
                ].map(([title, desc, count, status]) => (
                  <div key={String(title)} className="mini-card"><div className="row"><div className="label">{title}</div><Pill variant={status === 'Completado' ? 'green' : status === 'Inicial' ? 'gray' : 'amber'}>{status}</Pill></div><p style={{ fontSize: 9.5, color: 'var(--muted)', marginTop: 6 }}>{desc}</p><div className="foot">{countLabel(Number(count), 'registro vinculado', 'registros vinculados')}</div></div>
                ))}
              </div>
              <div className="divider" />
              <Callout tone="amber"><strong>Sin afirmaciones de impacto neto positivo.</strong> La plataforma no declara naturaleza positiva sin un método técnicamente justificado, línea base y verificación independiente.</Callout>
            </div>
          </Panel>
          <Panel className="col-5">
            <PanelHead title="Panel de naturaleza" subtitle="Ubicaciones prioritarias y presiones" actions={<Pill variant="gray">{natureLocations.length} sitios</Pill>} />
            <div className="panel-body" style={{ paddingTop: 8 }}>
              <div className="map-shell" style={{ minHeight: 190 }}>
                <div className="map-grid" /><div className="map-land" />
                {natureLocations.map((loc) => {
                  const left = Math.max(8, Math.min(92, ((loc.lng + 86) / 70) * 100));
                  const top = Math.max(12, Math.min(88, ((26 - loc.lat) / 58) * 100));
                  return <div key={loc.id} className={`map-point ${loc.risk === 'High' ? 'high' : loc.risk === 'Low' ? 'low' : ''}`} style={{ left: `${left}%`, top: `${top}%` }} title={`${loc.name} · ${loc.ecosystem}`}><span>{loc.name.split(' ')[0]}</span></div>;
                })}
                <div className="map-caption">Capas esquemáticas · no sustituyen un SIG verificado</div>
              </div>
              <div className="divider" />
              {natureLocations.slice(0, 3).map((loc) => (
                <div key={loc.id} className="row" style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}><Droplets size={12} className="muted" /><div style={{ flex: 1 }}><div style={{ fontSize: 9.5, fontWeight: 550 }}>{loc.name}</div><div className="micro">{loc.ecosystem} · estrés hídrico {label(loc.waterStress)}</div></div><Pill variant={loc.risk === 'High' ? 'red' : 'amber'}>{label(loc.risk)}</Pill></div>
              ))}
            </div>
          </Panel>
          <Panel className="col-12">
            <PanelHead title="Ubicaciones y dependencias" subtitle="Ecosistema, protección, dependencia, impacto y riesgo" actions={<button className="btn sm ghost" onClick={() => actions.navigate('valuechain')}>Ver cadena <ArrowRight size={12} /></button>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Ubicación</th><th>País</th><th>Ecosistema</th><th>Área protegida</th><th>Estrés hídrico</th><th>Dependencia</th><th>Impacto</th><th>Riesgo</th></tr></thead>
                <tbody>
                  {natureLocations.map((l) => (
                    <tr key={l.id}><td><span className="strong">{l.name}</span><div className="sub">{l.lat.toFixed(2)}, {l.lng.toFixed(2)}</div></td><td>{l.country}</td><td>{l.ecosystem}</td><td>{l.protected ? <Pill variant="red">Sí</Pill> : 'No'}</td><td>{label(l.waterStress)}</td><td>{label(l.dependency)}</td><td>{l.impact}</td><td><Pill variant={l.risk === 'High' ? 'red' : l.risk === 'Low' ? 'green' : 'amber'}>{label(l.risk)}</Pill></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
