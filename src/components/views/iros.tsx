'use client';

import { useMemo, useState } from 'react';
import { Filter, Plus, Search, ShieldAlert, SlidersHorizontal } from 'lucide-react';
import { MaterialityPill, Panel, PanelHead, Pill, ScoreBox, Tabs } from '@/components/ui';
import { materialityLabel } from '@/lib/format';
import type { IRO } from '@/lib/types';
import type { ViewProps } from './types';

export default function IROView({ workspace, actions }: ViewProps) {
  const [type, setType] = useState('all');
  const [materiality, setMateriality] = useState('all');
  const [dimension, setDimension] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'severity' | 'financial' | 'code'>('severity');
  const { iros } = workspace;

  const filtered = useMemo(() => {
    let list = [...iros];
    if (type !== 'all') list = list.filter((i) => i.type === type);
    if (materiality !== 'all') list = list.filter((i) => i.materiality === materiality);
    if (dimension !== 'all') list = list.filter((i) => i.dimension === dimension);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((i) => `${i.code} ${i.title} ${i.description} ${i.topicName} ${i.owner}`.toLowerCase().includes(q));
    }
    if (sort === 'financial') list.sort((a, b) => b.financialScore - a.financialScore);
    else if (sort === 'code') list.sort((a, b) => a.code.localeCompare(b.code));
    else list.sort((a, b) => (b.critical - a.critical) || (b.impactScore + b.financialScore) - (a.impactScore + a.financialScore));
    return list;
  }, [iros, type, materiality, dimension, query, sort]);

  const critical = iros.filter((i) => i.critical);
  const both = iros.filter((i) => i.materiality === 'both');

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-copy">
          <div className="eyebrow">Registro de impactos, riesgos y oportunidades</div>
          <h1>Registro IRO</h1>
          <p>El registro central que conecta asuntos ESG, actividades, ubicaciones, grupos de interés, derechos, evidencia y evaluación. Cada registro conserva su metodología y trazabilidad.</p>
        </div>
        <div className="page-head-actions">
          <button className="btn primary" onClick={actions.createIRO}><Plus size={13} /> Nuevo IRO</button>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="panel stat-card"><div className="stat-label">Total IRO</div><div className="stat-value">{iros.length}</div><div className="stat-foot">{iros.filter((i) => i.type === 'Impact').length} impactos · {iros.filter((i) => i.type === 'Risk').length} riesgos · {iros.filter((i) => i.type === 'Opportunity').length} oportunidades</div></div>
        <div className="panel stat-card"><div className="stat-label">Doble material</div><div className="stat-value" style={{ color: 'var(--amber)' }}>{both.length}</div><div className="stat-foot">material en ambos ejes</div></div>
        <div className="panel stat-card"><div className="stat-label">Críticos</div><div className="stat-value" style={{ color: 'var(--terracotta)' }}>{critical.length}</div><div className="stat-foot">severidad o derechos</div></div>
        <div className="panel stat-card"><div className="stat-label">Con evidencia</div><div className="stat-value">{iros.filter((i) => i.evidence).length}</div><div className="stat-foot">vinculados a una fuente</div></div>
      </div>

      <Panel style={{ marginTop: 14 }} pad>
        <div className="row wrap" style={{ gap: 8 }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--muted)' }} />
            <input className="input" placeholder="Buscar por código, asunto, actividad, responsable…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: 30 }} />
          </div>
          <select className="select" style={{ width: 138 }} value={type} onChange={(e) => setType(e.target.value)}><option value="all">Todos los tipos</option><option value="Impact">Impacto</option><option value="Risk">Riesgo</option><option value="Opportunity">Oportunidad</option></select>
          <select className="select" style={{ width: 172 }} value={materiality} onChange={(e) => setMateriality(e.target.value)}><option value="all">Toda materialidad</option><option value="both">Doble material</option><option value="impact">Impacto</option><option value="financial">Financiera</option><option value="not">No material</option></select>
          <select className="select" style={{ width: 132 }} value={dimension} onChange={(e) => setDimension(e.target.value)}><option value="all">Dimensión</option><option value="E">Environmental</option><option value="S">Social</option><option value="G">Governance</option></select>
          <select className="select" style={{ width: 148 }} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option value="severity">Prioridad</option><option value="financial">Exposición financiera</option><option value="code">Código</option></select>
          <Pill variant="gray"><Filter size={10} /> {filtered.length} resultados</Pill>
        </div>
        <div className="divider" />
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>IRO</th><th>Tipo</th><th>Asunto</th><th>Materialidad</th><th className="num">Impacto</th><th className="num">Financiero</th><th>Cadena</th><th>Responsable</th><th>Estado</th></tr></thead>
            <tbody>
              {filtered.map((iro) => (
                <tr key={iro.id} style={{ cursor: 'pointer' }} onClick={() => actions.openIRO(iro)}>
                  <td><span className="strong">{iro.title}</span><div className="sub"><span className="mono">{iro.code}</span> · {iro.actuality} · {iro.nature}</div></td>
                  <td><Pill variant={iro.type === 'Impact' ? 'red' : iro.type === 'Risk' ? 'amber' : 'green'}>{iro.type}</Pill></td>
                  <td>{iro.topicName}<div className="sub">{iro.esrs}</div></td>
                  <td><MaterialityPill value={iro.materiality} /></td>
                  <td className="num">{iro.impactScore.toFixed(1)}</td>
                  <td className="num">{iro.financialScore.toFixed(1)}</td>
                  <td>{iro.stage}<div className="sub">{iro.location}</div></td>
                  <td>{iro.owner}</td>
                  <td>{iro.critical ? <Pill variant="red">Crítico</Pill> : <Pill variant={iro.status === 'Approved' ? 'green' : 'gray'}>{iro.status}</Pill>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="table-empty">No hay IRO que coincidan con los filtros.</div>}
        </div>
        <div className="table-footer"><span>Mostrando {filtered.length} de {iros.length} registros</span><span>Los valores de impacto y financiero son independientes y no se agregan.</span></div>
      </Panel>

      <div className="grid grid-12" style={{ marginTop: 14 }}>
        <Panel className="col-7" pad>
          <div className="section-head"><div><h3>Lectura de la cartera de IRO</h3><p>Distribución por tipo y etapa de la cadena de valor.</p></div><SlidersHorizontal size={15} className="muted" /></div>
          <div className="grid grid-3" style={{ gap: 8 }}>
            {['Impact', 'Risk', 'Opportunity'].map((t) => {
              const list = iros.filter((i) => i.type === t);
              const criticalCount = list.filter((i) => i.critical).length;
              return <div key={t} className="mini-card"><div className="label">{t}</div><div className="value">{list.length}</div><div className="foot">{criticalCount} críticos · {list.filter((i) => i.materiality === 'both').length} doble material</div></div>;
            })}
          </div>
          <div className="divider" />
          {['Upstream', 'Own operations', 'Downstream'].map((stage) => {
            const list = iros.filter((i) => i.stage === stage);
            const avg = list.length ? list.reduce((a, b) => a + b.impactScore, 0) / list.length : 0;
            return <div key={stage} style={{ marginBottom: 9 }}><div className="row"><span style={{ fontSize: 10 }}>{stage}</span><span className="micro" style={{ marginLeft: 'auto' }}>{list.length} IRO · severidad media {avg.toFixed(1)}</span></div><div className="progress" style={{ marginTop: 4 }}><i style={{ width: `${(avg / 5) * 100}%`, background: avg >= 4 ? 'var(--terracotta)' : 'var(--sage)' }} /></div></div>;
          })}
        </Panel>
        <Panel className="col-5" pad>
          <div className="section-head"><div><h3>Controles del registro</h3><p>Reglas que protegen la calidad y la comparabilidad.</p></div><ShieldAlert size={15} className="muted" /></div>
          <div className="stack">
            <div className="callout"><ShieldAlert size={15} /><div><strong>Sin promedios que oculten gravedad.</strong> La evaluación conserva escala, alcance e irremediabilidad por separado. Un impacto severo sobre derechos humanos recibe prioridad incluso con baja probabilidad.</div></div>
            <div className="callout"><ShieldAlert size={15} /><div><strong>Dos ejes independientes.</strong> La materialidad financiera no compensa un impacto negativo crítico. La matriz no genera una puntuación ESG única.</div></div>
            <div className="callout"><ShieldAlert size={15} /><div><strong>Evidencia y fuente.</strong> Cada registro debe indicar la evidencia que respalda la evaluación. Un registro sin fuente queda en estado Draft.</div></div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
