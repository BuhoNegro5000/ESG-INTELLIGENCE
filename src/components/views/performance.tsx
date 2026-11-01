'use client';

import { useState } from 'react';
import { Activity, Gauge, Target, TrendingUp } from 'lucide-react';
import { KpiTrend } from '@/components/charts';
import { Panel, PanelHead, Pill, Progress, ProgressRow, Sparkline, Tabs } from '@/components/ui';
import { dateLabel, fmt } from '@/lib/format';
import type { KPI } from '@/lib/types';
import type { ViewProps } from './types';

export default function PerformanceView({ workspace }: ViewProps) {
  const [tab, setTab] = useState('all');
  const [selectedId, setSelectedId] = useState(workspace.kpis[0]?.id || '');
  const kpis = tab === 'all' ? workspace.kpis : workspace.kpis.filter((k) => k.dimension === tab);
  const selected = workspace.kpis.find((k) => k.id === selectedId) || workspace.kpis[0];
  const avg = (list: KPI[]) => list.length ? Math.round(list.reduce((a, b) => a + (b.progress || 0), 0) / list.length) : 0;
  const byDim = (d: string) => workspace.kpis.filter((k) => k.dimension === d);
  const atRisk = workspace.kpis.filter((k) => k.status === 'At risk');

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-copy">
          <div className="eyebrow">Desempeño ESG y gestión de impactos</div>
          <h1>Desempeño ESG</h1>
          <p>Indicadores conectados a definiciones, fuentes, líneas base, objetivos, evidencia y responsables. La calidad del dato se evalúa por separado del desempeño.</p>
        </div>
        <div className="page-head-actions"><Pill variant="green">{workspace.kpis.length} KPIs</Pill><Pill variant="amber">{atRisk.length} en riesgo</Pill></div>
      </div>

      <div className="grid grid-4">
        {(['E', 'S', 'G'] as const).map((d) => (
          <div className="panel stat-card" key={d}>
            <div className="stat-label">{d === 'E' ? 'Environmental' : d === 'S' ? 'Social' : 'Governance'}</div>
            <div className="stat-value" style={{ color: d === 'E' ? '#6fbf8f' : d === 'S' ? '#7fb2c7' : 'var(--amber)' }}>{avg(byDim(d))}<small>%</small></div>
            <div className="stat-foot">{byDim(d).length} indicadores · {byDim(d).filter((k) => k.status === 'On track').length} on track</div>
          </div>
        ))}
        <div className="panel stat-card">
          <div className="stat-label">Data quality</div>
          <div className="stat-value">{workspace.dataQuality.overall}<small>/100</small></div>
          <div className="stat-foot">trazabilidad {workspace.dataQuality.traceability}% · cobertura {workspace.dataQuality.coverage}%</div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}><Tabs active={tab} onChange={setTab} items={[{ key: 'all', label: 'Todos' }, { key: 'E', label: 'Environmental' }, { key: 'S', label: 'Social' }, { key: 'G', label: 'Governance' }]} /></div>

      <div className="grid grid-12" style={{ marginTop: 14 }}>
        <Panel className="col-8">
          <PanelHead title="Biblioteca de indicadores" subtitle="Selecciona un KPI para ver su trayectoria, fuente y método de cálculo." actions={<Pill variant="gray">{kpis.length} visibles</Pill>} />
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Indicador</th><th>Unidad</th><th className="num">Valor</th><th className="num">Objetivo</th><th>Progreso</th><th>Estado</th><th>Calidad</th></tr></thead>
              <tbody>
                {kpis.map((k) => (
                  <tr key={k.id} onClick={() => setSelectedId(k.id)} style={{ cursor: 'pointer', background: selected?.id === k.id ? 'rgba(201,155,81,.045)' : undefined }}>
                    <td><span className="strong">{k.name}</span><div className="sub">{k.code} · {k.framework} · {k.owner}</div></td>
                    <td>{k.unit}</td>
                    <td className="num">{fmt(k.value, 1)}</td>
                    <td className="num">{fmt(k.target, 1)}</td>
                    <td style={{ minWidth: 110 }}><ProgressRow value={k.progress || 0} tone={k.status === 'On track' ? 'green' : k.status === 'At risk' ? 'red' : 'amber'} /></td>
                    <td><Pill variant={k.status === 'On track' ? 'green' : k.status === 'At risk' ? 'red' : 'amber'}>{k.status}</Pill></td>
                    <td><span className="micro">{k.quality}/100</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel className="col-4">
          <PanelHead title={selected?.name || 'Indicador'} subtitle={selected ? `${selected.category} · ${selected.framework}` : ''} actions={<Pill variant="blue">{selected?.dimension}</Pill>} />
          <div className="panel-body" style={{ paddingTop: 8 }}>
            {selected && (
              <>
                <div className="row" style={{ alignItems: 'flex-end' }}>
                  <div><div className="micro">Valor actual</div><div style={{ fontSize: 28, fontWeight: 600 }}>{fmt(selected.value, 2)} <span style={{ fontSize: 10, color: 'var(--muted)' }}>{selected.unit}</span></div></div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}><div className="micro">Objetivo</div><div style={{ fontSize: 16, fontWeight: 600 }}>{fmt(selected.target, 2)}</div></div>
                </div>
                <KpiTrend kpi={selected} height={160} />
                <div className="divider" />
                <dl className="info-list">
                  <div className="info-row"><dt>Definición</dt><dd>{selected.name} — medición {selected.direction === 'lower' ? 'con menor valor mejor' : 'con mayor valor mejor'}.</dd></div>
                  <div className="info-row"><dt>Fuente</dt><dd>{selected.source}</dd></div>
                  <div className="info-row"><dt>Responsable</dt><dd>{selected.owner}</dd></div>
                  <div className="info-row"><dt>Calidad</dt><dd>{selected.quality}/100</dd></div>
                  <div className="info-row"><dt>Actualizado</dt><dd>{dateLabel(selected.updatedAt)}</dd></div>
                </dl>
                <div className="divider" />
                <div className="callout"><Gauge size={15} /><div><strong>No confundir calidad con desempeño.</strong> Un indicador con datos incompletos no debe producir una conclusión favorable. La calidad se evalúa por separado.</div></div>
              </>
            )}
          </div>
        </Panel>

        <Panel className="col-7" pad>
          <div className="section-head"><div><h3>Objetivos y avance</h3><p>Metas con línea base, horizonte, responsable y estado.</p></div><Target size={15} className="muted" /></div>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Objetivo</th><th>Asunto</th><th>Horizonte</th><th>Avance</th><th>Estado</th></tr></thead>
              <tbody>
                {workspace.targets.map((t) => (
                  <tr key={t.id}>
                    <td><span className="strong">{t.title}</span><div className="sub">{t.owner} · {fmt(t.current, 1)} / {fmt(t.target, 1)} {t.unit}</div></td>
                    <td>{t.topic}</td>
                    <td>{dateLabel(t.deadline)}</td>
                    <td style={{ minWidth: 110 }}><ProgressRow value={t.progress} tone={t.status === 'On track' ? 'green' : 'red'} /></td>
                    <td><Pill variant={t.status === 'On track' ? 'green' : 'red'}>{t.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="col-5" pad>
          <div className="section-head"><div><h3>Data Quality Score</h3><p>Dimensiones evaluadas por separado.</p></div><Activity size={15} className="muted" /></div>
          {Object.entries(workspace.dataQuality).filter(([k]) => k !== 'overall').map(([key, value]) => (
            <div key={key} style={{ marginBottom: 9 }}>
              <div className="row"><span style={{ fontSize: 10, textTransform: 'capitalize' }}>{key === 'traceability' ? 'Trazabilidad' : key === 'completeness' ? 'Completitud' : key === 'accuracy' ? 'Exactitud' : key === 'consistency' ? 'Consistencia' : key === 'timeliness' ? 'Oportunidad' : key === 'comparability' ? 'Comparabilidad' : 'Cobertura'}</span><span className="micro" style={{ marginLeft: 'auto' }}>{value}/100</span></div>
              <Progress value={Number(value)} tone={Number(value) >= 75 ? 'green' : Number(value) >= 55 ? 'amber' : 'red'} />
            </div>
          ))}
          <div className="divider" />
          <div className="row"><TrendingUp size={13} className="muted" /><span className="micro">La calidad del dato no equivale a desempeño ESG.</span></div>
        </Panel>
      </div>
    </div>
  );
}
