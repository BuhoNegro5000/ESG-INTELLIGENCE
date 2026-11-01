'use client';

import {
  Activity, AlertTriangle, ArrowRight, BadgeCheck, Building2, CircleDot, Compass,
  FileCheck2, Gauge, Globe2, Leaf, ListFilter, MapPin, Network, ShieldAlert, Sparkles, Users,
} from 'lucide-react';
import { CoverageBars, MaterialityMatrix, PerformanceTrend, RiskHeatmap } from '@/components/charts';
import { AnimatedNumber, Callout, Donut, EmptyState, MaterialityPill, Panel, PanelHead, Pill, Progress, ProgressRow, ScoreBox, Sparkline, Stat } from '@/components/ui';
import { fmt, materialityLabel, money, pct } from '@/lib/format';
import type { ViewProps } from './types';

const HERO_IMAGE: Record<string, string> = {
  'andean-copper': '/unsplash/mist.jpg',
  'valle-verde': '/unsplash/leaves.jpg',
  'pacific-logistics': '/unsplash/solar.jpg',
  'bosque-azul': '/unsplash/water.jpg',
  'alimentos-pacifico': '/unsplash/leaves.jpg',
  'financia-andina': '/unsplash/forest.jpg',
  'novatech-digital': '/unsplash/solar.jpg',
  'textiles-sur': '/unsplash/people.jpg',
};

export default function OverviewView({ workspace, portfolio, actions }: ViewProps) {
  const { company, kpis, iros, materialityTopics, materialityDistribution, riskHeatmap, frameworkCoverage, stakeholders, evidence, controls, findings, natureLocations, valueChainExposure } = workspace;
  const critical = iros.filter((i) => i.critical).slice(0, 6);
  const material = materialityTopics.filter((t) => t.materiality !== 'not');
  const topMaterial = [...material].sort((a, b) => (b.impact + b.financial) - (a.impact + a.financial)).slice(0, 5);
  const openGrievances = workspace.grievances.filter((g) => g.status !== 'Resolved');
  const verifiedEvidence = evidence.filter((e) => e.status === 'Verified').length;
  const highFindings = findings.filter((f) => f.severity === 'Critical' || f.severity === 'High').length;
  const opportunities = iros.filter((i) => i.type === 'Opportunity');
  const transitionBenefit = opportunities.reduce((a, b) => a + (b.benefit || 0), 0);
  const transitionInvest = opportunities.reduce((a, b) => a + (b.investment || 0), 0);
  const eKpis = kpis.filter((k) => k.dimension === 'E');
  const sKpis = kpis.filter((k) => k.dimension === 'S');
  const gKpis = kpis.filter((k) => k.dimension === 'G');
  const avgProgress = (list: typeof kpis) => list.length ? Math.round(list.reduce((a, b) => a + (b.progress || 0), 0) / list.length) : 0;
  const eSpark = eKpis[0]?.history.map((h) => h.value) || [];
  const sSpark = sKpis[0]?.history.map((h) => h.value) || [];
  const gSpark = gKpis[0]?.history.map((h) => h.value) || [];

  return (
    <div className="fade-in">
      <section className="hero">
        <div className="hero-photo" style={{ backgroundImage: `url(${HERO_IMAGE[company.id] || HERO_IMAGE['andean-copper']})` }} />
        <div className="hero-orbit" />
        <div className="hero-content">
          <div className="hero-copy">
            <div className="eyebrow">Inteligencia de sostenibilidad corporativa · FY2026</div>
            <h1>{company.name}</h1>
            <p>{company.description}</p>
            <div className="hero-meta">
              <span className="chip"><Building2 size={11} /> {company.sector}</span>
              <span className="chip"><Globe2 size={11} /> {company.country} · {workspace.facilities.length} instalaciones</span>
              <span className="chip"><Users size={11} /> {fmt(company.employees)} empleados</span>
              <span className="chip"><CircleDot size={11} /> Evaluación <strong>{workspace.assessment?.status || 'Draft'}</strong></span>
              <span className="chip"><BadgeCheck size={11} /> {company.assuranceStatus}</span>
            </div>
          </div>
          <div className="hero-score">
            <div className="hero-score-label">Índice de integridad del dato</div>
            <div className="hero-score-value"><AnimatedNumber value={company.dataQuality} /><span>/100</span></div>
            <div className="hero-score-bar"><i style={{ width: `${company.dataQuality}%` }} /></div>
            <div className="hero-score-foot">{verifiedEvidence} evidencias verificadas · {company.reportingCoverage}% cobertura de divulgación</div>
          </div>
        </div>
      </section>

      <div className="grid grid-5" style={{ marginTop: 14 }}>
        <Stat label="Asuntos materiales" value={company.materialityCount} suffix="temas" foot={`${material.filter((t) => t.materiality === 'both').length} en ambas dimensiones`} icon={<Compass size={11} />} />
        <Stat label="IRO críticos" value={company.criticalIros} suffix="registros" foot={`${iros.filter((i) => i.materiality === 'both').length} doble material`} icon={<ShieldAlert size={11} />} />
        <Stat label="Desempeño E / S / G" value={`${avgProgress(eKpis)} / ${avgProgress(sKpis)} / ${avgProgress(gKpis)}`} suffix="%" foot="Progreso vs. línea base" icon={<Activity size={11} />} />
        <Stat label="Cobertura de reporte" value={company.reportingCoverage} suffix="%" foot={`${workspace.reports.filter((r) => r.status === 'Published').length} reportes publicados`} icon={<FileCheck2 size={11} />} />
        <Stat label="Objetivos" value={company.targetProgress} suffix="%" foot={`${workspace.targets.filter((t) => t.status === 'At risk').length} en riesgo`} icon={<Gauge size={11} />} />
      </div>

      <div className="grid grid-12" style={{ marginTop: 14 }}>
        <Panel className="col-7">
          <PanelHead title="Panorama de doble materialidad" subtitle="Posición de cada asunto en los dos ejes independientes" actions={<button className="btn sm ghost" onClick={() => actions.navigate('materiality')}>Abrir centro <ArrowRight size={12} /></button>} />
          <div className="panel-body" style={{ paddingTop: 6 }}>
            <MaterialityMatrix topics={materialityTopics} onSelect={() => actions.navigate('materiality')} height={338} />
          </div>
        </Panel>

        <Panel className="col-5">
          <PanelHead title="Inteligencia de IRO" subtitle="Prioridad por severidad, derechos y exposición financiera" actions={<Pill variant="red">{critical.length} críticos</Pill>} />
          <div className="panel-body" style={{ paddingTop: 4 }}>
            {critical.length === 0 && <EmptyState title="Sin IRO críticos" text="El registro no contiene impactos o riesgos por encima del umbral crítico." />}
            {critical.map((iro) => (
              <div key={iro.id} className="iro-item" onClick={() => actions.openIRO(iro)}>
                <span className={`iro-mark ${iro.materiality}`} />
                <div className="iro-body">
                  <div className="iro-code">{iro.code} · {iro.type}</div>
                  <div className="iro-title">{iro.title}</div>
                  <div className="iro-meta">
                    <span>{iro.topicName}</span><span className="dot-sep" /><span>{iro.stage || 'Value chain'}</span>
                    {iro.rights && iro.rights !== '—' && <><span className="dot-sep" /><span style={{ color: 'var(--terracotta)' }}>Derechos</span></>}
                  </div>
                </div>
                <div className="iro-scores">
                  <ScoreBox value={iro.impactScore.toFixed(1)} label="Imp" tone="red" />
                  <ScoreBox value={iro.financialScore.toFixed(1)} label="Fin" tone="blue" />
                </div>
              </div>
            ))}
            <div className="matrix-note" style={{ marginTop: 6 }}>Selecciona un registro para revisar evidencia, justificación, metodología y estado de aprobación.</div>
          </div>
        </Panel>

        <Panel className="col-7">
          <PanelHead title="Desempeño ESG" subtitle="Trayectoria normalizada de los indicadores vs. línea base y objetivo" actions={<Pill variant="green">{kpis.length} KPIs activos</Pill>} />
          <div className="panel-body" style={{ paddingTop: 4 }}>
            <PerformanceTrend kpis={kpis} height={226} />
            <div className="metric-strip" style={{ marginTop: 10 }}>
              <div><div className="label">Ambiental</div><div className="value text-e">{avgProgress(eKpis)}%</div><div className="sub">progreso agregado</div></div>
              <div><div className="label">Social</div><div className="value text-s">{avgProgress(sKpis)}%</div><div className="sub">progreso agregado</div></div>
              <div><div className="label">Gobernanza</div><div className="value text-g">{avgProgress(gKpis)}%</div><div className="sub">progreso agregado</div></div>
              <div><div className="label">Calidad del dato</div><div className="value">{company.dataQuality}</div><div className="sub">índice /100</div></div>
            </div>
          </div>
        </Panel>

        <Panel className="col-5">
          <PanelHead title="Mapa de calor de riesgos y oportunidades" subtitle="Riesgos financieros por probabilidad e impacto" actions={<Pill variant="amber">{iros.filter((i) => i.type === 'Risk').length} riesgos</Pill>} />
          <div className="panel-body" style={{ paddingTop: 12 }}>
            <RiskHeatmap data={riskHeatmap} />
            <div className="divider" />
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div className="micro">Oportunidad de transición</div>
                <div style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>{company.transitionOpportunity}<span style={{ fontSize: 10, color: 'var(--muted)' }}>/100</span></div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="micro">Inversión / beneficio anual</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{money(transitionInvest)} <span style={{ color: 'var(--muted)' }}>/</span> {money(transitionBenefit)}</div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="col-7">
          <PanelHead title="Exposición de la cadena de valor" subtitle="Concentración de impactos y exposición financiera por etapa" actions={<button className="btn sm ghost" onClick={() => actions.navigate('valuechain')}>Ver cadena <ArrowRight size={12} /></button>} />
          <div className="panel-body" style={{ paddingTop: 10 }}>
            <div className="value-chain">
              {valueChainExposure.map((s, idx) => (
                <div className="vc-stage" key={s.stage}>
                  <div className="vc-card">
                    <div className="vc-num">0{idx + 1}</div>
                    <div className="vc-name">{s.stage}</div>
                    <div className="vc-bar"><i style={{ width: `${Math.min(100, s.impact * 20)}%` }} /></div>
                    <div className="vc-meta"><span>Imp {s.impact}</span><span>Fin {s.financial}</span></div>
                    <div className="vc-meta" style={{ marginTop: 2 }}><span>{s.count} IRO</span></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-3" style={{ marginTop: 12, gap: 8 }}>
              <div className="mini-card"><div className="label">Upstream</div><div className="value">{valueChainExposure.filter((v) => v.stage === 'Upstream').reduce((a, b) => a + b.count, 0)}</div><div className="foot">IROs en proveedores y materias primas</div></div>
              <div className="mini-card"><div className="label">Own operations</div><div className="value">{valueChainExposure.filter((v) => v.stage === 'Own operations').reduce((a, b) => a + b.count, 0)}</div><div className="foot">IROs en operaciones propias</div></div>
              <div className="mini-card"><div className="label">Downstream</div><div className="value">{valueChainExposure.filter((v) => v.stage === 'Downstream').reduce((a, b) => a + b.count, 0)}</div><div className="foot">IROs en uso, distribución y fin de vida</div></div>
            </div>
          </div>
        </Panel>

        <Panel className="col-5">
          <PanelHead title="Exposición climática y de naturaleza" subtitle="Ubicaciones con estrés hídrico y sensibilidad ecosistémica" actions={<Pill variant="blue">{natureLocations.length} sitios</Pill>} />
          <div className="panel-body" style={{ paddingTop: 10 }}>
            <div className="map-shell">
              <div className="map-grid" />
              <div className="map-land" />
              {natureLocations.map((loc) => {
                const left = Math.max(8, Math.min(92, ((loc.lng + 86) / 70) * 100));
                const top = Math.max(12, Math.min(88, ((26 - loc.lat) / 58) * 100));
                return <div key={loc.id} className={`map-point ${loc.risk === 'High' ? 'high' : loc.risk === 'Low' ? 'low' : ''}`} style={{ left: `${left}%`, top: `${top}%` }} title={`${loc.name} · ${loc.ecosystem} · riesgo ${loc.risk}`}><span>{loc.name.split(' ')[0]}</span></div>;
              })}
              <div className="map-caption">Basemap esquemático · lat/long de instalaciones · no es una capa GIS certificada</div>
              <div className="map-legend"><span>● Alto</span><span>● Medio</span><span>● Bajo</span></div>
            </div>
            <div className="grid grid-3" style={{ marginTop: 10, gap: 8 }}>
              <div className="mini-card"><div className="label">Climate exposure</div><div className="value">{company.climateExposure}</div><div className="foot">score /100</div></div>
              <div className="mini-card"><div className="label">Nature dependency</div><div className="value">{company.natureDependency}</div><div className="foot">score /100</div></div>
              <div className="mini-card"><div className="label">Protected sites</div><div className="value">{natureLocations.filter((l) => l.protected).length}</div><div className="foot">ubicaciones</div></div>
            </div>
          </div>
        </Panel>

        <Panel className="col-4">
          <PanelHead title="Preparación para divulgar" subtitle="Cobertura por marco" actions={<button className="btn sm ghost" onClick={() => actions.navigate('reporting')}>Abrir</button>} />
          <div className="panel-body" style={{ paddingTop: 10 }}>
            <CoverageBars data={frameworkCoverage.slice(0, 5)} />
            <div className="divider" />
            <div className="row">
              <div style={{ flex: 1 }}>
                <div className="micro">Cobertura promedio</div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{company.reportingCoverage}%</div>
              </div>
              <Pill variant={company.reportingCoverage > 75 ? 'green' : 'amber'}>{workspace.disclosures.filter((d) => d.status === 'Gap').length} brechas</Pill>
            </div>
          </div>
        </Panel>

        <Panel className="col-4">
          <PanelHead title="Inteligencia de grupos de interés" subtitle="Exposición, vulnerabilidad y relacionamiento" actions={<button className="btn sm ghost" onClick={() => actions.navigate('social')}>Abrir</button>} />
          <div className="panel-body" style={{ paddingTop: 10 }}>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div className="micro">Grupos registrados</div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{stakeholders.length}</div>
                <div className="micro" style={{ marginTop: 3 }}>{workspace.engagements.length} procesos de participación</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="micro">Reclamos abiertos</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: openGrievances.some((g) => g.severity === 'Critical') ? 'var(--terracotta)' : 'var(--text)' }}>{openGrievances.length}</div>
                <div className="micro" style={{ marginTop: 3 }}>{openGrievances.filter((g) => g.severity === 'Critical').length} críticos</div>
              </div>
            </div>
            <div className="divider" />
            {stakeholders.slice(0, 3).map((s) => (
              <div key={s.id} className="row" style={{ marginBottom: 9 }}>
                <div className="avatar" style={{ width: 25, height: 25, flex: '0 0 25px', fontSize: 8 }}>{s.name.slice(0, 2).toUpperCase()}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 550, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                  <div className="micro">{s.category} · exposición {s.exposure}/5</div>
                </div>
                <Pill variant={s.vulnerability >= 4 ? 'red' : 'gray'}>{s.vulnerability >= 4 ? 'Alta' : 'Media'}</Pill>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="col-4">
          <PanelHead title="Aseguramiento y calidad del dato" subtitle="Evidencia, controles y hallazgos" actions={<button className="btn sm ghost" onClick={() => actions.navigate('assurance')}>Abrir</button>} />
          <div className="panel-body" style={{ paddingTop: 10 }}>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div className="micro">Data quality</div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{workspace.dataQuality.overall}<span style={{ fontSize: 10, color: 'var(--muted)' }}>/100</span></div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="micro">Evidencia verificada</div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{verifiedEvidence}<span style={{ fontSize: 10, color: 'var(--muted)' }}>/{evidence.length}</span></div>
              </div>
            </div>
            <div className="divider" />
            <div className="row" style={{ marginBottom: 7 }}>
              <span style={{ fontSize: 10 }}>Controles operativos</span>
              <span className="micro" style={{ marginLeft: 'auto' }}>{controls.filter((c) => c.status === 'Operating').length}/{controls.length}</span>
            </div>
            <ProgressRow value={(controls.filter((c) => c.status === 'Operating').length / Math.max(1, controls.length)) * 100} tone="green" />
            <div className="row" style={{ marginTop: 9 }}>
              <Pill variant={highFindings ? 'red' : 'green'}>{highFindings} hallazgos altos</Pill>
              <span className="micro" style={{ marginLeft: 'auto' }}>{company.assuranceStatus}</span>
            </div>
          </div>
        </Panel>

        <Panel className="col-12" style={{ padding: 0 }}>
          <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 18, padding: 18 }}>
            <div>
              <div className="eyebrow">Resumen ejecutivo</div>
              <h3 style={{ marginTop: 6, fontSize: 16 }}>Lo que la dirección debería observar esta semana</h3>
              <p className="muted" style={{ fontSize: 10.5, marginTop: 6 }}>
                {critical[0] ? <>El IRO <strong style={{ color: 'var(--text-2)' }}>{critical[0].code}</strong> — {critical[0].title} — combina una severidad de impacto de {critical[0].impactScore}/5 con una exposición financiera de {critical[0].financialScore}/5. {critical[0].rights && critical[0].rights !== '—' ? 'Incluye una dimensión de derechos humanos que exige consideración prioritaria.' : 'Requiere revisión de controles y evidencia.'}</> : 'El registro no presenta IRO críticos.'}
              </p>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn sm primary" onClick={() => critical[0] ? actions.openIRO(critical[0]) : actions.navigate('iros')}>Abrir ficha crítica <ArrowRight size={12} /></button>
                <button className="btn sm ghost" onClick={() => actions.navigate('ai')}><Sparkles size={12} /> Preguntar a la IA</button>
              </div>
            </div>
            <div>
              <div className="micro" style={{ marginBottom: 8 }}>Alertas de gestión</div>
              {highFindings > 0 && <Callout tone="red"><strong>{highFindings} hallazgos altos o críticos</strong> requieren acción correctiva y evidencia de cierre.</Callout>}
              {openGrievances.some((g) => g.severity === 'Critical') && <div style={{ marginTop: 6 }}><Callout tone="red"><strong>Reclamo crítico abierto.</strong> Revisar acceso a remediación y protección contra represalias.</Callout></div>}
              {company.reportingCoverage < 60 && <div style={{ marginTop: 6 }}><Callout tone="amber"><strong>Cobertura de divulgación insuficiente.</strong> Asignar responsables a las brechas ESRS y CDP.</Callout></div>}
            </div>
            <div>
              <div className="micro" style={{ marginBottom: 8 }}>Portfolio signal</div>
              <div className="mini-card">
                <div className="label">Posición relativa</div>
                <div className="value">{company.dataQuality >= portfolio.summary.dataQuality ? 'Sobre' : 'Bajo'} la media</div>
                <div className="foot">Data quality {company.dataQuality} vs. portafolio {portfolio.summary.dataQuality}. La comparación no ajusta por sector ni perímetro.</div>
              </div>
              <div className="notice" style={{ marginTop: 8 }}>Las conclusiones ilustran el funcionamiento del sistema y no constituyen una opinión de aseguramiento.</div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
